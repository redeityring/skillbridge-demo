import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SessionProvider } from "@/components/session-provider";
import { LocaleProvider } from "@/lib/i18n/locale-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
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
    // `lang` is corrected client-side once the stored/system locale is known
    // (see AppShell), because locale detection needs the browser APIs.
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <LocaleProvider>
          <SessionProvider>
            <AppShell>{children}</AppShell>
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
