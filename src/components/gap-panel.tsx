import { Badge, StatusDot, toneForGapLevel } from "@/components/ui/badge";
import { Card, SectionLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { GAP_COPY, clamp } from "@/lib/scoring";
import { cn } from "@/lib/cn";
import type { GapAnalysis } from "@/lib/types";

/**
 * The signature visual of the product: the distance between understanding and
 * application, drawn literally. The amber band sits *between* the two bars —
 * that band is the gap the bridge has to close.
 */
export function GapVisual({
  analysis,
  className,
}: {
  analysis: GapAnalysis;
  className?: string;
}) {
  const { theoryScore, applicationScore, gap, level } = analysis;
  const levelTone = toneForGapLevel(level);
  const appTone = level === "low" ? "success" : level === "medium" ? "warning" : "danger";
  const start = clamp(applicationScore);
  const width = clamp(theoryScore) - start;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Conceptual understanding</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {theoryScore}%
        </span>
      </div>
      <ProgressBar
        value={theoryScore}
        tone="primary"
        size="lg"
        label="Conceptual understanding"
      />

      {/* The band between the two bars *is* the gap, so it carries the amber
          semantic colour and nothing else on this screen does. */}
      <div className="py-1" aria-hidden="true">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken shadow-[inset_0_1px_2px_rgba(13,16,23,0.08)]">
          {width > 0 ? (
            <div
              className="fill-warning absolute inset-y-0 rounded-full transition-[left,width] duration-700 ease-out"
              style={{ left: `${start}%`, width: `${width}%` }}
            />
          ) : null}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Application ability</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {applicationScore}%
        </span>
      </div>
      <ProgressBar
        value={applicationScore}
        tone={appTone}
        size="lg"
        label="Application ability"
      />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Badge tone={levelTone}>
          <StatusDot tone={levelTone} />
          {GAP_COPY[level].label} gap
        </Badge>
        <span className="text-xs text-muted-foreground">
          {gap > 0 ? `${gap} points` : "no gap"} between knowing and applying
        </span>
      </div>
    </div>
  );
}

/** Headline + explanation block that accompanies the gap visual. */
export function GapSummary({
  analysis,
  className,
}: {
  analysis: GapAnalysis;
  className?: string;
}) {
  const tone = toneForGapLevel(analysis.level);
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <SectionLabel>Application gap</SectionLabel>
        <Badge tone={tone}>
          <StatusDot tone={tone} />
          {GAP_COPY[analysis.level].label}
        </Badge>
      </div>
      <p
        className={cn(
          "text-xl font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-2xl",
        )}
      >
        {analysis.headline}
      </p>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        {analysis.detail}
      </p>
    </div>
  );
}

export function GapCard({
  analysis,
  footer,
}: {
  analysis: GapAnalysis;
  footer?: React.ReactNode;
}) {
  // The gap is the product's signature moment, so it gets the most expressive
  // surface in the app: glass with a hint of the accent in its edge.
  return (
    <Card variant="glassAccent" className="animate-rise">
      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
        <GapSummary analysis={analysis} />
        <GapVisual analysis={analysis} />
      </div>
      {footer ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-white/60 px-6 py-4 sm:px-8">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
