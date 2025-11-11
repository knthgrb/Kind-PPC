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
   * Fetch messages with user details using server actions
   */
  static async fetchMessagesWithUsers(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const supabase = createClient();

    // First get the messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map((msg) => msg.sender_id))];

    // Fetch user details using server action
    const { getMessageSenders } = await import(
      "@/actions/user/get-message-senders"
    );
    const { data: userMap, error: userError } = await getMessageSenders(
      senderIds
    );

    if (userError) {
      // Return messages with fallback user data
      return messages.map((message) => ({
        ...message,
        sender: {
          id: message.sender_id,
          first_name: "Unknown",
          last_name: "User",
          profile_image_url: null,
          role: "kindtao",
        },
      }));
    }

    // Combine messages with user data
    return messages.map((message) => ({
      ...message,
      sender: userMap.get(message.sender_id) || {
        id: message.sender_id,
        first_name: "Unknown",
        last_name: "User",
        profile_image_url: null,
        role: "kindtao",
      },
    }));
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

    const updateData: { status: string; read_at?: string } = { status };
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
   * Get conversation by ID with user details using server actions
   */
  static async getConversation(conversationId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) {
      throw error;
    }

    // Fetch the match data separately
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", data.match_id)
      .single();

    if (matchError || !matchData) {
      throw new Error("Conversation match not found");
    }

    // Get user details using server action
    const { getConversationUsers } = await import(
      "@/actions/user/get-conversation-users"
    );
    const { data: users, error: userError } = await getConversationUsers(
      matchData.kindbossing_user_id,
      matchData.kindtao_user_id
    );

    if (userError) {
      // Return conversation with null user data
      return {
        ...data,
        matches: {
          ...matchData,
          kindbossing: null,
          kindtao: null,
        },
      };
    }

    return {
      ...data,
      matches: {
        ...matchData,
        kindbossing: users.kindbossing,
        kindtao: users.kindtao,
      },
    };
  }

  /**
   * Get conversations for a user with user details using server actions
   */
  static async getUserConversations(userId: string) {
    const supabase = createClient();

    // First, get all matches for this user
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id")
      .or(`kindbossing_user_id.eq.${userId},kindtao_user_id.eq.${userId}`);

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
      .select("*")
      .in("match_id", matchIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch matches for these conversations
    const { data: matchesData, error: fetchMatchesError } = await supabase
      .from("matches")
      .select("*")
      .in("id", matchIds);

    if (fetchMatchesError) {
      throw fetchMatchesError;
    }

    // Create a map of match_id to match data
    const matchMap = new Map();
    matchesData?.forEach((match) => {
      matchMap.set(match.id, match);
    });

    // Add match data to conversations
    const dataWithMatches = data.map((conversation) => ({
      ...conversation,
      matches: matchMap.get(conversation.match_id),
    }));

    // Get user details for all unique users in these conversations
    const allUserIds = new Set<string>();

    dataWithMatches.forEach((conversation) => {
      if (conversation.matches) {
        allUserIds.add(conversation.matches.kindbossing_user_id);
        allUserIds.add(conversation.matches.kindtao_user_id);
      }
    });

    // Fetch all user details using server action
    const { getMultipleUsers } = await import(
      "@/actions/user/get-multiple-users"
    );
    const { data: userResults, error: userError } = await getMultipleUsers(
      Array.from(allUserIds)
    );

    if (userError) {
      // Return conversations with null user data
      return dataWithMatches.map((conversation) => ({
        ...conversation,
        matches: {
          ...conversation.matches,
          kindbossing: null,
          kindtao: null,
        },
      }));
    }

    // Create user map
    const userMap = new Map();
    userResults.forEach(({ id, user }) => {
      if (user) {
        userMap.set(id, {
          id: user.id,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          profile_image_url: user.user_metadata?.profile_image_url || null,
          role: user.user_metadata?.role || "kindtao",
          email: user.email || "",
          phone: user.user_metadata?.phone || null,
          date_of_birth: user.user_metadata?.date_of_birth || null,
          gender: user.user_metadata?.gender || null,
          address: user.user_metadata?.full_address || null,
          city: user.user_metadata?.city || null,
          province: user.user_metadata?.province || null,
          postal_code: user.user_metadata?.postal_code || null,
          is_verified: user.user_metadata?.verification_status === "approved",
          verification_status:
            user.user_metadata?.verification_status || "pending",
          subscription_tier: user.user_metadata?.subscription_tier || "free",
          subscription_expires_at: null,
          swipe_credits: user.user_metadata?.swipe_credits || 0,
          boost_credits: user.user_metadata?.boost_credits || 0,
          last_active: user.updated_at || new Date().toISOString(),
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        });
      }
    });

    // Transform conversations with user data
    return dataWithMatches.map((conversation) => ({
      ...conversation,
      matches: {
        ...conversation.matches,
        kindbossing:
          userMap.get(conversation.matches.kindbossing_user_id) || null,
        kindtao: userMap.get(conversation.matches.kindtao_user_id) || null,
      },
    }));
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

    // First, fetch the match to get user IDs
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("kindbossing_user_id, kindtao_user_id")
      .eq("id", matchId)
      .single();

    if (matchError || !matchData) {
      throw new Error("Match not found");
    }

    // Create conversation with user IDs
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        match_id: matchId,
        kindbossing_user_id: matchData.kindbossing_user_id,
        kindtao_user_id: matchData.kindtao_user_id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get user details by ID using server action
   */
  static async getUserDetails(userId: string) {
    const { getMultipleUsers } = await import(
      "@/actions/user/get-multiple-users"
    );
    const { data, error } = await getMultipleUsers([userId]);

    if (error) {
      throw error;
    }

    // Return the first user or null if not found
    return data.length > 0 ? data[0].user : null;
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
      .select("match_id")
      .eq("id", conversationId)
      .single();

    if (error) {
      return null;
    }

    // Fetch the match data
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("kindbossing_user_id, kindtao_user_id")
      .eq("id", data.match_id)
      .single();

    if (matchError || !matchData) {
      return null;
    }

    const { kindbossing_user_id, kindtao_user_id } = matchData;
    return kindbossing_user_id === currentUserId
      ? kindtao_user_id
      : kindbossing_user_id;
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
