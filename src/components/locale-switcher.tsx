"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/config";

/**
 * Language toggle.
 *
 * The learner's language is a preference, not run data: switching it re-renders
 * copy and swaps the content bank, but never touches answers, scores or
 * history. The default (no stored override) follows the system language.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  const options: { id: Locale; label: string; title: string }[] = [
    { id: "en", label: "EN", title: "English" },
    { id: "ru", label: "RU", title: "Русский" },
  ];

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center rounded-md border border-border-strong bg-surface/80 p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const active = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLocale(option.id)}
            aria-pressed={active}
            title={option.title}
            className={cn(
              "touch-manipulation rounded-[5px] px-2 py-1 text-xs font-semibold tracking-wide transition-colors",
              active
                ? "accent-gradient text-primary-foreground shadow-[0_4px_10px_-5px_rgba(79,70,229,0.8)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
