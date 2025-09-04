import "@/styles/globals.css";
import KindBossingHeader from "@/app/(kindbossing)/_components/KindBossingHeader";
import AdminHeader from "@/app/(admin)/_components/AdminHeader";

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { role: string };
}) {
  return (
    <>
      {params.role === "admin" && <AdminHeader />}
      {params.role === "kindbossing" && <KindBossingHeader />}
      <main>{children}</main>
    </>
  );
}
