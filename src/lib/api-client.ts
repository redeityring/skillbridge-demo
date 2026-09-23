"use client";

/**
 * The one place the client talks to the server.
 *
 * Both functions are total: a failed request never throws into a component.
 * Grading degrades to the local rubric; bridge generation degrades to the
 * curated bank. The learner keeps moving either way. The learner's language
 * travels with every request so the server grades and generates in it.
 */

import { pickBankExercises, stampExercises, type BridgePlan } from "@/lib/bridge";
import type { Locale } from "@/lib/i18n/config";
import { evaluateAnswer } from "@/lib/rubric";
import type {
  AnswerEvaluation,
  AnswerInput,
  ApplicationOption,
  BridgeExercise,
  GapLevel,
  Rubric,
  Topic,
  TopicId,
} from "@/lib/types";

const REQUEST_TIMEOUT_MS = 30_000;

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Grading                                                                    */
/* -------------------------------------------------------------------------- */

export interface GradeArgs {
  topicId: TopicId;
  /** Content question id — the server reads the rubric from the content bank. */
  questionId?: string;
  /** Rubric for generated (bridge) tasks, which the server has not seen before. */
  task?: {
    skill: string;
    scenario: string;
    decisionPrompt: string;
    options: ApplicationOption[];
    rubric: Rubric;
  };
  options: ApplicationOption[];
  rubric: Rubric;
  answer: AnswerInput;
  /**
   * Demo mode changes *which answers* are typed (scripted ones), not *how they
   * are scored*: the same real grading path — AI first, local rubric fallback —
   * runs, so a pitch shows the genuine engine end to end.
   */
  demoMode: boolean;
  /** Learner's language — used by the local fallback and by the AI grader. */
  locale?: Locale;
}

export async function gradeAnswer(args: GradeArgs): Promise<AnswerEvaluation> {
  const locale = args.locale ?? "en";

  const body = args.task
    ? {
        source: "generated" as const,
        topicId: args.topicId,
        task: args.task,
        answer: args.answer,
        locale,
      }
    : {
        source: "content" as const,
        topicId: args.topicId,
        questionId: args.questionId,
        answer: args.answer,
        locale,
      };

  const data = await postJson<{ evaluation: AnswerEvaluation; engine: string }>(
    "/api/evaluate",
    body,
  );

  if (data?.evaluation) return data.evaluation;

  // The endpoint itself was unreachable — still score the real answer.
  return {
    ...evaluateAnswer(args.options, args.rubric, args.answer, locale),
    notice: networkNotice(locale),
  };
}

function networkNotice(locale: Locale): string {
  return locale === "ru"
    ? "Не удалось связаться с сервисом оценки. Ответ оценён локально рубричным движком."
    : "Could not reach the grading service. Scored locally with the rubric engine.";
}

/* -------------------------------------------------------------------------- */
/* Bridge generation                                                          */
/* -------------------------------------------------------------------------- */

export interface BridgeArgs {
  topic: Topic;
  topicId: TopicId;
  runId: string;
  gapLevel: GapLevel;
  plan: BridgePlan;
  count: number;
  demoMode: boolean;
  /** Learner's language — used by AI generation and the bank fallback. */
  locale?: Locale;
}

export async function requestBridgeExercises(args: BridgeArgs): Promise<BridgeResult> {
  const locale = args.locale ?? "en";
  if (args.demoMode) {
    return {
      exercises: stampExercises(
        pickBankExercises(args.topic, args.plan, args.count),
        args.runId,
        "bank",
      ),
      source: "bank",
      notice: null,
    };
  }

  const data = await postJson<BridgeResult>("/api/bridge", {
    topicId: args.topicId,
    runId: args.runId,
    gapLevel: args.gapLevel,
    targetSkills: args.plan.targetSkills,
    weaknesses: args.plan.weaknesses,
    avoid: args.plan.avoid,
    count: args.count,
    locale,
  });

  if (data?.exercises?.length) return data;

  return {
    exercises: stampExercises(
      pickBankExercises(args.topic, args.plan, args.count),
      args.runId,
      "bank",
    ),
    source: "bank",
    notice: bankNotice(locale),
  };
}

function bankNotice(locale: Locale): string {
  return locale === "ru"
    ? "Не удалось связаться с генератором практики. Используем курируемый банк практики."
    : "Could not reach the practice generator. Using the curated practice bank.";
}

export interface BridgeResult {
  exercises: BridgeExercise[];
  source: "ai" | "bank";
  notice: string | null;
}
