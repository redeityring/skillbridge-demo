"use client";

import { cn } from "@/lib/cn";

export interface OptionItem {
  id: string;
  label: string;
}

/**
 * A radio group rendered as selectable cards.
 *
 * Built on native `<input type="radio">` so keyboard arrow navigation, screen
 * reader semantics and form behaviour all come for free — the styling only
 * hides the input itself.
 */
export function OptionGroup({
  name,
  legend,
  options,
  value,
  onChange,
  disabled,
  className,
  size = "md",
}: {
  name: string;
  legend: string;
  options: OptionItem[];
  value: string | null;
  onChange: (optionId: string) => void;
  disabled?: boolean;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <fieldset className={cn("min-w-0", className)} disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <div className="space-y-2">
        {options.map((option, index) => {
          const selected = value === option.id;
          // A/B/C/D rather than numbers: matches how these questions read.
          const marker = String.fromCharCode(65 + index);
          return (
            <label
              key={option.id}
              className={cn(
                "group flex touch-manipulation cursor-pointer items-start gap-3 rounded-md border bg-surface transition-[background-color,border-color,box-shadow] duration-150",
                size === "lg" ? "p-4" : "p-3.5",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                selected
                  ? "border-primary/45 bg-primary-subtle shadow-[0_10px_24px_-18px_rgba(79,70,229,0.9)] ring-1 ring-primary/15"
                  : "border-border hover:border-primary/35 hover:bg-surface-muted",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-semibold transition-colors",
                  selected
                    ? "accent-gradient border-transparent text-primary-foreground shadow-[0_4px_10px_-5px_rgba(79,70,229,0.8)]"
                    : "border-border-strong bg-surface text-muted-foreground group-hover:border-primary",
                )}
              >
                {marker}
              </span>
              <span
                className={cn(
                  "text-sm leading-relaxed",
                  selected ? "font-medium text-foreground" : "text-foreground",
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
