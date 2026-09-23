"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { BeforeAfterPanel, SkillBadgeList } from "@/components/before-after";
import { GapVisual } from "@/components/gap-panel";
import { useSession } from "@/components/session-provider";
import { Badge, toneForScore } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/loading-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { findTopic } from "@/content";
import { analyseSkillLosses } from "@/lib/bridge";
import { useI18n } from "@/lib/i18n";
import {
  GAP_THRESHOLDS,
  analyzeGap,
  formatScore,
  pickTheoryQuestions,
  scoreApplication,
  scoreTheory,
  splitApplicationQuestions,
} from "@/lib/scoring";
import { useGapLabels } from "@/lib/gap-copy-keys";
import type { TopicId, TopicProgress } from "@/lib/types";

/** A skill counts as improved once it clears this on a fresh scenario. */
const IMPROVED_THRESHOLD = 70;

/**
 * Final results.
 *
 * Everything on this screen is derived from the learner's own answers: the
 * before/after delta is the reassessment score minus the diagnostic score, and
 * "skills improved" only lists skills that were weak before and hold up now.
 * No projected or illustrative improvement numbers are shown anywhere.
 */
export default function ProgressPage() {
  const { state, patch, hydrated } = useSession();
  const { t, locale } = useI18n();
  const gapLabels = useGapLabels();
  const router = useRouter();
  const topic = findTopic(state.topicId, locale);

  const theory = useMemo(
    () => (topic ? pickTheoryQuestions(topic.theoryQuestions) : []),
    [topic],
  );
  const split = useMemo(
    () => (topic ? splitApplicationQuestions(topic.applicationQuestions) : null),
    [topic],
  );

  const theoryScore = useMemo(
    () => state.gap?.theoryScore ?? scoreTheory(theory, state.theoryAnswers),
    [state.gap, theory, state.theoryAnswers],
  );
  const beforeScore = useMemo(
    () =>
      state.beforeScore ??
      state.gap?.applicationScore ??
      (split
        ? scoreApplication(
            split.diagnostic.map((question) => question.id),
            state.applicationEvaluations,
          )
        : 0),
    [state.beforeScore, state.gap, split, state.applicationEvaluations],
  );
  /**
   * The "after" figure only exists once the whole reassessment is finished.
   * A partial reassessment would understate or overstate the improvement, and
   * this screen exists to report a measured change, not an estimate.
   */
  const afterScore = useMemo(() => {
    if (!split || split.reassessment.length === 0) return null;
    const allAnswered = split.reassessment.every(
      (question) => state.reassessmentEvaluations[question.id],
    );
    if (!allAnswered) return null;
    return scoreApplication(
      split.reassessment.map((question) => question.id),
      state.reassessmentEvaluations,
    );
  }, [split, state.reassessmentEvaluations]);

  /* Persist the completed run once, so Home and history can use it. */
  useEffect(() => {
    if (!hydrated || !topic || afterScore === null) return;
    const already = state.history.some((entry) => entry.runId === state.runId);
    if (already) return;
    patch({
      afterScore,
      history: [
        ...state.history,
        {
          runId: state.runId,
          topicId: topic.id,
          theoryScore,
          applicationScore: beforeScore,
          afterScore,
          gapLevel: state.gap?.level ?? analyzeGap(theoryScore, beforeScore).level,
          completedAt: new Date().toISOString(),
        },
      ],
    });
  }, [
    hydrated,
    topic,
    afterScore,
    state.history,
    state.runId,
    state.gap,
    theoryScore,
    beforeScore,
    patch,
  ]);

  const improvedSkills = useMemo(() => {
    if (!split) return [];
    const losses = new Map(
      analyseSkillLosses(split.diagnostic, state.applicationEvaluations).map((entry) => [
        entry.skill,
        entry.score,
      ]),
    );
    const seen = new Set<string>();
    const improved: string[] = [];
    for (const attempt of state.bridgeAttempts) {
      const skill = attempt.exercise.skill;
      if (seen.has(skill)) continue;
      const previous = losses.get(skill);
      const wasWeak = previous === undefined || previous < IMPROVED_THRESHOLD;
      if (wasWeak && attempt.evaluation.score >= IMPROVED_THRESHOLD) {
        seen.add(skill);
        improved.push(skill);
      }
    }
    return improved;
  }, [split, state.applicationEvaluations, state.bridgeAttempts]);

  const gap = useMemo(
    () => state.gap ?? analyzeGap(theoryScore, beforeScore),
    [state.gap, theoryScore, beforeScore],
  );

  const history = useMemo(() => [...state.history].reverse(), [state.history]);
  const runInProgress =
    state.topicId !== null &&
    (Object.keys(state.theoryAnswers).length > 0 ||
      Object.keys(state.applicationEvaluations).length > 0);

  if (!hydrated) {
    return <LoadingState title={t.progressLoadingTitle} messages={[t.progressLoadingMsg]} />;
  }

  if (!topic || afterScore === null) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <SectionLabel>{t.progressEyebrow}</SectionLabel>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
            {t.progressTitle}
          </h1>
        </div>
        <EmptyState
          title={emptyStateTitle(t, runInProgress, history.length)}
          description={t.emptyDescription}
          action={
            <Button onClick={() => router.push(runInProgress ? "/reassess" : "/diagnostic")}>
              {runInProgress ? t.finishTheRun : t.homeStart}
            </Button>
          }
        />
        {history.length > 0 ? <HistoryCard history={history} /> : null}
      </div>
    );
  }

  const delta = afterScore - beforeScore;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionLabel>{t.progressTitle}</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{topic.title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t.measuredOnNew}
        </p>
      </div>

      <BeforeAfterPanel
        before={beforeScore}
        after={afterScore}
        understanding={theoryScore}
        footer={
          <>
            <Button size="lg" onClick={() => router.push("/")}>
              {t.continueLearning}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/diagnostic")}>
              {t.runAnother}
            </Button>
          </>
        }
      />

      {/*
        `[&>*]:min-w-0` matters: grid items default to `min-width: auto`, so a
        single-column grid at mobile width lets a card's min-content push the
        track wider than the viewport and the whole page scrolls sideways.
      */}
      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>{t.understandingVsApplication}</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {delta > 0
                ? t.deltaPositive(Math.round(delta), formatScore(theoryScore))
                : t.deltaNeutral}
            </p>
          </CardHeader>
          <div className="px-6 pb-6">
            <GapVisual analysis={analyzeGap(theoryScore, afterScore)} />
          </div>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>{t.skills}</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">{t.skillsNote}</p>
          </CardHeader>
          <div className="space-y-5 px-6 pb-6">
            <SkillBadgeList skills={improvedSkills} title={t.skillsImproved} />
            {improvedSkills.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.noSkillCrossed(IMPROVED_THRESHOLD)}
              </p>
            ) : null}

            <div className="space-y-3 border-t border-border pt-5">
              <SectionLabel>{t.bridgePracticeLabel}</SectionLabel>
              <ul className="space-y-2.5">
                {state.bridgeAttempts.map((attempt) => (
                  <li key={attempt.exercise.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-muted-foreground">
                        {attempt.exercise.skill}
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                        {attempt.evaluation.score}/100
                      </span>
                    </div>
                    <ProgressBar
                      value={attempt.evaluation.score}
                      size="sm"
                      tone={toneForScore(attempt.evaluation.score)}
                      label={`${attempt.exercise.skill} practice score`}
                    />
                  </li>
                ))}
                {state.bridgeAttempts.length === 0 ? (
                  <li className="text-sm text-subtle-foreground">{t.bridgeSkipped}</li>
                ) : null}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
              <SectionLabel>{t.gapAtDiagnosis}</SectionLabel>
              <Badge
                tone={
                  gap.level === "low" ? "success" : gap.level === "medium" ? "warning" : "danger"
                }
              >
                {gapLabels[gap.level]} · {gap.gap} {t.pts}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {history.length > 0 ? <HistoryCard history={history} /> : null}
    </div>
  );
}

function emptyStateTitle(
  t: ReturnType<typeof useI18n>["t"],
  runInProgress: boolean,
  historyCount: number,
): string {
  if (runInProgress) return t.emptyRunNotFinished;
  if (historyCount > 0) return t.emptyNoRun;
  return t.emptyNothingYet;
}

function HistoryCard({ history }: { history: TopicProgress[] }) {
  const { t, locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.allTopics}</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.realResults}</p>
      </CardHeader>
      <ul className="divide-y divide-border border-t border-border">
        {history.map((entry) => {
          const topic = findTopic(entry.topicId as TopicId, locale);
          return (
            <li
              key={entry.runId}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {topic?.title ?? entry.topicId}
                </p>
                <p className="text-xs text-subtle-foreground">
                  {new Date(entry.completedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-subtle-foreground">{t.understanding}</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatScore(entry.theoryScore)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-subtle-foreground">{t.application}</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {entry.afterScore === null
                      ? formatScore(entry.applicationScore)
                      : `${formatScore(entry.applicationScore)} → ${formatScore(entry.afterScore)}`}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
