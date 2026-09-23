"use client";

import { ComparisonChart, DeltaChip } from "@/components/ui/score";
import { Card, SectionLabel } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * Before → After. The reference line is what makes the improvement legible at a
 * glance: the "after" bar is read against where the learner started.
 */
export function BeforeAfterPanel({
  before,
  after,
  understanding,
  className,
  footer,
}: {
  before: number;
  after: number;
  /** Optional: conceptual understanding for context on the same scale. */
  understanding?: number;
  className?: string;
  footer?: React.ReactNode;
}) {
  const { t } = useI18n();
  const delta = Math.round(after) - Math.round(before);

  return (
    <Card variant="glassStrong" className={cn("animate-rise", className)}>
      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <SectionLabel>{t.applicationAbility}</SectionLabel>
            <p className="text-sm text-muted-foreground">{t.measuredAfterBridging}</p>
          </div>
          <DeltaChip delta={delta} size="lg" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatBlock label={t.before} value={before} tone="before" />
          <StatBlock label={t.after} value={after} tone="after" />
        </div>

        <div className="border-t border-white/60 pt-5">
          <ComparisonChart
            ariaLabel={t.comparisonLegend(Math.round(before), t.before)}
            reference={{ value: before, label: t.before }}
            items={[
              { label: t.before, value: before, tone: "danger" },
              { label: t.after, value: after, tone: "success" },
              ...(understanding !== undefined
                ? [
                    {
                      label: t.understanding,
                      value: understanding,
                      tone: "primary" as const,
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {footer ? <div className="flex flex-wrap gap-3 pt-1">{footer}</div> : null}
      </div>
    </Card>
  );
}

function StatBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "before" | "after";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-5 py-4",
        tone === "after"
          ? "border-success-border bg-success-subtle/85 shadow-[0_10px_24px_-16px_rgba(5,150,105,0.6)]"
          : "border-border bg-surface/80",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.09em]",
          tone === "after" ? "text-success-strong" : "text-subtle-foreground",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-4xl font-semibold tabular-nums tracking-[-0.04em]",
          tone === "after" ? "text-success-strong" : "text-foreground",
        )}
      >
        <CountUp value={value} />
        <span className="text-2xl">%</span>
      </p>
    </div>
  );
}

/**
 * The micro-skill list shown on the progress screen. Only skills the learner
 * actually improved on are listed — this is derived, not decorative.
 */
export function SkillBadgeList({
  skills,
  title = "Skills improved",
  className,
}: {
  skills: string[];
  title?: string;
  className?: string;
}) {
  if (skills.length === 0) return null;
  return (
    <div className={cn("space-y-2.5", className)}>
      <SectionLabel>{title}</SectionLabel>
      <ul className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <li
            key={skill}
            className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-subtle px-3 py-1 text-sm text-success-strong"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path
                d="M3 8.5l3.2 3.2L13 4.8"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}
