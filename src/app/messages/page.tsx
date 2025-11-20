import React from "react";

export default function MessagesPage() {
  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600 mb-8">
          Manage your conversations with employees and applicants.
        </p>
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500">No messages yet</p>
        </div>
      </div>
    </div>
  );
}

