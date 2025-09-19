import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Message, Conversation } from "./chatService";

export interface ChatMessage {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  conversationId: string;
  messageType: string;
  fileUrl: string | null;
}

export interface RealtimeMessageEvent {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Message;
  old?: Message;
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();
  private static pendingSubscriptions: Map<string, Promise<any>> = new Map();
  private static subscriptionCallbacks: Map<
    string,
    {
      onMessage: (message: ChatMessage) => void;
      onError?: (error: Error) => void;
    }
  > = new Map();
  private static multipleCallbacks: Map<
    string,
    Set<{
      onMessage: (message: ChatMessage) => void;
      onError?: (error: Error) => void;
    }>
  > = new Map();
  private static retryAttempts: Map<string, number> = new Map();
  private static maxRetries = 3;

  /**
   * Subscribe to real-time messages for a conversation using broadcast events
   * Following Supabase UI library pattern with improved race condition handling
   */
  static subscribeToMessages(
    conversationId: string,
    onMessage: (message: ChatMessage) => void,
    onError?: (error: Error) => void
  ): Promise<RealtimeChannel> {
    const supabase = createClient();
    const channelName = `conversation:${conversationId}`;

    // Check if channel already exists and is active
    const existingChannel = this.channels.get(conversationId);
    if (existingChannel && existingChannel.state === "joined") {
      // Add callback to multiple callbacks set
      if (!this.multipleCallbacks.has(conversationId)) {
        this.multipleCallbacks.set(conversationId, new Set());
      }
      this.multipleCallbacks.get(conversationId)!.add({ onMessage, onError });
      return Promise.resolve(existingChannel as RealtimeChannel);
    }

    // Check if there's already a pending subscription
    const pendingSubscription = this.pendingSubscriptions.get(conversationId);
    if (pendingSubscription) {
      // Add callback to multiple callbacks set
      if (!this.multipleCallbacks.has(conversationId)) {
        this.multipleCallbacks.set(conversationId, new Set());
      }
      this.multipleCallbacks.get(conversationId)!.add({ onMessage, onError });
      return pendingSubscription;
    }

    // Store callbacks
    this.subscriptionCallbacks.set(conversationId, { onMessage, onError });
    if (!this.multipleCallbacks.has(conversationId)) {
      this.multipleCallbacks.set(conversationId, new Set());
    }
    this.multipleCallbacks.get(conversationId)!.add({ onMessage, onError });

    // Unsubscribe from existing channel if it exists but is not active
    if (existingChannel) {
      existingChannel.unsubscribe();
      this.channels.delete(conversationId);
    }

    const subscriptionPromise = new Promise<RealtimeChannel>(
      (resolve, reject) => {
        const channel = supabase
          .channel(channelName)
          .on("broadcast", { event: "message" }, (payload) => {
            const message = payload.payload as ChatMessage;

            // Call all callbacks for this conversation
            const callbacks = this.subscriptionCallbacks.get(conversationId);
            if (callbacks) {
              callbacks.onMessage(message);
            }

            // Call multiple callbacks
            const multipleCallbacks =
              this.multipleCallbacks.get(conversationId);
            if (multipleCallbacks) {
              multipleCallbacks.forEach((callback) => {
                callback.onMessage(message);
              });
            }
          })
          .subscribe((status, err) => {
            if (err) {
              const callbacks = this.subscriptionCallbacks.get(conversationId);
              callbacks?.onError?.(err);

              // Call error callbacks for all multiple callbacks
              const multipleCallbacks =
                this.multipleCallbacks.get(conversationId);
              if (multipleCallbacks) {
                multipleCallbacks.forEach((callback) => {
                  callback.onError?.(err);
                });
              }

              this.pendingSubscriptions.delete(conversationId);
              reject(err);
              return;
            }

            if (status === "SUBSCRIBED") {
              // Store the channel for cleanup
              this.channels.set(conversationId, channel);
              this.pendingSubscriptions.delete(conversationId);
              // Reset retry attempts on successful subscription
              this.retryAttempts.delete(conversationId);
              resolve(channel);
            } else if (status === "CHANNEL_ERROR") {
              this.handleSubscriptionError(
                conversationId,
                "CHANNEL_ERROR",
                reject
              );
            } else if (status === "TIMED_OUT") {
              this.handleSubscriptionError(conversationId, "TIMED_OUT", reject);
            } else if (status === "CLOSED") {
              // Remove from channels map when closed
              this.channels.delete(conversationId);
              this.pendingSubscriptions.delete(conversationId);
            }
          });
      }
    );

    // Store the pending subscription
    this.pendingSubscriptions.set(conversationId, subscriptionPromise);

    return subscriptionPromise;
  }

