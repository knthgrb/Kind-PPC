import "@/styles/globals.css";
import KindTaoHeader from "../_components/KindTaoHeader";
import KindTaoBottomTabs from "../_components/KindTaoBottomTabs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <KindTaoHeader />
      <div className="pb-20 md:pb-24">{children}</div>
      <KindTaoBottomTabs />
    </>
  );
}
