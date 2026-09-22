"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

export function TextArea({
  label,
  helper,
  value,
  onChange,
  placeholder,
  rows = 5,
  disabled,
  minWords,
  className,
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** Soft guidance, never a hard block — the learner can submit short answers. */
  minWords?: number;
  className?: string;
}) {
  const id = useId();
  const helperId = helper ? `${id}-helper` : undefined;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const short = minWords !== undefined && wordCount > 0 && wordCount < minWords;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-sm font-medium tracking-[-0.01em] text-foreground"
        >
          {label}
        </label>
        <span
          className={cn(
            "text-xs tabular-nums",
            short ? "text-warning-strong" : "text-subtle-foreground",
          )}
          aria-live="polite"
        >
          {wordCount} words
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-describedby={helperId}
        className={cn(
          "w-full resize-y touch-manipulation rounded-md border border-border bg-surface/90 px-3.5 py-3 text-sm leading-relaxed text-foreground",
          "placeholder:text-subtle-foreground",
          "shadow-[inset_0_1px_2px_rgba(13,16,23,0.04)]",
          "transition-[border-color,box-shadow] duration-150 hover:border-border-strong",
          // The writing area is the heart of the product, so focus is more
          // emphatic here than on any other control.
          "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/12",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
        )}
      />
      {helper ? (
        <p id={helperId} className="text-xs leading-relaxed text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
