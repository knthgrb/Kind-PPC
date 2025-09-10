"use server";

import { createClient } from "@/utils/supabase/server";

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
) {
  const supabase = await createClient();

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
    console.error("Error marking messages as read:", error);
    throw error;
  }

  return { success: true };
}
