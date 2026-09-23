"use client";

import { useI18n } from "@/lib/i18n";
import { clamp } from "@/lib/scoring";
import { cn } from "@/lib/cn";

export type ProgressTone = "primary" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<ProgressTone, string> = {
  primary: "fill-primary",
  success: "fill-success",
  warning: "fill-warning",
  danger: "fill-danger",
  neutral: "fill-neutral",
};

export function ProgressBar({
  value,
  tone = "primary",
  size = "md",
  label,
  showValue = false,
  className,
}: {
  /** 0..100 */
  value: number;
  tone?: ProgressTone;
  size?: "sm" | "md" | "lg";
  /** Accessible name for the bar. */
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const safe = clamp(value);
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(safe)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-sunken shadow-[inset_0_1px_2px_rgba(13,16,23,0.07)]",
          height,
        )}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", TONES[tone])}
          style={{ width: `${safe}%` }}
        />
      </div>
      {showValue ? (
        <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
          {Math.round(safe)}%
        </span>
      ) : null}
    </div>
  );
}

function useQuestionLabel() {
  const { t } = useI18n();
  return t.questionOf;
}

/**
 * The compact step header used by every assessment screen:
 * `ECONOMICS · OPPORTUNITY COST` on the left, `3 / 7` on the right.
 */
export function StepProgress({
  eyebrow,
  title,
  step,
  total,
  className,
}: {
  eyebrow: string;
  title: string;
  step: number;
  total: number;
  className?: string;
}) {
  const questionOf = useQuestionLabel();
  const percent = total > 0 ? (step / total) * 100 : 0;
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-primary">
            {eyebrow}
          </p>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
        </div>
        <p
          className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground"
          aria-label={questionOf(step, total)}
        >
          {step} / {total}
        </p>
      </div>
      <ProgressBar value={percent} label={questionOf(step, total)} />
    </div>
  );
}
