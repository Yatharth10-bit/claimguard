import type { Metadata } from "next";
import { CookieConsentBar } from "@/components/legal/CookieConsentBar";
import { SessionProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClaimGuard",
  description: "AI claim-risk checker for food and supplement brands",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SessionProvider>
          {children}
          <CookieConsentBar />
        </SessionProvider>
      </body>
    </html>
  );
}
