import "@/styles/globals.css";
import KindBossingHeader from "@/app/(kindbossing)/_components/KindBossingHeader";
import KindTaoHeader from "@/app/(marketing)/_components/Header";
import Footer from "@/app/(marketing)/_components/Footer";

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { role: string };
}) {
  return (
    <>
      {params.role === "kindbossing" && <KindBossingHeader />}
      {params.role === "kindtao" && <KindTaoHeader />}
      <main>{children}</main>
      {params.role === "kindtao" && <Footer />}
    </>
  );
}
