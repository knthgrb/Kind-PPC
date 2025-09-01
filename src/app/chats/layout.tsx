import "@/styles/globals.css";
import AdminHeader from "../(admin)/_components/AdminHeader";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminHeader />
      {children}
    </>
  );
}
