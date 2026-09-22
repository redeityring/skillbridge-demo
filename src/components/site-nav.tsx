"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Learn" },
  { href: "/progress", label: "Progress" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

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

/** The wordmark. The mark is two bars and a bridge span — the product idea. */
export function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="accent-gradient flex h-7 w-7 items-center justify-center rounded-md shadow-[0_6px_14px_-6px_rgba(79,70,229,0.6)]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M3 17h18M6 17v-4a6 6 0 0 1 12 0v4"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-foreground">
        SkillBridge
      </span>
    </Link>
  );
}
