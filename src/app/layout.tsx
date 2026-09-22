import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SessionProvider } from "@/components/session-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillBridge — From knowing to applying",
  description:
    "SkillBridge measures the gap between what you understand and what you can actually apply, then closes it with targeted practice.",
};

export const viewport: Viewport = {
  themeColor: "#f7f7f9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
