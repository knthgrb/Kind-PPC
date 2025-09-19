// Database notification types matching the schema
export type NotificationType =
  | "message"
  | "match"
  | "job_posted"
  | "job_accepted"
  | "profile_verified"
  | "payment_success"
  | "system_update"
  | "reminder";

export type NotificationStatus = "unread" | "read";

export interface DatabaseNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown>; // JSONB field
  status: NotificationStatus;
  read_at?: string;
  created_at: string;
}

// Toast notification types for Zustand store
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  customContent?: React.ReactNode;
  persistent?: boolean;
  priority?: "low" | "normal" | "high" | "urgent";
  data?: Record<string, unknown>; // Additional metadata
}

// Message notification specific data
export interface MessageNotificationData extends Record<string, unknown> {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messageContent: string;
  messageId: string;
}

// Notification preferences
export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  messages: boolean;
  matches: boolean;
  job_updates: boolean;
  system: boolean;
}
