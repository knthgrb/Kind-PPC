import React from "react";
import KindTaoHeader from "@/app/(kindtao)/_components/KindTaoHeader";
import KindTaoBottomTabs from "@/app/(kindtao)/_components/KindTaoBottomTabs";

export default function KindTaoMoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <KindTaoHeader />
      <div className="pb-16">{children}</div>
      <KindTaoBottomTabs />
    </>
  );
}

