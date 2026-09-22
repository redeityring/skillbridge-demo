/**
 * The two AI tasks SkillBridge performs, wrapped so a failure is always a
 * value the caller can handle rather than an exception.
 *
 *   evaluateAnswerWithAi        -> AnswerEvaluation | null  (null = use rubric)
 *   generateBridgeExercisesWithAi -> BridgeExercise[] | null (null = use bank)
 */

import { chatJson } from "./client";
import {
  evaluationResponseSchema,
  generatedExerciseBatchSchema,
  type GeneratedExercise,
} from "./schemas";
import {
  GRADER_SYSTEM,
  GENERATOR_SYSTEM,
  buildGenerationPrompt,
  buildGradingPrompt,
} from "./prompts";
import { weightedScore, clamp } from "@/lib/scoring";
import type {
  AnswerEvaluation,
  AnswerInput,
  ApplicationOption,
  BridgeDifficulty,
  BridgeExercise,
  GapLevel,
  Rubric,
  TopicId,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Grading                                                                    */
/* -------------------------------------------------------------------------- */

export interface GradeRequest {
  subject: string;
  topicTitle: string;
  topicId: TopicId;
  skill: string;
  scenario: string;
  decisionPrompt: string;
  options: ApplicationOption[];
  rubric: Rubric;
  answer: AnswerInput;
}

export type GradeOutcome =
  | { ok: true; evaluation: AnswerEvaluation }
  | { ok: false; error: string };

export async function gradeWithAi(request: GradeRequest): Promise<GradeOutcome> {
  const result = await chatJson({
    system: GRADER_SYSTEM,
    user: buildGradingPrompt({
      subject: request.subject,
      topic: request.topicTitle,
      skill: request.skill,
      scenario: request.scenario,
      decisionPrompt: request.decisionPrompt,
      options: request.options,
      chosenOptionId: request.answer.optionId,
      reasoning: request.answer.reasoning,
      rubric: request.rubric,
    }),
    schema: evaluationResponseSchema,
    maxTokens: 700,
  });

  if (!result.ok) return { ok: false, error: result.error };

  const breakdown = {
    conceptRecognition: clamp(Math.round(result.data.conceptRecognition)),
    reasoning: clamp(Math.round(result.data.reasoning)),
    contextApplication: clamp(Math.round(result.data.contextApplication)),
  };

  return {
    ok: true,
    evaluation: {
      // The composite is computed here, from SCORE_WEIGHTS — not by the model.
      score: weightedScore(breakdown),
      breakdown,
      strengths: result.data.strengths,
      weaknesses: result.data.weaknesses,
      feedback: result.data.feedback.trim(),
      engine: "ai",
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Bridge exercise generation                                                 */
/* -------------------------------------------------------------------------- */

export interface GenerateRequest {
  subject: string;
  topicId: TopicId;
  topicTitle: string;
  gapLevel: GapLevel;
  targetSkills: string[];
  weaknesses: string[];
  avoid: string[];
  count: number;
}

export type GenerateOutcome =
  | { ok: true; exercises: BridgeExercise[] }
  | { ok: false; error: string };

export async function generateBridgeWithAi(
  request: GenerateRequest,
): Promise<GenerateOutcome> {
  const result = await chatJson({
    system: GENERATOR_SYSTEM,
    user: buildGenerationPrompt({
      subject: request.subject,
      topic: request.topicTitle,
      gapLevel: request.gapLevel,
      targetSkills: request.targetSkills,
      weaknesses: request.weaknesses,
      avoid: request.avoid,
      count: request.count,
    }),
    schema: generatedExerciseBatchSchema,
    maxTokens: 2200,
    temperature: 0.6,
  });

  if (!result.ok) return { ok: false, error: result.error };

  const exercises = result.data.exercises
    .map((exercise, index) => normalizeExercise(exercise, request, index))
    .filter((exercise): exercise is BridgeExercise => exercise !== null);

  if (exercises.length === 0) {
    return { ok: false, error: "AI returned exercises that failed content checks." };
  }

  return { ok: true, exercises };
}

/**
 * Normalise a generated task into the app's shape.
 *
 * Content guards, because a generated question is only useful if it is
 * answerable: options must be distinct, exactly one must be the strong answer,
 * and a weak scenario is rejected rather than shown to a learner.
 */
function normalizeExercise(
  exercise: GeneratedExercise,
  request: GenerateRequest,
  index: number,
): BridgeExercise | null {
  const labels = exercise.options.map((option) => option.label.trim().toLowerCase());
  if (new Set(labels).size !== labels.length) return null;

  const options: ApplicationOption[] = exercise.options.map((option, optionIndex) => ({
    id: String.fromCharCode(97 + optionIndex),
    label: option.label.trim(),
    credit: clamp(option.credit, 0, 1),
  }));

  // Guarantee exactly one strong answer so partial credit stays meaningful.
  const strongest = options.reduce((best, option) => (option.credit > best.credit ? option : best), options[0]);
  if (!strongest || strongest.credit < 0.5) return null;
  for (const option of options) {
    if (option.id === strongest.id) option.credit = 1;
    else if (option.credit >= 1) option.credit = 0.35;
  }

  const difficulty: BridgeDifficulty =
    exercise.difficulty ?? (["foundation", "standard", "stretch"][index] as BridgeDifficulty);

  return {
    id: `ai-${request.topicId}-${Date.now().toString(36)}-${index}`,
    topicId: request.topicId,
    skill: exercise.skill.trim() || request.targetSkills[index] || "Applying the concept",
    difficulty,
    scenario: exercise.scenario.trim(),
    decisionPrompt: exercise.decisionPrompt.trim(),
    options,
    reasoningPrompt: exercise.reasoningPrompt.trim(),
    rubric: {
      concepts: exercise.rubric.concepts.map((concept) => concept.trim()),
      reasoningSignals: exercise.rubric.reasoningSignals.map((signal) => signal.trim()),
      mustMention: exercise.rubric.mustMention.trim(),
    },
    hint: exercise.hint.trim(),
  };
}
