import React from "react";

export default function MatchesLayout({
  children,
  conversation,
}: {
  children: React.ReactNode;
  conversation: React.ReactNode;
}) {
  return (
    <>
      {children}
      {conversation}
    </>
  );
}

