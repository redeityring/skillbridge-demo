"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FeedbackCard } from "@/components/feedback-card";
import { ScenarioBlock } from "@/components/scenario-block";
import { useSession } from "@/components/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, SectionLabel } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { OptionGroup } from "@/components/ui/option-button";
import { StepProgress } from "@/components/ui/progress-bar";
import { TextArea } from "@/components/ui/textarea";
import { TOPICS, findTopic } from "@/content/economics";
import { gradeAnswer } from "@/lib/api-client";
import {
  DEMO_TOPIC_ID,
  demoAnswerForApplication,
  demoAnswerForTheory,
} from "@/lib/demo";
import { evaluateAnswer } from "@/lib/rubric";
import { pickTheoryQuestions, splitApplicationQuestions } from "@/lib/scoring";
import type { AnswerEvaluation, TheoryQuestion, ApplicationQuestion } from "@/lib/types";

/**
 * The diagnostic measures two abilities separately:
 *   phase 1 — theory questions   -> conceptual understanding
 *   phase 2 — application tasks  -> ability to transfer the concept
 *
 * They are kept visually distinct on purpose. The application screens look and
 * feel different from a quiz, because that difference is the product.
 */
export default function DiagnosticPage() {
  const { state, patch, startRun, hydrated } = useSession();
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
  const total = theory.length + application.length;

  const [phase, setPhase] = useState<"theory" | "application">("theory");
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [appIndex, setAppIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resumed, setResumed] = useState(false);

  /* Resume an interrupted run instead of restarting it. */
  useEffect(() => {
    if (!hydrated || !topic || resumed) return;
    const evaluated = application.filter((q) => state.applicationEvaluations[q.id]).length;
    const answered = theory.filter((q) => state.theoryAnswers[q.id]).length;

    if (evaluated >= application.length && evaluated > 0) {
      router.replace("/gap");
    } else if (evaluated > 0) {
      setPhase("application");
      setAppIndex(Math.min(evaluated, application.length - 1));
    } else if (answered >= theory.length && theory.length > 0) {
      setPhase("application");
    } else {
      setTheoryIndex(Math.min(answered, Math.max(theory.length - 1, 0)));
    }
    setResumed(true);
  }, [hydrated, topic, resumed, state.theoryAnswers, state.applicationEvaluations, theory, application, router]);

  const currentTheory: TheoryQuestion | undefined = theory[theoryIndex];
  const currentApplication: ApplicationQuestion | undefined = application[appIndex];

  /**
   * The form fields belong to the active question.
   *
   * One effect owns them, keyed on the question id: advancing clears the
   * previous answer, and in demo mode the scripted answer is loaded so a pitch
   * is hands-free. Doing this in the "next" handlers instead would race with
   * this effect and wipe the prefill.
   */
  const activeId =
    phase === "theory" ? (currentTheory?.id ?? null) : (currentApplication?.id ?? null);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    const prefill = state.demoMode
      ? phase === "theory"
        ? demoAnswerForTheory(activeId)
        : demoAnswerForApplication(activeId)
      : null;
    setSelected(prefill?.optionId ?? null);
    setReasoning(prefill?.reasoning ?? "");
  }, [activeId, phase, state.demoMode, hydrated]);

  const answerTheory = useCallback(() => {
    if (!currentTheory || !selected) return;
    patch({
      theoryAnswers: {
        ...state.theoryAnswers,
        [currentTheory.id]: { optionId: selected, reasoning: "" },
      },
    });
    if (theoryIndex + 1 < theory.length) setTheoryIndex(theoryIndex + 1);
    else setPhase("application");
  }, [currentTheory, selected, patch, state.theoryAnswers, theoryIndex, theory.length]);

  const submitApplication = useCallback(async () => {
    if (!currentApplication || !topic || !selected) return;
    setSubmitting(true);
    const result = await gradeAnswer({
      topicId: topic.id,
      questionId: currentApplication.id,
      options: currentApplication.options,
      rubric: currentApplication.rubric,
      answer: { optionId: selected, reasoning },
      demoMode: state.demoMode,
    });
    patch({
      applicationAnswers: {
        ...state.applicationAnswers,
        [currentApplication.id]: { optionId: selected, reasoning },
      },
      applicationEvaluations: {
        ...state.applicationEvaluations,
        [currentApplication.id]: result,
      },
    });
    setEvaluation(result);
    setSubmitting(false);
  }, [currentApplication, topic, selected, reasoning, state.demoMode, state.applicationAnswers, state.applicationEvaluations, patch]);

  const nextApplication = useCallback(() => {
    setEvaluation(null);
    if (appIndex + 1 < application.length) setAppIndex(appIndex + 1);
    else router.push("/gap");
  }, [appIndex, application.length, router]);

  /** Demo helper: fills the whole diagnostic and jumps to the gap analysis. */
  const fastForward = useCallback(() => {
    if (!topic) return;
    const theoryAnswers = { ...state.theoryAnswers };
    for (const question of theory) {
      const prefill = demoAnswerForTheory(question.id);
      if (prefill) theoryAnswers[question.id] = prefill;
    }
    const applicationAnswers = { ...state.applicationAnswers };
    const applicationEvaluations = { ...state.applicationEvaluations };
    for (const question of application) {
      const prefill = demoAnswerForApplication(question.id);
      if (!prefill) continue;
      applicationAnswers[question.id] = prefill;
      applicationEvaluations[question.id] = evaluateAnswer(
        question.options,
        question.rubric,
        prefill,
      );
    }
    patch({ theoryAnswers, applicationAnswers, applicationEvaluations });
    router.push("/gap");
  }, [topic, theory, application, state.theoryAnswers, state.applicationAnswers, state.applicationEvaluations, patch, router]);

  if (!hydrated) {
    return <LoadingState title="Loading your session…" messages={["Restoring your answers…"]} />;
  }

  if (!topic) {
    return (
      <TopicChooser
        onSelect={(topicId, demo) => {
          startRun(topicId, demo);
        }}
      />
    );
  }

  const step = phase === "theory" ? theoryIndex + 1 : theory.length + appIndex + 1;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <StepProgress
          eyebrow={`${topic.subjectLabel} · ${phase === "theory" ? "theory" : "application"}`}
          title={topic.title}
          step={step}
          total={total}
        />
        {state.demoMode ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning-border bg-warning-subtle px-4 py-3">
            <p className="text-xs leading-relaxed text-warning-strong">
              Demo mode — answers are scripted and scored locally, so the run is deterministic and
              works without network access.
            </p>
            <Button size="sm" variant="secondary" onClick={fastForward}>
              Skip to results
            </Button>
          </div>
        ) : null}
      </div>

      {phase === "theory" && currentTheory ? (
        <Card className="animate-fade-up">
          <div className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-center gap-2">
              <SectionLabel>Theory</SectionLabel>
              <Badge tone="neutral">{currentTheory.skill}</Badge>
            </div>
            <h2 className="text-lg font-semibold leading-snug tracking-[-0.02em] text-foreground">
              {currentTheory.prompt}
            </h2>
            <OptionGroup
              name={currentTheory.id}
              legend="Choose an answer"
              options={currentTheory.options.map((option) => ({
                id: option.id,
                label: option.label,
              }))}
              value={selected}
              onChange={setSelected}
            />
          </div>
          <CardFooter>
            <Button onClick={answerTheory} disabled={!selected}>
              {theoryIndex + 1 < theory.length ? "Continue" : "Continue to application"}
            </Button>
            <span className="text-xs text-subtle-foreground">
              {selected ? "Answer recorded. Continue when ready." : "Choose an answer."}
            </span>
          </CardFooter>
        </Card>
      ) : null}

      {phase === "application" && currentApplication ? (
        evaluation ? (
          <FeedbackCard evaluation={evaluation} title="Answer scored">
            <Button onClick={nextApplication}>
              {appIndex + 1 < application.length ? "Next scenario" : "See my results"}
            </Button>
          </FeedbackCard>
        ) : (
          <div className="space-y-4">
            <ScenarioBlock
              eyebrow="Application challenge"
              skill={currentApplication.skill}
              title={currentApplication.title}
              scenario={currentApplication.scenario}
              constraints={currentApplication.constraints}
              decisionPrompt={currentApplication.decisionPrompt}
            >
              <div className="space-y-5">
                <OptionGroup
                  name={currentApplication.id}
                  legend="Choose an answer"
                  options={currentApplication.options.map((option) => ({
                    id: option.id,
                    label: option.label,
                  }))}
                  value={selected}
                  onChange={setSelected}
                />
                <TextArea
                  label={currentApplication.reasoningPrompt}
                  value={reasoning}
                  onChange={setReasoning}
                  placeholder="Two or three sentences is enough."
                  minWords={15}
                  helper="Your reasoning is what SkillBridge measures — not just your choice."
                />
              </div>
            </ScenarioBlock>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={submitApplication}
                loading={submitting}
                disabled={!selected || reasoning.trim().length < 3}
              >
                Submit answer
              </Button>
              <span className="text-xs text-subtle-foreground">
                {!selected
                  ? "Pick the alternative you think is strongest."
                  : "Explain your reasoning, then submit."}
              </span>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TopicChooser({
  onSelect,
}: {
  onSelect: (topicId: (typeof TOPICS)[number]["id"], demo: boolean) => void;
}) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionLabel>Start diagnostic</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
          Choose a topic
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Each diagnostic takes about two minutes: four theory questions, then three application
          scenarios that test whether you can transfer the concept to a new situation.
        </p>
      </div>

      <ul className="grid gap-3">
        {TOPICS.map((item) => (
          <Card as="li" key={item.id} className="transition-colors hover:border-border-strong">
            <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                  {item.subjectLabel} · {item.title}
                </p>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                  {item.blurb}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  onSelect(item.id, false);
                }}
              >
                Start
              </Button>
            </div>
          </Card>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(DEMO_TOPIC_ID, true)}
        >
          Run demo instead
        </Button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-subtle-foreground underline-offset-4 hover:underline"
        >
          Back home
        </button>
      </div>
    </div>
  );
}
