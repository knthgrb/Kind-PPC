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

  // Conversation cache for frequently accessed data
  private static conversationCache = new Map<string, any>();
  private static conversationCacheExpiry = 2 * 60 * 1000; // 2 minutes
  private static conversationCacheTimestamps = new Map<string, number>();

  // Last sent conversation cache
  private static lastSentCache = new Map<string, any>();
  private static lastSentCacheExpiry = 30 * 1000; // 30 seconds
  private static lastSentCacheTimestamps = new Map<string, number>();

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
   * Get unread counts for multiple conversations in a single query
   */
  static async getUnreadCountsForConversations(
    conversationIds: string[],
    userId: string
  ) {
    if (conversationIds.length === 0) return new Map();

    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", conversationIds)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      console.error("Error fetching unread counts:", error);
      return new Map();
    }

    // Count messages per conversation
    const counts = new Map<string, number>();
    conversationIds.forEach((id) => counts.set(id, 0));

    data?.forEach((message) => {
      const current = counts.get(message.conversation_id) || 0;
      counts.set(message.conversation_id, current + 1);
    });

    return counts;
  }

  /**
   * Get latest messages for multiple conversations in a single query
   */
  static async getLatestMessagesForConversations(conversationIds: string[]) {
    if (conversationIds.length === 0) return new Map();

    const supabase = createClient();

    // Use a window function to get the latest message per conversation
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        conversation_id,
        id,
        content,
        sender_id,
        created_at,
        message_type,
        file_url,
        status,
        read_at
      `
      )
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching latest messages:", error);
      return new Map();
    }

    // Group by conversation and get the latest for each
    const latestMessages = new Map();
    const processed = new Set();

    data?.forEach((message) => {
      if (!processed.has(message.conversation_id)) {
        latestMessages.set(message.conversation_id, message);
        processed.add(message.conversation_id);
      }
    });

    return latestMessages;
  }

  /**
   * Get the other user ID from a conversation
   */
  static async getOtherUserId(
    conversationId: string,
    currentUserId: string
  ): Promise<string | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        matches!inner(
          kindbossing_id,
          kindtao_id
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error getting other user ID:", error);
      return null;
    }

    // data.matches is likely an array, so get the first element
    const { kindbossing_id, kindtao_id } =
      Array.isArray(data.matches) && data.matches.length > 0
        ? data.matches[0]
        : { kindbossing_id: undefined, kindtao_id: undefined };
    return kindbossing_id === currentUserId ? kindtao_id : kindbossing_id;
  }

  /**
   * Get the conversation where the user last sent a message (with caching)
   */
  static async getLastSentConversation(userId: string) {
    const now = Date.now();
    const cached = this.lastSentCache.get(userId);
    const timestamp = this.lastSentCacheTimestamps.get(userId);

    // Return cached data if still valid
    if (cached && timestamp && now - timestamp < this.lastSentCacheExpiry) {
      return cached;
    }

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
        // Cache null result to prevent repeated queries
        this.lastSentCache.set(userId, null);
        this.lastSentCacheTimestamps.set(userId, now);
        return null;
      }
      throw error;
    }

    // Cache the result
    this.lastSentCache.set(userId, data);
    this.lastSentCacheTimestamps.set(userId, now);

    return data;
  }
}
