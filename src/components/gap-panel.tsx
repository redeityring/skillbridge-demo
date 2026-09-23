"use client";

import { Badge, StatusDot, toneForGapLevel } from "@/components/ui/badge";
import { Card, SectionLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useGapDetails, useGapHeadlines, useGapLabels } from "@/lib/gap-copy-keys";
import { useI18n } from "@/lib/i18n";
import { clamp } from "@/lib/scoring";
import { cn } from "@/lib/cn";
import type { GapAnalysis } from "@/lib/types";

/**
 * The signature visual of the product: the distance between understanding and
 * application, drawn literally. The amber band sits *between* the two bars —
 * that band is the gap the bridge has to close.
 */
export function GapVisual({ analysis, className }: { analysis: GapAnalysis; className?: string }) {
  const { t } = useI18n();
  const labels = useGapLabels();
  const { theoryScore, applicationScore, gap, level } = analysis;
  const levelTone = toneForGapLevel(level);
  const appTone = level === "low" ? "success" : level === "medium" ? "warning" : "danger";
  const start = clamp(applicationScore);
  const width = clamp(theoryScore) - start;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{t.conceptualUnderstanding}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{theoryScore}%</span>
      </div>
      <ProgressBar value={theoryScore} tone="primary" size="lg" label={t.conceptualUnderstanding} />

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
        <span className="text-sm font-medium text-foreground">{t.applicationAbility}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {applicationScore}%
        </span>
      </div>
      <ProgressBar value={applicationScore} tone={appTone} size="lg" label={t.applicationAbility} />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Badge tone={levelTone}>
          <StatusDot tone={levelTone} />
          {labels[level]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {gap > 0 ? t.pointsBetween(gap) : t.noGapBetween}
        </span>
      </div>
    </div>
  );
}

/** Headline + explanation block that accompanies the gap visual. */
export function GapSummary({ analysis, className }: { analysis: GapAnalysis; className?: string }) {
  const { t } = useI18n();
  const labels = useGapLabels();
  const headlines = useGapHeadlines();
  const details = useGapDetails();
  const tone = toneForGapLevel(analysis.level);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <SectionLabel>{t.applicationGapLabel}</SectionLabel>
        <Badge tone={tone}>
          <StatusDot tone={tone} />
          {labels[analysis.level]}
        </Badge>
      </div>
      <p
        className={cn(
          "text-xl font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-2xl",
        )}
      >
        {headlines[analysis.level]}
      </p>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        {details[analysis.level]}
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
