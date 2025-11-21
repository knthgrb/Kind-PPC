"use client";

import React from "react";

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Parent layout (/kindtao/layout.tsx) already provides header and bottom tabs
  // This layout just needs to pass through children
  return <>{children}</>;
}
