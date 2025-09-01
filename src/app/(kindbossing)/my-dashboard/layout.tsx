import "@/styles/globals.css";
import KindBossingHeader from "../../(kindbossing)/_components/KindBossingHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <KindBossingHeader />
      {children}
    </>
  );
}
