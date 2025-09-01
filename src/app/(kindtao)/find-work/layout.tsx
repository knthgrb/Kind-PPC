import "@/styles/globals.css";
import Header from "../../(marketing)/_components/Header";
import Footer from "../../(marketing)/_components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
