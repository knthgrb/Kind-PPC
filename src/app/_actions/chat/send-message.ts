"use server";

import { createClient } from "@/utils/supabase/server";

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
    console.error("Error sending message:", error);
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
    console.error("Error updating conversation:", updateError);
  }

  return data;
}
