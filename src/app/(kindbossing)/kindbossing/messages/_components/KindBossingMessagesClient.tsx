"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiUser } from "react-icons/fi";
import { useQuery } from "convex/react";
import { useToastActions } from "@/stores/useToastStore";
import { convex } from "@/utils/convex/client";
import { api } from "@/utils/convex/client";
import { ChatService } from "@/services/ChatService";
import { logger } from "@/utils/logger";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

export default function KindBossingMessagesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUser = useQuery(api.auth.getCurrentUser);
  const { showError, showSuccess } = useToastActions();

  const kindtaoUserId = searchParams.get("kindtaoUserId");
  const applicantName = searchParams.get("applicantName") || "Candidate";
  const applicantEmail = searchParams.get("applicantEmail") || "";
  const applicantPhone = searchParams.get("applicantPhone") || "";
  const jobId = searchParams.get("jobId");
  const jobTitle = searchParams.get("jobTitle") || "Role";
  const matchId = searchParams.get("matchId");
  const applicationId = searchParams.get("applicationId");

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const summary = useMemo(() => {
    return [
      applicantEmail && `Email: ${applicantEmail}`,
      applicantPhone && `Phone: ${applicantPhone}`,
      jobTitle && `For: ${jobTitle}`,
    ]
      .filter(Boolean)
      .join(" • ");
  }, [applicantEmail, applicantPhone, jobTitle]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    // Wait for user to load
    if (currentUser === undefined) {
      showError("Loading user information...");
      return;
    }

    // Check if user is authenticated
    if (currentUser === null) {
      showError("Please sign in to send messages.");
      router.push("/login");
      return;
    }

    const userId = getUserId(currentUser);
    if (!userId) {
      logger.error("User object exists but no ID found:", currentUser);
      showError("Unable to identify user. Please sign in again.");
      return;
    }
    if (!kindtaoUserId) {
      showError("Missing candidate information.");
      return;
    }

    setIsSending(true);
    try {
      let conversationId: string | null = null;

      if (matchId) {
        const existingConversation = await convex.query(
          api.conversations.getConversationByMatchId,
          {
            matchId,
          }
        );
        if (existingConversation?._id) {
          conversationId = String(existingConversation._id);
        }
      }

      if (!conversationId) {
        const createdConversationId = await ChatService.createConversation(
          convex,
          matchId || undefined,
          userId,
          kindtaoUserId
        );
        conversationId = String(createdConversationId);
      }

      await ChatService.sendMessage(
        convex,
        conversationId,
        userId,
        message.trim(),
        "text"
      );

      showSuccess("Message sent. Opening chat…");
      router.replace(`/kindbossing/messages/${conversationId}`);
    } catch (error) {
      logger.error("Error sending message:", error);
      showError("Unable to send message right now.");
    } finally {
      setIsSending(false);
    }
  };

  if (!kindtaoUserId) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-gray-600">
            Select a candidate from your applications to start messaging.
          </p>
          <Link
            href="/my-job-posts"
            className="inline-flex cursor-pointer items-center gap-2 mt-4 text-sm text-red-600 font-semibold"
          >
            Go back to job posts
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href={
              jobId ? `/my-job-posts/${jobId}/applications` : "/my-job-posts"
            }
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Back to applications"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Send {applicantName} a message
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <FiUser className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {applicantName}
              </p>
              <p className="text-sm text-gray-600">{summary}</p>
            </div>
          </div>

          {applicationId && (
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Application #{applicationId.slice(-6)}
            </p>
          )}

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Your message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Introduce yourself and let ${applicantName.split(" ")[0] || "them"} know why they’re a great fit.`}
              rows={5}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSendMessage}
              disabled={
                isSending ||
                !message.trim() ||
                currentUser === undefined ||
                currentUser === null
              }
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
            >
              <FiSend className="w-4 h-4" />
              {isSending ? "Sending..." : "Send & Start Chat"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
