import "@/styles/globals.css";
import KindBossingHeader from "@/app/(kindbossing)/_components/KindBossingHeader";
import AdminHeader from "@/app/(admin)/_components/AdminHeader";
import KindTaoHeader from "@/app/(marketing)/_components/Header";
import Footer from "@/app/(marketing)/_components/Footer";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;

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
