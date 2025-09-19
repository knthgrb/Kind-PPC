"use client";

import { useToastStore } from "@/stores/useToastStore";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  DatabaseNotification,
  NotificationType,
  MessageNotificationData,
} from "@/types/notification";

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class NotificationService {
  private static subscriptions = new Map<string, RealtimeChannel>();
  private static currentUserId: string | null = null;
  private static isInitialized = false;
  private static isSupported =
    typeof window !== "undefined" && "Notification" in window;
  private static isServiceWorkerSupported =
    typeof window !== "undefined" && "serviceWorker" in navigator;

  /**
   * Initialize the unified notification service for a user
   * This handles everything: database notifications, real-time subscriptions, push notifications
   */
  static async initialize(userId: string) {
    if (this.isInitialized && this.currentUserId === userId) {
      return;
    }

    this.currentUserId = userId;

    // Initialize push notifications
    await this.initializePushNotifications();

    // Subscribe to database notifications
    await this.subscribeToNotifications(userId);

    // Load existing unread notifications
    await this.loadExistingUnreadNotifications(userId);

    // Note: Message notifications are created directly in send-message.ts
    // No need to subscribe to conversations table

    // Check and show permission status
    this.checkPermissionStatus();

    this.isInitialized = true;
  }

  /**
   * Initialize push notifications (Service Worker)
   */
  private static async initializePushNotifications(): Promise<boolean> {
    try {
      // Register service worker
      if (this.isServiceWorkerSupported) {
        await navigator.serviceWorker.register("/sw.js");
      }

      // Setup notification handlers
      this.setupNotificationHandlers();

      return true;
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }

  /**
   * Create a new notification in the database
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ): Promise<DatabaseNotification | null> {
    try {
      const supabase = createClient();

      const { data: notificationData, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data,
          status: "unread",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return null;
      }

      return notificationData;
    } catch (error) {
      console.error("Failed to create notification:", error);
      return null;
    }
  }

  /**
   * Create a message notification (called when message is sent)
   */
  static async createMessageNotification(
    recipientId: string,
    senderName: string,
    messageContent: string,
    conversationId: string,
    senderId: string,
    messageId: string
  ): Promise<DatabaseNotification | null> {
    const data: MessageNotificationData = {
      conversationId,
      senderId,
      senderName,
      messageContent,
      messageId,
    };

    return this.createNotification(
      recipientId,
      `New message from ${senderName}`,
      messageContent.length > 100
        ? messageContent.substring(0, 100) + "..."
        : messageContent,
      "message",
      data
    );
  }

  /**
   * Load existing unread notifications on app startup
   */
  private static async loadExistingUnreadNotifications(userId: string) {
    try {
      const supabase = createClient();

      console.log(
        `📋 Loading existing unread notifications for user: ${userId}`
      );

      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "unread")
        .order("created_at", { ascending: false })
        .limit(10); // Limit to recent notifications to avoid spam

      if (error) {
        console.error("❌ Error loading unread notifications:", error);
        return;
      }

      if (notifications && notifications.length > 0) {
        console.log(
          `📋 Found ${notifications.length} unread notifications:`,
          notifications
        );

        // Show each notification as a toast
        notifications.forEach((notification) => {
          this.handleNewNotification(notification);
        });
      } else {
        console.log(`📋 No unread notifications found`);
      }
    } catch (error) {
      console.error("❌ Error in loadExistingUnreadNotifications:", error);
    }
  }

  /**
   * Subscribe to notifications via global broadcast channel
   * All users listen to the same channel and filter notifications client-side
   */
  private static async subscribeToNotifications(userId: string) {
    const supabase = createClient();

    console.log(`🔗 Setting up notification subscription for user: ${userId}`);

    // Use user-specific channel name (same pattern as chat: conversation:${conversationId})
    const channelName = `notifications:${userId}`;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "notification" }, (payload) => {
        const notification = payload.payload as Record<string, unknown>;
        // Process the notification (it should already be for this user)
        this.handleNewNotification(notification);
      })
      .subscribe();

    // Store the channel using the same key pattern as chat
    this.subscriptions.set(`notifications:${userId}`, channel);
  }

  /**
   * Broadcast a notification to the target user
   * This is called when a notification is created in the database
   */
  static async broadcastNotification(
    notification: Record<string, unknown>
  ): Promise<void> {
    try {
      const userId = notification.user_id as string;

      // Get the existing subscription channel for the target user (same as chat pattern)
      const channel = this.subscriptions.get(`notifications:${userId}`);

      if (channel) {
        await channel.send({
          type: "broadcast",
          event: "notification",
          payload: notification,
        });
      }
    } catch (error) {
      // Silent error handling for broadcast failures
    }
  }

  /**
   * Handle new database notifications
   * Show toast and push notification based on notification type
   */
  private static handleNewNotification(notification: Record<string, unknown>) {
    const notificationUserId = notification.user_id as string;
    const isForCurrentUser = notificationUserId === this.currentUserId;

    console.log(`🔔 New notification added to DB:`, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      userId: notificationUserId,
      isForCurrentUser,
      currentUserId: this.currentUserId,
    });

    // Only process notifications for the current user
    if (!isForCurrentUser) {
      console.log(`⏭️ Skipping notification - not for current user`);
      return;
    }

    const { addToast } = useToastStore.getState();

    // Show toast based on notification type
    switch (notification.type) {
      case "message":
        // Handle message notifications with special logic (lower priority)
        this.handleMessageNotification(notification);
        break;

      case "match":
        addToast({
          type: "success",
          title: "New Match!",
          message: notification.message as string,
          priority: "high",
          duration: 12000, // Increased from 8 to 12 seconds
          action: {
            label: "View",
            onClick: () => (window.location.href = "/chats"),
          },
        });
        break;

      case "job_posted":
      case "job_accepted":
        addToast({
          type: "info",
          title: notification.title as string,
          message: notification.message as string,
          priority: "normal",
          duration: 10000, // Increased from 6 to 10 seconds
        });
        break;

      case "profile_verified":
        addToast({
          type: "success",
          title: notification.title as string,
          message: notification.message as string,
          priority: "high",
          duration: 15000, // Increased from 10 to 15 seconds
        });
        break;

      case "system_update":
        addToast({
          type: "info",
          title: notification.title as string,
          message: notification.message as string,
          priority: "normal",
          persistent: true,
        });
        break;

      default:
        addToast({
          type: "info",
          title: notification.title as string,
          message: notification.message as string,
          priority: "normal",
        });
    }

    // Also show push notification if user is not actively viewing the app
    const shouldShowPushNotification = this.shouldShowPushNotification();
    if (shouldShowPushNotification) {
      console.log(
        `📱 Showing push notification for notification: ${notification.id}`
      );
      this.showPushNotification({
        title: notification.title as string,
        body: notification.message as string,
        tag: `notification-${notification.id}`,
        data: notification.data as Record<string, unknown>,
      });
    } else {
      console.log(
        `📱 Skipping push notification - user is actively viewing the app`
      );
    }
  }

  /**
   * Handle message notifications - only show push notifications, no toasts
   */
  private static handleMessageNotification(
    notification: Record<string, unknown>
  ) {
    const data = notification.data as MessageNotificationData;

    console.log(`💬 Processing message notification:`, {
      conversationId: data.conversationId,
      senderName: data.senderName,
      messageContent: data.messageContent?.substring(0, 50) + "...",
      messageId: data.messageId,
    });

    // Always show push notification for messages (no restrictions)
    console.log(`📱 Showing push notification for message: ${data.messageId}`);
    this.showPushNotification({
      title: `New message from ${data.senderName}`,
      body:
        data.messageContent.length > 100
          ? data.messageContent.substring(0, 100) + "..."
          : data.messageContent,
      icon: data.senderAvatar,
      tag: `message-${data.conversationId}`,
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        messageId: data.messageId,
      },
      actions: [
        {
          action: "view-chat",
          title: "View Chat",
        },
      ],
    });
  }

  /**
   * Determine if push notification should be shown based on user activity
   */
  private static shouldShowPushNotification(): boolean {
    // Check 1: Document is hidden (user switched tabs or minimized)
    const isDocumentHidden = document.hidden;
    if (isDocumentHidden) {
      console.log(`🔍 Push notification: Document is hidden`);
      return true; // Show push notification - user is not actively viewing the app
    }

    // Check 2: Document doesn't have focus (browser tab not focused)
    const isDocumentFocused = document.hasFocus();
    if (!isDocumentFocused) {
      console.log(`🔍 Push notification: Document doesn't have focus`);
      return true; // Show push notification - user is not actively using the browser tab
    }

    // Check 3: User is not on any chat page (on home, profile, etc.)
    const isOnAnyChatPage = window.location.pathname.includes("/chats/");
    if (!isOnAnyChatPage) {
      console.log(`🔍 Push notification: User is not on any chat page`);
      return true; // Show push notification - user is not in chat section
    }

    // Check 4: User is on chat page but might be inactive
    console.log(
      `🔍 Push notification: User is on chat page and tab is focused`
    );
    return false; // Don't show push notification - user is actively using the app

    // Summary of logic:
    // ✅ Show push notification if: User is not actively viewing the app
    // ❌ Don't show push notification if: User is actively using the app
  }

  /**
   * Show push notification
   */
  private static async showPushNotification(
    options: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported || !this.isEnabled()) {
      return;
    }

    try {
      // Use service worker if available
      if (this.isServiceWorkerSupported && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const notificationOptions: any = {
          body: options.body,
          icon: options.icon || "/icons/icon-192x192.png",
          badge: options.badge || "/icons/icon-192x192.png",
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
        };

        if (options.actions && options.actions.length > 0) {
          notificationOptions.actions = options.actions;
        }

        await registration.showNotification(options.title, notificationOptions);
      } else {
        // Fallback to direct notification
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || "/icons/icon-192x192.png",
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      console.error("Error showing push notification:", error);
    }
  }

  /**
   * Setup notification click handlers
   */
  private static setupNotificationHandlers(): void {
    if (!this.isSupported) return;

    // Handle notification click
    navigator.serviceWorker?.addEventListener("message", (event) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICK") {
        const { action, data } = event.data;

        if (action === "view" && data.conversationId) {
          window.location.href = `/chats/${data.conversationId}`;
        }
      }
    });

    // Handle direct notification click
    window.addEventListener("notificationclick", (event: any) => {
      event.preventDefault();

      const notification = event.notification;
      const data = notification.data;

      if (data && data.conversationId) {
        notification.close();
        window.location.href = `/chats/${data.conversationId}`;
      }
    });
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<DatabaseNotification[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("notifications")
        .update({
          status: "read",
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      return false;
    }
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("notifications")
        .update({
          status: "read",
          read_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "unread");

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const supabase = createClient();

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "unread");

      if (error) {
        console.error("Error getting unread count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * Cleanup all subscriptions
   */
  static cleanup() {
    this.subscriptions.forEach((channel) => {
      channel.unsubscribe();
    });
    this.subscriptions.clear();
    this.isInitialized = false;
    this.currentUserId = null;
  }

  /**
   * Manually trigger a toast notification
   */
  static showToast(
    type: "success" | "error" | "info" | "warning" | "message",
    title: string,
    message?: string,
    options?: Record<string, unknown>
  ) {
    const { addToast } = useToastStore.getState();
    return addToast({ type, title, message, ...options });
  }

  /**
   * Check permission status and show appropriate toast
   */
  private static checkPermissionStatus(): void {
    if (!this.isSupported) {
      return;
    }

    const permission = this.getPermissionStatus();

    if (permission === "denied") {
      const { showWarning } = useToastStore.getState();

      showWarning(
        "Notifications Disabled",
        "You currently can't receive notifications. Enable them to stay updated with new messages and updates.",
        {
          persistent: true,
          priority: "high",
          duration: 20000, // Increased from 15 to 20 seconds for permission warnings
          action: {
            label: "Go To Settings",
            onClick: () => {
              window.location.href = "/notifications";
            },
          },
        }
      );
    }
  }

  /**
   * Get current notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return "denied";
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn("Notifications are not supported in this browser");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  /**
   * Check if notifications are enabled
   */
  static isEnabled(): boolean {
    return this.getPermissionStatus() === "granted";
  }

  /**
   * Test notification (for debugging)
   */
  static async testNotification(): Promise<void> {
    await this.showPushNotification({
      title: "Test Notification",
      body: "This is a test notification from Kind Platform",
      icon: "/icons/icon-192x192.png",
      tag: "test",
    });
  }
}
