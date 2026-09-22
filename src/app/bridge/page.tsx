"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FeedbackCard } from "@/components/feedback-card";
import { ScenarioBlock } from "@/components/scenario-block";
import { useSession } from "@/components/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { ErrorNotice, LoadingState } from "@/components/ui/loading-state";
import { OptionGroup } from "@/components/ui/option-button";
import { StepProgress } from "@/components/ui/progress-bar";
import { TextArea } from "@/components/ui/textarea";
import { findTopic } from "@/content/economics";
import { gradeAnswer, requestBridgeExercises } from "@/lib/api-client";
import { buildBridgePlan, type BridgePlan } from "@/lib/bridge";
import { demoAnswerForBridge } from "@/lib/demo";
import {
  ASSESSMENT_CONFIG,
  analyzeGap,
  pickTheoryQuestions,
  scoreApplication,
  scoreTheory,
  splitApplicationQuestions,
} from "@/lib/scoring";
import type { AnswerEvaluation, BridgeExercise } from "@/lib/types";

/**
 * Bridge practice.
 *
 * Deliberately not a chat. The loop is: solve → receive concise feedback →
 * solve the next one. Exercises target the exact skills that lost points in the
 * diagnostic, and each one is a different setting from the last.
 */
export default function BridgePage() {
  const { state, patch, hydrated } = useSession();
  const router = useRouter();
  const topic = findTopic(state.topicId);

  const theory = useMemo(
    () => (topic ? pickTheoryQuestions(topic.theoryQuestions) : []),
    [topic],
  );
  const diagnostic = useMemo(
    () => (topic ? splitApplicationQuestions(topic.applicationQuestions).diagnostic : []),
    [topic],
  );

  const gapLevel = useMemo(() => {
    if (state.gap) return state.gap.level;
    return analyzeGap(
      scoreTheory(theory, state.theoryAnswers),
      scoreApplication(
        diagnostic.map((question) => question.id),
        state.applicationEvaluations,
      ),
    ).level;
  }, [state.gap, theory, state.theoryAnswers, diagnostic, state.applicationEvaluations]);

  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "bank" | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const requested = useRef(false);

  const plan = useMemo<BridgePlan>(
    () =>
      topic
        ? buildBridgePlan(
            topic,
            diagnostic,
            state.applicationEvaluations,
            ASSESSMENT_CONFIG.bridgeExerciseCount,
          )
        : { targetSkills: [], weaknesses: [], avoid: [] },
    [topic, diagnostic, state.applicationEvaluations],
  );

  const generate = useCallback(async () => {
    if (!topic) return;
    setGenerating(true);
    setFailed(null);
    const result = await requestBridgeExercises({
      topic,
      topicId: topic.id,
      runId: state.runId,
      gapLevel,
      plan,
      count: ASSESSMENT_CONFIG.bridgeExerciseCount,
      demoMode: state.demoMode,
    });
    if (result.exercises.length === 0) {
      setFailed("Could not build practice tasks. You can still be reassessed.");
      setGenerating(false);
      return;
    }
    patch({ bridgeExercises: result.exercises });
    setSource(result.source);
    setNotice(result.notice);
    setGenerating(false);
  }, [topic, state.runId, state.demoMode, gapLevel, plan, patch]);

  /* Generate once, unless this run already has exercises from an earlier load. */
  useEffect(() => {
    if (!hydrated || !topic) return;
    if (requested.current) return;
    if (state.bridgeExercises.length > 0) {
      requested.current = true;
      return;
    }
    requested.current = true;
    void generate();
  }, [hydrated, topic, state.bridgeExercises.length, generate]);

  const exercises: BridgeExercise[] = state.bridgeExercises;
  const attemptCount = state.bridgeAttempts.length;
  const current: BridgeExercise | undefined = exercises[attemptCount];
  /** The task that was just graded — `current` has already moved on. */
  const lastAttempt = state.bridgeAttempts[attemptCount - 1];
  const remaining = exercises.length - attemptCount;
  const done = exercises.length > 0 && attemptCount >= exercises.length;

  /**
   * The form fields are owned by the active challenge id.
   *
   * A single effect (rather than clearing fields in the "next" handler) keeps
   * this correct: advancing must never wipe an answer that demo mode just
   * loaded, and it must never carry a previous answer into the next task.
   */
  const activeId = current?.id ?? null;
  useEffect(() => {
    if (!hydrated || !activeId) return;
    const prefill = state.demoMode ? demoAnswerForBridge(activeId) : null;
    setSelected(prefill?.optionId ?? null);
    setReasoning(prefill?.reasoning ?? "");
  }, [activeId, state.demoMode, hydrated]);

  const submit = useCallback(async () => {
    if (!current || !topic || !selected) return;
    setSubmitting(true);
    const result = await gradeAnswer({
      topicId: topic.id,
      task: {
        skill: current.skill,
        scenario: current.scenario,
        decisionPrompt: current.decisionPrompt,
        options: current.options,
        rubric: current.rubric,
      },
      options: current.options,
      rubric: current.rubric,
      answer: { optionId: selected, reasoning },
      demoMode: state.demoMode,
    });
    patch({
      bridgeAttempts: [
        ...state.bridgeAttempts,
        { exercise: current, answer: { optionId: selected, reasoning }, evaluation: result },
      ],
    });
    setEvaluation(result);
    setSubmitting(false);
  }, [current, topic, selected, reasoning, state.demoMode, state.bridgeAttempts, patch]);

  const next = useCallback(() => {
    setEvaluation(null);
  }, []);

  if (!hydrated) {
    return <LoadingState title="Loading bridge practice…" messages={["Restoring your session…"]} />;
  }

  if (!topic) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          No topic selected. Start with a diagnostic first.
        </p>
        <div className="mt-4">
          <Button onClick={() => router.push("/diagnostic")}>Start diagnostic</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <StepProgress
        eyebrow={`Bridge practice · ${gapLevel} gap`}
        title={`Strengthen: ${topic.title}`}
        step={Math.min(attemptCount + 1, Math.max(exercises.length, 1))}
        total={Math.max(exercises.length, 1)}
      />

      {notice ? <ErrorNotice message={notice} /> : null}

      {source ? (
        <p className="text-xs leading-relaxed text-subtle-foreground">
          {source === "ai"
            ? "Practice generated for the skills that lost points in your diagnostic."
            : "Practice selected from the curated bank for the skills that lost points in your diagnostic."}
        </p>
      ) : null}

      {generating ? (
        <LoadingState
          title="Building your practice…"
          messages={[
            `Targeting: ${plan.targetSkills[0] ?? "your weakest skill"}…`,
            "Writing a new scenario…",
            "Calibrating the difficulty…",
          ]}
        />
      ) : null}

      {failed ? (
        <Card className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">{failed}</p>
          <Button variant="secondary" onClick={() => void generate()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {!generating && current && !evaluation ? (
        <div className="space-y-4">
          <ScenarioBlock
            eyebrow={`Challenge ${attemptCount + 1} of ${exercises.length}`}
            skill={current.skill}
            title={`Targeted practice · ${current.skill}`}
            scenario={current.scenario}
            decisionPrompt={current.decisionPrompt}
            badge={
              <Badge tone={current.difficulty === "stretch" ? "warning" : "neutral"}>
                {current.difficulty}
              </Badge>
            }
          >
            <div className="space-y-5">
              <OptionGroup
                name={current.id}
                legend="Choose an answer"
                options={current.options.map((option) => ({
                  id: option.id,
                  label: option.label,
                }))}
                value={selected}
                onChange={setSelected}
              />
              <TextArea
                label={current.reasoningPrompt}
                value={reasoning}
                onChange={setReasoning}
                placeholder="Two or three sentences is enough."
                minWords={15}
              />
              <details className="rounded-md border border-border bg-surface-muted px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Need a hint?
                </summary>
                <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{current.hint}</p>
              </details>
            </div>
          </ScenarioBlock>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={submit}
              loading={submitting}
              disabled={!selected || reasoning.trim().length < 3}
            >
              Check answer
            </Button>
            <span className="text-xs text-subtle-foreground">
              {selected ? "Now explain the trade-off in your own words." : "Choose an answer."}
            </span>
          </div>
        </div>
      ) : null}

      {evaluation ? (
        <FeedbackCard evaluation={evaluation} title={lastAttempt?.exercise.skill ?? "Challenge"}>
          <Button onClick={next}>
            {remaining > 0 ? `Next challenge (${remaining} left)` : "Finish bridge practice"}
          </Button>
        </FeedbackCard>
      ) : null}

      {done && !evaluation ? (
        <Card className="animate-fade-up">
          <CardHeader>
            <SectionLabel>Bridge complete</SectionLabel>
            <CardTitle>Now let&apos;s measure it again</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You practised {exercises.length} task{exercises.length === 1 ? "" : "s"} targeting{" "}
              {[...new Set(exercises.map((exercise) => exercise.skill))].join(", ")}. The next step
              uses scenarios you have not seen, so the improvement is measured — not assumed.
            </p>
          </CardHeader>
          <div className="flex flex-wrap items-center gap-3 px-6 pb-5">
            <Button size="lg" onClick={() => router.push("/reassess")}>
              Reassess my application
            </Button>
            <Button variant="ghost" onClick={() => router.push("/gap")}>
              Back to gap analysis
            </Button>
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {state.bridgeAttempts.map((attempt) => (
              <li
                key={attempt.exercise.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              >
                <span className="text-sm text-muted-foreground">{attempt.exercise.skill}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {attempt.evaluation.score} / 100
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
