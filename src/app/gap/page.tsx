"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { GapCard } from "@/components/gap-panel";
import { useSession } from "@/components/session-provider";
import { Badge, toneForScore } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { findTopic } from "@/content/economics";
import {
  analyzeGap,
  formatScore,
  pickTheoryQuestions,
  scoreApplication,
  scoreTheory,
  splitApplicationQuestions,
} from "@/lib/scoring";

/**
 * Gap analysis.
 *
 * The most important screen in the product: it puts conceptual understanding
 * and application ability on the same scale and names the distance between
 * them. Everything here is computed from the learner's own answers.
 */
export default function GapPage() {
  const { state, patch, hydrated } = useSession();
  const router = useRouter();
  const topic = findTopic(state.topicId);

  const theory = useMemo(
    () => (topic ? pickTheoryQuestions(topic.theoryQuestions) : []),
    [topic],
  );
  const application = useMemo(
    () => (topic ? splitApplicationQuestions(topic.applicationQuestions).diagnostic : []),
    [topic],
  );

  const theoryScore = useMemo(
    () => scoreTheory(theory, state.theoryAnswers),
    [theory, state.theoryAnswers],
  );
  const applicationScore = useMemo(
    () =>
      scoreApplication(
        application.map((question) => question.id),
        state.applicationEvaluations,
      ),
    [application, state.applicationEvaluations],
  );
  const analysis = useMemo(
    () => analyzeGap(theoryScore, applicationScore),
    [theoryScore, applicationScore],
  );

  const hasResults = application.some(
    (question) => state.applicationEvaluations[question.id] !== undefined,
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!topic || !hasResults) router.replace("/diagnostic");
  }, [hydrated, topic, hasResults, router]);

  /* Persist the diagnosis so later screens read the same numbers. */
  useEffect(() => {
    if (!hydrated || !topic || !hasResults) return;
    const changed =
      state.gap?.theoryScore !== analysis.theoryScore ||
      state.gap?.applicationScore !== analysis.applicationScore ||
      state.beforeScore !== applicationScore;
    if (changed) patch({ gap: analysis, beforeScore: applicationScore });
  }, [
    hydrated,
    topic,
    hasResults,
    analysis,
    applicationScore,
    state.gap,
    state.beforeScore,
    patch,
  ]);

  if (!hydrated || !topic || !hasResults) {
    return <LoadingState title="Calculating your gap…" messages={["Comparing your answers…"]} />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionLabel>Your results</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
          {topic.title}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Two abilities, measured separately on the same concept.
        </p>
      </div>

      <GapCard
        analysis={analysis}
        footer={
          <>
            <Button
              size="lg"
              onClick={() => router.push("/bridge")}
              disabled={analysis.level === "low"}
            >
              Bridge the gap
            </Button>
            <Button variant="ghost" onClick={() => router.push("/diagnostic")}>
              Back to diagnostic
            </Button>
            {analysis.level === "low" ? (
              <span className="text-xs text-subtle-foreground">
                Understanding and application already align — bridge practice is optional.
              </span>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Where the points went</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {application.length} application scenarios, scored on concept recognition, reasoning
            and context application.
          </p>
        </CardHeader>
        <ul className="divide-y divide-border border-t border-border">
          {application.map((question, index) => {
            const evaluation = state.applicationEvaluations[question.id];
            const answer = state.applicationAnswers[question.id];
            const chosen = question.options.find((option) => option.id === answer?.optionId);
            return (
              <li key={question.id} className="space-y-3 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-subtle-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Badge tone="neutral">{question.skill}</Badge>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatScore(evaluation?.score)}
                    <span className="text-subtle-foreground"> / 100</span>
                  </span>
                </div>
                <ProgressBar
                  value={evaluation?.score ?? 0}
                  size="sm"
                  tone={toneForScore(evaluation?.score ?? 0)}
                  label={`${question.skill} score`}
                />
                {chosen ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="text-subtle-foreground">You chose: </span>
                    {chosen.label}
                  </p>
                ) : null}
                {evaluation?.weaknesses[0] ? (
                  <p className="text-xs leading-relaxed text-warning-strong">
                    {evaluation.weaknesses[0]}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
