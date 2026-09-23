"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FeedbackCard } from "@/components/feedback-card";
import { ScenarioBlock } from "@/components/scenario-block";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { OptionGroup } from "@/components/ui/option-button";
import { StepProgress } from "@/components/ui/progress-bar";
import { TextArea } from "@/components/ui/textarea";
import { findTopic } from "@/content";
import { gradeAnswer } from "@/lib/api-client";
import { demoAnswerForApplication } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import { splitApplicationQuestions } from "@/lib/scoring";
import type { AnswerEvaluation } from "@/lib/types";

/**
 * Reassessment.
 *
 * The same concept, tested on scenarios the learner has not seen. This is what
 * makes the before/after numbers a measurement rather than a repeat of the
 * diagnostic — if the concept only worked on the original wording, the score
 * would not move.
 */
export default function ReassessPage() {
  const { state, patch, hydrated } = useSession();
  const { t, locale } = useI18n();
  const router = useRouter();
  const topic = findTopic(state.topicId, locale);

  const questions = useMemo(
    () => (topic ? splitApplicationQuestions(topic.applicationQuestions).reassessment : []),
    [topic],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[index];

  /**
   * Resume mid-reassessment after a reload — exactly once.
   *
   * Without the `resumed` guard this recomputes from the answers that are
   * already stored, so submitting question 1 immediately jumps the index to
   * question 2 and skips it.
   */
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (!hydrated || !topic || questions.length === 0 || resumed) return;
    const answered = questions.filter(
      (question) => state.reassessmentEvaluations[question.id],
    ).length;
    if (answered > 0 && answered < questions.length) {
      setIndex(Math.min(answered, questions.length - 1));
    }
    setResumed(true);
  }, [hydrated, topic, questions, resumed, state.reassessmentEvaluations]);

  /* One owner for the form fields: the active scenario id. */
  const activeId = current?.id ?? null;
  useEffect(() => {
    if (!hydrated || !activeId) return;
    const prefill = state.demoMode ? demoAnswerForApplication(activeId, locale) : null;
    setSelected(prefill?.optionId ?? null);
    setReasoning(prefill?.reasoning ?? "");
  }, [activeId, state.demoMode, hydrated, locale]);

  const submit = useCallback(async () => {
    if (!current || !topic || !selected) return;
    setSubmitting(true);
    const result = await gradeAnswer({
      topicId: topic.id,
      questionId: current.id,
      options: current.options,
      rubric: current.rubric,
      answer: { optionId: selected, reasoning },
      demoMode: state.demoMode,
      locale,
    });
    patch({
      reassessmentQuestionIds: questions.map((question) => question.id),
      reassessmentAnswers: {
        ...state.reassessmentAnswers,
        [current.id]: { optionId: selected, reasoning },
      },
      reassessmentEvaluations: {
        ...state.reassessmentEvaluations,
        [current.id]: result,
      },
    });
    setEvaluation(result);
    setSubmitting(false);
  }, [
    current,
    topic,
    selected,
    reasoning,
    state.demoMode,
    locale,
    state.reassessmentAnswers,
    state.reassessmentEvaluations,
    questions,
    patch,
  ]);

  const next = useCallback(() => {
    setEvaluation(null);
    if (index + 1 < questions.length) setIndex(index + 1);
    else router.push("/progress");
  }, [index, questions.length, router]);

  if (!hydrated) {
    return <LoadingState title={t.reassessLoadingTitle} messages={[t.reassessLoadingMsg]} />;
  }

  if (!topic || questions.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.noReassessment}</p>
        <Button onClick={() => router.push("/diagnostic")}>{t.startDiagnostic}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StepProgress
        eyebrow={t.reassessEyebrow}
        title={`${topic.title} ${t.reassessTitle}`}
        step={Math.min(index + 1, questions.length)}
        total={questions.length}
      />

      {evaluation ? (
        <FeedbackCard evaluation={evaluation} title={t.reassessScored}>
          <Button onClick={next}>
            {index + 1 < questions.length ? t.nextScenario : t.seeMyProgress}
          </Button>
        </FeedbackCard>
      ) : current ? (
        <div className="space-y-4">
          <ScenarioBlock
            eyebrow={t.unseenScenario}
            skill={current.skill}
            title={current.title}
            scenario={current.scenario}
            constraints={current.constraints}
            decisionPrompt={current.decisionPrompt}
          >
            <div className="space-y-5">
              <OptionGroup
                name={current.id}
                legend={t.chooseAnswer}
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
                placeholder={t.placeholder}
                minWords={15}
                helper={t.sameConceptHelper}
              />
            </div>
          </ScenarioBlock>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={submit}
              loading={submitting}
              disabled={!selected || reasoning.trim().length < 3}
            >
              {t.submitAnswer}
            </Button>
            <span className="text-xs text-subtle-foreground">
              {selected ? t.explainThenSubmit : t.chooseAnswer}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
