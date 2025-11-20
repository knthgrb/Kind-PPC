import React from "react";

export default function MatchesLayout({
  children,
  conversation,
}: {
  children: React.ReactNode;
  conversation: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden">
      {children}
      {conversation}
    </div>
  );
}
