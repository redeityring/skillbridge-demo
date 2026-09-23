"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function SiteNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const LINKS = [
    { href: "/", label: t.navLearn },
    { href: "/progress", label: t.navProgress },
  ] as const;

  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/" || pathname === "/diagnostic" || pathname === "/bridge"
            : pathname === link.href || pathname === "/gap";
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "touch-manipulation rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border border-white/70 bg-surface/90 text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The wordmark. The mark is two pillars and a bridge span — the product idea. */
export function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="accent-gradient flex h-7 w-7 items-center justify-center rounded-md shadow-[0_6px_14px_-6px_rgba(79,70,229,0.6)]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M3.5 18h4.5v-5.5a4 4 0 0 1 8 0V18h4.5"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M5.75 12.5 18.25 8" stroke="white" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-foreground">
        SkillBridge
      </span>
    </Link>
  );
}
