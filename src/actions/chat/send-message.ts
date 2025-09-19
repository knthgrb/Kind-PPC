"use server";

import { createClient } from "@/utils/supabase/server";
import { MessageNotificationData } from "@/types/notification";

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: string = "text",
  fileUrl?: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      file_url: fileUrl || null,
      status: "delivered",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Update conversation's last_message_id and last_message_at
  const { error: updateError } = await supabase
    .from("conversations")
    .update({
      last_message_id: data.id,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (updateError) {
    // Silent error handling for conversation update
  }

  // Get conversation details to find recipient
  const { data: conversationData, error: conversationError } = await supabase
    .from("conversations")
    .select(
      `
      id,
      matches (
        id,
        kindbossing_id,
        kindtao_id
      )
    `
    )
    .eq("id", conversationId)
    .single();

  if (conversationError || !conversationData?.matches) {
    return data; // Return the message data even if notification fails
  }
  // Determine recipient (the user who didn't send the message)
  const match = conversationData.matches as any; // Type assertion for Supabase join result
  const recipientId =
    senderId === match.kindbossing_id ? match.kindtao_id : match.kindbossing_id;

  // Get sender's name using the same approach as chat system

  // Use the same UserService that chat system uses
  const { UserService } = await import("@/services/server/UserService");
  const { data: senderData, error: senderError } =
    await UserService.getUserDetailsById(senderId);

  const senderName = senderData?.user_metadata?.first_name
    ? `${senderData.user_metadata.first_name} ${
        senderData.user_metadata.last_name || ""
      }`.trim()
    : "Someone";

  // Check if message is still unread before creating notification
  // Wait a brief moment to allow for potential read status updates
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if the message is still unread
  const { data: currentMessage, error: messageCheckError } = await supabase
    .from("messages")
    .select("read_at")
    .eq("id", data.id)
    .single();

  if (messageCheckError || currentMessage.read_at) {
    return data; // Don't create notification if message is already read or can't check status
  }

  const notificationData: MessageNotificationData = {
    conversationId,
    senderId,
    senderName,
    messageContent: content,
    messageId: data.id,
  };

  const { data: notificationResult, error: notificationError } = await supabase
    .from("notifications")
    .insert({
      user_id: recipientId,
      title: `New message from ${senderName}`,
      message:
        content.length > 100 ? content.substring(0, 100) + "..." : content,
      type: "message",
      data: notificationData,
      status: "unread",
    })
    .select()
    .single();

  if (!notificationError) {
    // Broadcast the notification to the recipient in real-time
    try {
      const { broadcastNotification } = await import(
        "@/utils/notifications/broadcast"
      );
      await broadcastNotification(notificationResult);
    } catch (broadcastError) {
      // Silent error handling for broadcast failures
    }
  }
  return data;
}
