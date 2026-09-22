import { cn } from "@/lib/cn";
import { clamp } from "@/lib/scoring";
import { ProgressBar, type ProgressTone } from "@/components/ui/progress-bar";

/** Large score readout used for Theory / Application comparisons. */
export function ScoreMeter({
  label,
  caption,
  value,
  tone = "primary",
  size = "md",
  className,
}: {
  label: string;
  caption?: string;
  value: number;
  tone?: ProgressTone;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-[-0.01em] text-foreground">{label}</p>
          {caption ? (
            <p className="text-xs text-muted-foreground">{caption}</p>
          ) : null}
        </div>
        <p
          className={cn(
            "font-semibold tabular-nums tracking-[-0.03em] text-foreground",
            size === "lg" ? "text-3xl" : "text-xl",
          )}
        >
          {Math.round(clamp(value))}%
        </p>
      </div>
      <ProgressBar value={value} tone={tone} size={size === "lg" ? "lg" : "md"} label={label} />
    </div>
  );
}

export interface ChartItem {
  label: string;
  value: number;
  tone?: ProgressTone;
  /** Optional right-hand annotation, e.g. "after bridging". */
  note?: string;
}

/**
 * Horizontal comparison chart.
 *
 * A grouped bar chart is the wrong shape for two or three numbers — aligned
 * bars read instantly and can carry a reference line, which is how the
 * before/after story is told.
 */
export function ComparisonChart({
  items,
  reference,
  ariaLabel,
  className,
}: {
  items: ChartItem[];
  reference?: { value: number; label: string };
  ariaLabel: string;
  className?: string;
}) {
  const summary = items.map((item) => `${item.label} ${Math.round(item.value)} percent`).join(", ");

  return (
    <div
      className={cn(
        // `--chart-label` is the label column width; the shared track geometry
        // below depends on it, so both change together across breakpoints.
        "space-y-3 [--chart-label:5.5rem] sm:[--chart-label:9rem]",
        className,
      )}
      role="img"
      aria-label={`${ariaLabel}: ${summary}`}
    >
      <div className="relative space-y-3">
        {reference ? (
          <div
            className="pointer-events-none absolute inset-y-0 z-10 border-l border-dashed border-border-strong"
            /*
             * Track geometry: the label column, a 0.75rem gap, the bar, a 3.5rem
             * value column and another 0.75rem gap. So the track starts after
             * the label plus one gap and spans `100% - label - 5rem`.
             *
             * `reference.value` is deliberately a unitless number: CSS calc
             * cannot multiply a percentage by a length, and `27% * (100% - 14rem)`
             * is invalid, which drops the declaration silently.
             */
            style={{
              left: `calc(var(--chart-label) + 0.75rem + ${clamp(reference.value)} * (100% - var(--chart-label) - 5rem) / 100)`,
            }}
            aria-hidden="true"
          />
        ) : null}

        {items.map((item) => (
          <div key={item.label} className="relative flex items-center gap-3" aria-hidden="true">
            <span className="w-(--chart-label) shrink-0 truncate text-sm text-muted-foreground">
              {item.label}
            </span>
            <div className="min-w-0 flex-1">
              <ProgressBar value={item.value} tone={item.tone ?? "primary"} size="md" />
            </div>
            <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
              {Math.round(clamp(item.value))}%
            </span>
          </div>
        ))}

        {reference ? (
          <p
            className="pt-0.5 text-xs text-subtle-foreground pl-[calc(var(--chart-label)+0.75rem)]"
            aria-hidden="true"
          >
            Dashed line = {reference.label} ({Math.round(reference.value)}%)
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Signed points change, e.g. "+34 pts". */
export function DeltaChip({
  delta,
  className,
  size = "md",
}: {
  delta: number;
  className?: string;
  size?: "md" | "lg";
}) {
  const positive = delta > 0;
  const flat = delta === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-semibold tabular-nums",
        size === "lg" ? "text-lg" : "text-sm",
        flat
          ? "border-border bg-surface-muted text-muted-foreground"
          : positive
            ? "border-success-border bg-success-subtle text-success-strong"
            : "border-danger-border bg-danger-subtle text-danger-strong",
        className,
      )}
    >
      {positive ? "+" : ""}
      {Math.round(delta)} pts
    </span>
  );
}
