"use client";

import "@/styles/globals.css";
import { useAuthStore } from "@/stores/useAuthStore";
import AdminHeader from "@/app/(admin)/_components/AdminHeader";
import KindBossingHeader from "@/app/(kindbossing)/_components/KindBossingHeader";
import KindTaoHeader from "@/app/(marketing)/_components/Header";
import Footer from "@/app/(marketing)/_components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userMetadata, loading } = useAuthStore();
  const role = userMetadata?.role;

  // Show loading state while fetching user data
  if (loading) {
    return <LoadingSpinner message="Loading chat..." variant="fullscreen" />;
  }

  return (
    <>
      {role === "admin" && <AdminHeader />}
      {role === "kindbossing" && <KindBossingHeader />}
      {role === "kindtao" && <KindTaoHeader />}
      <main>{children}</main>
      {role === "kindtao" && <Footer />}
    </>
  );
}