  /**
   * Handle subscription errors with retry logic
   */
  private static handleSubscriptionError(
    conversationId: string,
    errorType: string,
    reject: (error: Error) => void
  ) {
    const currentAttempts = this.retryAttempts.get(conversationId) || 0;

    if (currentAttempts < this.maxRetries) {
      // Retry after exponential backoff
      const delay = Math.pow(2, currentAttempts) * 1000; // 1s, 2s, 4s

      this.retryAttempts.set(conversationId, currentAttempts + 1);
      this.pendingSubscriptions.delete(conversationId);

      setTimeout(() => {
        // Only retry if this conversation still needs subscription
        const callbacks = this.subscriptionCallbacks.get(conversationId);
        if (callbacks) {
          this.subscribeToMessages(
            conversationId,
            callbacks.onMessage,
            callbacks.onError
          );
        }
      }, delay);
    } else {
      // Max retries reached, give up
      const error = new Error(
        `Failed to subscribe to conversation ${conversationId} after ${this.maxRetries} attempts: ${errorType}`
      );
      const callbacks = this.subscriptionCallbacks.get(conversationId);
      callbacks?.onError?.(error);
      this.pendingSubscriptions.delete(conversationId);
      this.retryAttempts.delete(conversationId);
      reject(error);
    }
  }

  /**
   * Send a message via broadcast to a conversation
   * Uses the existing subscribed channel to ensure all clients receive the message
   */
  static async sendMessage(
    conversationId: string,
    message: ChatMessage
  ): Promise<void> {
    const channelName = `conversation:${conversationId}`;

    // Get the existing subscribed channel
    const existingChannel = this.channels.get(conversationId);

    if (!existingChannel) {
      return; // Don't throw error, just skip broadcasting
    }

    // Check if channel is ready (with shorter timeout)
    const isReady = await this.ensureChannelReady(conversationId);

    if (!isReady) {
      return; // Don't throw error, just skip broadcasting
    }

    try {
      await existingChannel.send({
        type: "broadcast",
        event: "message",
        payload: message,
      });
    } catch (error) {
      // Silent error handling for broadcast failures
    }
  }

