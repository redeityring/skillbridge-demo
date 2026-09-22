import { Badge, StatusDot, toneForScore } from "@/components/ui/badge";
import { Card, SectionLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SCORE_WEIGHTS } from "@/lib/scoring";
import type { AnswerEvaluation } from "@/lib/types";

/**
 * Compact feedback — never an essay.
 *
 * Layout mirrors the three scoring dimensions, so the learner can see *why*
 * the number is what it is rather than being handed an opaque grade.
 */
export function FeedbackCard({
  evaluation,
  title = "Feedback",
  children,
}: {
  evaluation: AnswerEvaluation;
  title?: string;
  children?: React.ReactNode;
}) {
  const tone = toneForScore(evaluation.score);

  return (
    <Card className="animate-fade-up overflow-hidden">
      <div className="space-y-4 px-5 pt-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</p>
            <Badge tone={evaluation.engine === "ai" ? "primary" : "neutral"}>
              <StatusDot tone={evaluation.engine === "ai" ? "primary" : "neutral"} />
              {evaluation.engine === "ai" ? "AI graded" : "Local rubric"}
            </Badge>
          </div>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {evaluation.score}
            <span className="text-muted-foreground"> / 100</span>
          </p>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{evaluation.feedback}</p>

        {evaluation.strengths.length > 0 ? (
          <div className="space-y-1.5">
            <SectionLabel>What worked</SectionLabel>
            <ul className="space-y-1">
              {evaluation.strengths.map((strength) => (
                <li key={strength} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <CheckMark />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {evaluation.weaknesses.length > 0 ? (
          <div className="space-y-1.5">
            <SectionLabel>What to fix</SectionLabel>
            <ul className="space-y-1">
              {evaluation.weaknesses.map((weakness) => (
                <li key={weakness} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-warning" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-2.5 rounded-md border border-border bg-surface-muted/70 px-4 py-3.5 shadow-[inset_0_1px_2px_rgba(13,16,23,0.04)]">
          <p className="text-xs font-medium text-muted-foreground">
            How this score was built
          </p>
          <ScoreLine
            label="Concept recognition"
            weight={SCORE_WEIGHTS.conceptRecognition}
            value={evaluation.breakdown.conceptRecognition}
          />
          <ScoreLine
            label="Reasoning"
            weight={SCORE_WEIGHTS.reasoning}
            value={evaluation.breakdown.reasoning}
          />
          <ScoreLine
            label="Context application"
            weight={SCORE_WEIGHTS.contextApplication}
            value={evaluation.breakdown.contextApplication}
          />
        </div>

        {evaluation.notice ? (
          <p className="text-xs leading-relaxed text-subtle-foreground">{evaluation.notice}</p>
        ) : null}

        {children ? <div className="flex flex-wrap gap-3 pt-0.5">{children}</div> : null}
      </div>
      {/* A single accent rule at the foot of the card, coloured by outcome. */}
      <div
        className={`h-1 ${
          tone === "danger" ? "fill-danger" : tone === "warning" ? "fill-warning" : "fill-success"
        }`}
      />
    </Card>
  );
}

function ScoreLine({
  label,
  weight,
  value,
}: {
  label: string;
  weight: number;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-xs text-muted-foreground">
        {label} <span className="text-subtle-foreground">· {Math.round(weight * 100)}%</span>
      </span>
      <div className="min-w-0 flex-1">
        <ProgressBar value={value} size="sm" tone={toneForScore(value)} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-1 h-3.5 w-3.5 shrink-0 text-success"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8.5l3.2 3.2L13 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
