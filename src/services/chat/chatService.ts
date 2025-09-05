import { createClient } from "@/utils/supabase/client";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  status: "sent" | "delivered" | "read";
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  last_message_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ChatService {
  // User cache to prevent repeated API calls
  private static userCache = new Map<string, any>();
  private static cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private static cacheTimestamps = new Map<string, number>();

  /**
   * Get cached user or fetch from database
   */
  private static async getCachedUserDetails(userId: string) {
    const now = Date.now();
    const cached = this.userCache.get(userId);
    const timestamp = this.cacheTimestamps.get(userId);

    if (cached && timestamp && now - timestamp < this.cacheExpiry) {
      return cached;
    }

    const userDetails = await this.getUserDetails(userId);
    this.userCache.set(userId, userDetails);
    this.cacheTimestamps.set(userId, now);

    return userDetails;
  }
  /**
   * Send a message to a conversation
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
    fileUrl?: string
  ) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        file_url: fileUrl || null,
        status: "delivered", // Start with delivered status
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update conversation's last_message_id and last_message_at
    await this.updateConversationLastMessage(conversationId, data.id);

    return data;
  }

  /**
   * Fetch messages for a conversation with pagination
   */
  static async fetchMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Fetch messages with user details in a single query (solves N+1 problem)
   */
  static async fetchMessagesWithUsers(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:users!messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          profile_image_url,
          role
        )
      `
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Fetch the latest message for a conversation (for sidebar preview)
   */
  static async fetchLatestMessage(conversationId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from("messages")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId) // Don't mark own messages as read
      .is("read_at", null);

    if (error) {
      throw error;
    }
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(
    messageId: string,
    status: "sent" | "delivered" | "read"
  ) {
    const supabase = createClient();

    const updateData: any = { status };
    if (status === "read") {
      updateData.read_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("messages")
      .update(updateData)
      .eq("id", messageId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(conversationId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        matches!inner(
          *,
          job_posts(*),
          kindbossing:users!matches_kindbossing_id_fkey(*),
          kindtao:users!matches_kindtao_id_fkey(*)
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get conversations for a user
   */
  static async getUserConversations(userId: string) {
    const supabase = createClient();

    // First, get all matches for this user
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id")
      .or(`kindbossing_id.eq.${userId},kindtao_id.eq.${userId}`);

    if (matchesError) {
      throw matchesError;
    }

    if (!matches || matches.length === 0) {
      return [];
    }

    const matchIds = matches.map((match) => match.id);

    // Then get conversations for these matches
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        matches!inner(
          *,
          job_posts(*),
          kindbossing:users!matches_kindbossing_id_fkey(*),
          kindtao:users!matches_kindtao_id_fkey(*)
        )
      `
      )
      .in("match_id", matchIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update conversation's last message
   */
  private static async updateConversationLastMessage(
    conversationId: string,
    messageId: string
  ) {
    const supabase = createClient();

    const { error } = await supabase
      .from("conversations")
      .update({
        last_message_id: messageId,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      throw error;
    }
  }

  /**
   * Create a new conversation from a match
   */
  static async createConversation(matchId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        match_id: matchId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get user details by ID
   */
  static async getUserDetails(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get unread message count for a conversation
   */
  static async getUnreadCount(conversationId: string, userId: string) {
    const supabase = createClient();

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      return 0;
    }

    return count || 0;
  }

  /**
   * Get the conversation where the user last sent a message
   */
  static async getLastSentConversation(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("conversation_id, created_at")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }
}
