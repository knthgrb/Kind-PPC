import { Plus_Jakarta_Sans, Barlow_Condensed } from "next/font/google";
import type { Metadata } from "next";
import { Suspense } from "react";
import "@/styles/globals.css";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import NotificationInitializer from "@/components/notification/NotificationInitializer";
import NotificationPrompt from "@/components/notification/NotificationPrompt";
import AuthProvider from "@/components/common/AuthProvider";
import SubscriptionSuccessHandler from "@/components/common/SubscriptionSuccessHandler";
import ToastContainer from "@/components/toast/ToastContainer";

// Import the required fonts
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700"], // Specify the weights you need
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600"], // Specify the weights you need
});

export const metadata: Metadata = {
  title: "Kind",
  description: "Connecting kindbossing with trusted kindtaos",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`font-sans ${plusJakartaSans.variable} ${barlowCondensed.variable} antialiased`}
      >
        <AuthProvider>
          <InstallPrompt />
          <NotificationInitializer />
          <NotificationPrompt />
          <Suspense fallback={null}>
            <SubscriptionSuccessHandler />
          </Suspense>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
