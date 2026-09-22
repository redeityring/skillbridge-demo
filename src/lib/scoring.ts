/**
 * Scoring & gap analysis.
 *
 * Every threshold and weight that shapes the product's judgement lives in this
 * one file. UI components never decide what a "high gap" is — they render what
 * `analyzeGap()` returns.
 *
 *   theoryScore       = share of theory questions answered correctly   (0..100)
 *   applicationScore  = mean of per-answer application scores          (0..100)
 *   gap               = theoryScore - applicationScore                 (points)
 */

import type {
  AnswerEvaluation,
  ApplicationQuestion,
  GapAnalysis,
  GapLevel,
  TheoryQuestion,
  AnswerInput,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Tunable configuration                                                      */
/* -------------------------------------------------------------------------- */

/** Assessment shape. One place to change how long the loop takes. */
export const ASSESSMENT_CONFIG = {
  /** Theory questions asked in the diagnostic. */
  theoryQuestionCount: 4,
  /** Application scenarios asked in the diagnostic (the rest are held back). */
  diagnosticApplicationCount: 3,
  /** Targeted exercises produced after the gap is detected. */
  bridgeExerciseCount: 3,
  /** Unseen scenarios used to re-measure application ability. */
  reassessmentQuestionCount: 2,
} as const;

/**
 * Application score = weighted sum of the three rubric dimensions.
 * Concept recognition 40% · Reasoning 40% · Context application 20%.
 */
export const SCORE_WEIGHTS = {
  conceptRecognition: 0.4,
  reasoning: 0.4,
  contextApplication: 0.2,
} as const;

/**
 * Gap bands, in score points.
 *   gap <= lowMax                -> low
 *   lowMax < gap <= mediumMax    -> medium
 *   gap > mediumMax              -> high
 */
export const GAP_THRESHOLDS = {
  lowMax: 9,
  mediumMax: 24,
} as const;

export const GAP_COPY: Record<
  GapLevel,
  { headline: string; detail: string; label: string }
> = {
  low: {
    label: "Low",
    headline: "Understanding and application are aligned",
    detail:
      "Your reasoning holds up in unfamiliar scenarios too. Keep stretching with harder cases.",
  },
  medium: {
    label: "Medium",
    headline: "Application gap detected",
    detail:
      "You understand the concept, but your reasoning thins out once the scenario changes.",
  },
  high: {
    label: "High",
    headline: "High application gap",
    detail:
      "You understand the concept, but applying it to unfamiliar situations is still challenging.",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, value));

export const round = (value: number): number => Math.round(value);

export const formatScore = (value: number | null | undefined): string =>
  value === null || value === undefined ? "—" : `${round(value)}%`;

/** Composite score from an evaluation breakdown, using SCORE_WEIGHTS. */
export function weightedScore(breakdown: {
  conceptRecognition: number;
  reasoning: number;
  contextApplication: number;
}): number {
  return clamp(
    round(
      breakdown.conceptRecognition * SCORE_WEIGHTS.conceptRecognition +
        breakdown.reasoning * SCORE_WEIGHTS.reasoning +
        breakdown.contextApplication * SCORE_WEIGHTS.contextApplication,
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

/** Share of theory questions answered correctly, as a 0..100 score. */
export function scoreTheory(
  questions: TheoryQuestion[],
  answers: Record<string, AnswerInput>,
): number {
  if (questions.length === 0) return 0;
  const correct = questions.filter((question) => {
    const answer = answers[question.id];
    if (!answer?.optionId) return false;
    return question.options.find((option) => option.id === answer.optionId)?.correct === true;
  }).length;
  return round((correct / questions.length) * 100);
}

/** Mean of the per-answer application scores, as a 0..100 score. */
export function scoreApplication(
  questionIds: string[],
  evaluations: Record<string, AnswerEvaluation>,
): number {
  const scores = questionIds
    .map((id) => evaluations[id]?.score)
    .filter((score): score is number => typeof score === "number");
  if (scores.length === 0) return 0;
  return round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

/* -------------------------------------------------------------------------- */
/* Gap detection                                                              */
/* -------------------------------------------------------------------------- */

export function gapLevelFor(gap: number): GapLevel {
  if (gap > GAP_THRESHOLDS.mediumMax) return "high";
  if (gap > GAP_THRESHOLDS.lowMax) return "medium";
  return "low";
}

/** Build the full gap diagnosis the results screen renders. */
export function analyzeGap(
  theoryScore: number,
  applicationScore: number,
): GapAnalysis {
  const gap = round(theoryScore) - round(applicationScore);
  const level = gapLevelFor(gap);
  const copy = GAP_COPY[level];
  return {
    theoryScore: round(theoryScore),
    applicationScore: round(applicationScore),
    gap,
    level,
    headline: copy.headline,
    detail: copy.detail,
  };
}

/* -------------------------------------------------------------------------- */
/* Content selection                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Diagnostic scenarios are the head of the application list; reassessment uses
 * the tail, so the learner is always measured on scenarios they have not seen.
 */
export function splitApplicationQuestions(questions: ApplicationQuestion[]): {
  diagnostic: ApplicationQuestion[];
  reassessment: ApplicationQuestion[];
} {
  const cut = Math.min(
    ASSESSMENT_CONFIG.diagnosticApplicationCount,
    Math.max(0, questions.length - ASSESSMENT_CONFIG.reassessmentQuestionCount),
  );
  return {
    diagnostic: questions.slice(0, cut),
    reassessment: questions.slice(cut, cut + ASSESSMENT_CONFIG.reassessmentQuestionCount),
  };
}

export function pickTheoryQuestions(
  questions: TheoryQuestion[],
  count: number = ASSESSMENT_CONFIG.theoryQuestionCount,
): TheoryQuestion[] {
  return questions.slice(0, count);
}
