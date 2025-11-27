"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPaperPlane } from "react-icons/fa";

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  recipientName: string;
  isLoading?: boolean;
}

export default function StartConversationModal({
  isOpen,
  onClose,
  onSendMessage,
  recipientName,
  isLoading = false,
}: StartConversationModalProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Start Conversation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Send your first message to start a new conversation.
            </p>
            <p className="text-sm text-gray-500">
              This will create a new conversation.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
                disabled={isLoading}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {message.length}/500 characters
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 cursor-pointer py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="flex-1 cursor-pointer bg-[#CC0000] text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