  /**
   * Convert database message to ChatMessage format
   */
  static convertToChatMessage(
    message: Message,
    user: {
      id: string;
      first_name: string;
      last_name: string;
      profile_image_url?: string | null;
    }
  ): ChatMessage {
    return {
      id: message.id,
      content: message.content,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        avatar: user.profile_image_url || undefined,
      },
      createdAt: message.created_at,
      conversationId: message.conversation_id,
      messageType: message.message_type,
      fileUrl: message.file_url,
    };
  }

  /**
   * Subscribe to conversation updates
   */
  static subscribeToConversation(
    conversationId: string,
    onUpdate: (conversation: Conversation) => void,
    onError?: (error: Error) => void
  ) {
    const supabase = createClient();
    const channelName = `conversation-updates:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          onUpdate(payload.new as Conversation);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          onError?.(err);
        }
      });

    return channel;
  }

  /**
   * Subscribe to user conversations
   */
  static subscribeToUserConversations(
    userId: string,
    onUpdate: (conversations: Conversation[]) => void,
    onError?: (error: Error) => void
  ) {
    const supabase = createClient();
    const channelName = `user-conversations:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          // You might want to refetch conversations here
          onUpdate([]);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          onError?.(err);
        }
      });

    return channel;
  }

  /**
   * Unsubscribe from messages for a specific conversation
   */
  static unsubscribeFromMessages(conversationId: string) {
    const channel = this.channels.get(conversationId);
    if (channel) {
      try {
        channel.unsubscribe();
        this.channels.delete(conversationId);
      } catch (error) {
        // Silent error handling
      }
    }

    // Clean up pending subscriptions, callbacks, and retry attempts
    this.pendingSubscriptions.delete(conversationId);
    this.subscriptionCallbacks.delete(conversationId);
    this.multipleCallbacks.delete(conversationId);
    this.retryAttempts.delete(conversationId);
  }

  /**
   * Cleanup all channels and reset state
   */
  static cleanup() {
    this.channels.forEach((channel, conversationId) => {
      try {
        channel.unsubscribe();
      } catch (error) {
        // Silent error handling
      }
    });
    this.channels.clear();
    this.pendingSubscriptions.clear();
    this.subscriptionCallbacks.clear();
    this.multipleCallbacks.clear();
    this.retryAttempts.clear();
  }

  /**
   * Cleanup expired subscriptions to prevent memory leaks
   */
  static cleanupExpiredSubscriptions() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    // Clean up old retry attempts
    this.retryAttempts.forEach((attempts, conversationId) => {
      if (attempts > this.maxRetries) {
        this.retryAttempts.delete(conversationId);
      }
    });

    // Clean up stale pending subscriptions
    this.pendingSubscriptions.forEach((promise, conversationId) => {
      // If a subscription has been pending for too long, clean it up
      if (this.channels.has(conversationId)) {
        const channel = this.channels.get(conversationId);
        if (channel && channel.state === "errored") {
          this.channels.delete(conversationId);
          this.pendingSubscriptions.delete(conversationId);
        }
      }
    });
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll() {
    this.channels.forEach((channel, conversationId) => {
      try {
        channel.unsubscribe();
      } catch (error) {
        // Silent error handling
      }
    });
    this.channels.clear();
    this.pendingSubscriptions.clear();
    this.subscriptionCallbacks.clear();
    this.multipleCallbacks.clear();
    this.retryAttempts.clear();
  }

  /**
   * Get subscription status for a conversation
   */
  static getSubscriptionStatus(conversationId: string) {
    const channel = this.channels.get(conversationId);
    return channel ? channel.state : "NOT_SUBSCRIBED";
  }

  /**
   * Get all active subscriptions
   */
  static getActiveSubscriptions() {
    const activeSubscriptions: { [key: string]: string } = {};
    this.channels.forEach((channel, conversationId) => {
      activeSubscriptions[conversationId] = channel.state;
    });
    return activeSubscriptions;
  }

  /**
   * Ensure channel is subscribed and ready for broadcasting
   */
  static async ensureChannelReady(conversationId: string): Promise<boolean> {
    const channel = this.channels.get(conversationId);

    if (!channel) {
      return false;
    }

    if (channel.state === "joined") {
      return true;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000); // Reduced timeout to 5 seconds

      const checkChannel = () => {
        if (channel.state === "joined") {
          clearTimeout(timeout);
          resolve(true);
        } else if (channel.state === "errored" || channel.state === "closed") {
          clearTimeout(timeout);
          resolve(false);
        } else {
          setTimeout(checkChannel, 200); // Check every 200ms instead of 100ms
        }
      };

      checkChannel();
    });
  }

  /**
   * Test realtime connection using broadcast
   */
  static async testRealtimeConnection() {
    const supabase = createClient();

    const testChannel = supabase.channel("test-connection");

    return new Promise((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          testChannel.unsubscribe();
          resolve({
            success: false,
            error: "Connection test timed out",
          });
        }
      }, 5000);

      testChannel
        .on("broadcast", { event: "test" }, (payload) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            testChannel.unsubscribe();
            resolve({
              success: true,
              message: "Broadcast realtime connection working",
              payload,
            });
          }
        })
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            // Send a test broadcast
            testChannel.send({
              type: "broadcast",
              event: "test",
              payload: { message: "Test message" },
            });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              testChannel.unsubscribe();
              resolve({
                success: false,
                error: err?.message || "Connection failed",
                status,
              });
            }
          }
        });
    });
  }
}
