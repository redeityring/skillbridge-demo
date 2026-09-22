/**
 * Deterministic fallback evaluator.
 *
 * This is NOT fake AI output. It is a transparent rubric that scores the
 * learner's *actual* answer, and the UI always labels which engine produced a
 * score. It exists so the product keeps working — with real scoring — when the
 * AI provider is unreachable, rate-limited, slow, or deliberately bypassed
 * (demo mode).
 *
 * It scores on exactly the same three dimensions as the AI grader, so the two
 * engines produce comparable numbers and progress stays meaningful if the app
 * switches engines mid-session.
 */

import { clamp, round, weightedScore } from "@/lib/scoring";
import type {
  AnswerEvaluation,
  AnswerInput,
  ApplicationOption,
  Rubric,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Text analysis                                                              */
/* -------------------------------------------------------------------------- */

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "so", "because", "of",
  "to", "in", "on", "at", "for", "with", "is", "are", "was", "were", "be",
  "been", "its", "it", "this", "that", "these", "those", "i", "you", "we",
  "they", "he", "she", "them", "his", "her", "their", "my", "me", "as", "by",
  "from", "not", "no", "do", "does", "did", "will", "would", "can", "could",
  "should", "may", "might", "must", "have", "has", "had", "there", "here",
  "when", "which", "who", "what", "how", "than", "too", "very", "just", "also",
  "about", "into", "more", "most", "some", "any", "all", "one", "two", "up",
  "out", "off", "over", "under", "again", "own", "same", "such", "only",
  "other", "others", "each", "both", "few", "many", "much", "real", "really",
]);

/**
 * Causal and comparative language. Presence of one of these means the answer
 * is explaining rather than describing.
 */
const REASONING_MARKERS = [
  "because", "since", "therefore", "thus", "hence", "so", "so that",
  "which means", "this means", "that means", "as a result", "instead of",
  "rather than", "compared to", "in exchange", "at the cost of", "due to",
  "leads to", "gives up", "give up", "given up", "sacrifice", "sacrificed",
  "forgo", "forgone", "next best", "alternative", "trade-off", "tradeoff",
];

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (text: string): string[] => normalize(text).split(" ").filter(Boolean);

/** Significant words of a phrase: stop words and one-letter tokens removed. */
const significantWords = (phrase: string): string[] =>
  normalize(phrase)
    .split(" ")
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));

/**
 * Two words count as the same when they share a 4+ character prefix, so
 * "sacrificed"/"sacrifices", "cost"/"costs" and "value"/"valuable" all match
 * without shipping a stemmer.
 */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const prefixLength = Math.min(5, a.length, b.length);
  if (prefixLength < 4) return false;
  return a.slice(0, prefixLength) === b.slice(0, prefixLength);
}

/**
 * How much of `phrase` is present in `text`, as a 0..1 fraction.
 * Whole-phrase substring match short-circuits to 1.
 */
function phraseMatch(text: string, textWords: string[], phrase: string): number {
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return 0;
  if (text.includes(normalizedPhrase)) return 1;

  const targets = significantWords(phrase);
  if (targets.length === 0) return 0;

  const matched = targets.filter((target) =>
    textWords.some((candidate) => wordsMatch(candidate, target)),
  ).length;
  return matched / targets.length;
}

/** A concept counts as "named" once most of its words appear. */
const NAMED_THRESHOLD = 0.6;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

/** Answers under this length cannot show reasoning, whatever they contain. */
const MIN_REASONING_WORDS = 8;

/* -------------------------------------------------------------------------- */
/* Evaluation                                                                 */
/* -------------------------------------------------------------------------- */

export interface RubricEvaluationInput {
  optionId: string | null;
  options: ApplicationOption[];
  reasoning: string;
  rubric: Rubric;
}

export function evaluateWithRubric(input: RubricEvaluationInput): AnswerEvaluation {
  const { optionId, options, reasoning, rubric } = input;

  const text = normalize(reasoning ?? "");
  const textWords = words(reasoning ?? "");
  const wordCount = textWords.length;

  /* 1. Concept recognition — driven by the option the learner chose. */
  const chosen = options.find((option) => option.id === optionId) ?? null;
  const bestCredit = options.reduce((max, option) => Math.max(max, option.credit), 0);
  const relativeCredit = bestCredit > 0 ? (chosen?.credit ?? 0) / bestCredit : 0;
  const conceptRecognition = clamp(round(relativeCredit * 100));

  /* 2. Reasoning — rubric coverage, causal language, and enough depth. */
  const depth = clamp(wordCount / 30, 0, 1);
  const conceptMatches = rubric.concepts.map((concept) => phraseMatch(text, textWords, concept));
  const namedConcepts = rubric.concepts.filter(
    (_, index) => (conceptMatches[index] ?? 0) >= NAMED_THRESHOLD,
  );
  const signalMatches = rubric.reasoningSignals.map((signal) =>
    phraseMatch(text, textWords, signal),
  );
  const hasCausalLanguage = REASONING_MARKERS.some(
    (marker) => phraseMatch(text, textWords, marker) >= 1,
  );
  const tooShort = wordCount < MIN_REASONING_WORDS;

  const reasoningScore = clamp(
    round(
      100 *
        (0.42 * mean(conceptMatches) * depth +
          0.28 * mean(signalMatches) +
          0.18 * (hasCausalLanguage ? 1 : 0) +
          0.12 * depth),
    ),
  );

  /* 3. Context application — is the concept used on THIS scenario? */
  const appliesToScenario = namedConcepts.length > 0 && hasCausalLanguage;
  const namesTheTradeOff =
    relativeCredit >= 0.99 &&
    rubric.concepts.some(
      (concept, index) =>
        (conceptMatches[index] ?? 0) >= NAMED_THRESHOLD &&
        /given up|forgone|forgo|sacrific|next best|alternative/i.test(concept),
    );

  const contextApplication = clamp(
    round(
      relativeCredit * 55 +
        (appliesToScenario ? 25 : 0) +
        (namesTheTradeOff ? 20 : 0) -
        (tooShort ? 12 : 0),
    ),
  );

  const breakdown = { conceptRecognition, reasoning: reasoningScore, contextApplication };

  return {
    score: weightedScore(breakdown),
    breakdown,
    strengths: buildStrengths({
      relativeCredit,
      namedConcepts,
      hasCausalLanguage,
      wordCount,
    }),
    weaknesses: buildWeaknesses({
      relativeCredit,
      namedConcepts,
      conceptTotal: rubric.concepts.length,
      signalCoverage: mean(signalMatches),
      hasCausalLanguage,
      wordCount,
      mustMention: rubric.mustMention,
    }),
    feedback: buildFeedback({
      score: weightedScore(breakdown),
      relativeCredit,
      namedConcepts,
      hasCausalLanguage,
      wordCount,
      mustMention: rubric.mustMention,
    }),
    engine: "rubric",
    notice: "Scored by the local rubric engine — no AI grader was used for this answer.",
  };
}

/* -------------------------------------------------------------------------- */
/* Feedback construction                                                      */
/* -------------------------------------------------------------------------- */

function buildStrengths(input: {
  relativeCredit: number;
  namedConcepts: string[];
  hasCausalLanguage: boolean;
  wordCount: number;
}): string[] {
  const strengths: string[] = [];
  if (input.relativeCredit >= 0.99) {
    strengths.push("You identified the alternative the concept actually points to.");
  } else if (input.relativeCredit >= 0.4) {
    strengths.push("Your choice is defensible, even though a stronger option existed.");
  }
  if (input.namedConcepts.length > 0) {
    strengths.push(`You named the key idea: ${input.namedConcepts[0]}.`);
  }
  if (input.hasCausalLanguage) {
    strengths.push("You explained cause and effect instead of only stating a conclusion.");
  }
  if (input.wordCount >= 30) {
    strengths.push("You developed the answer far enough for the reasoning to be checkable.");
  }
  return strengths.slice(0, 3);
}

function buildWeaknesses(input: {
  relativeCredit: number;
  namedConcepts: string[];
  conceptTotal: number;
  signalCoverage: number;
  hasCausalLanguage: boolean;
  wordCount: number;
  mustMention: string;
}): string[] {
  const weaknesses: string[] = [];
  if (input.wordCount < 15) {
    weaknesses.push("The reasoning is too short to show how the concept was applied.");
  }
  if (input.namedConcepts.length === 0) {
    // `mustMention` is authored as a statement for the grading contract, so it
    // is quoted after a colon rather than glued into a sentence.
    weaknesses.push(`A complete answer has to establish this: ${input.mustMention}.`);
  }
  if (!input.hasCausalLanguage) {
    weaknesses.push("The trade-off is implied but never explained in words.");
  }
  if (input.signalCoverage < NAMED_THRESHOLD && input.conceptTotal > 1) {
    weaknesses.push("The answer describes the situation without evaluating the alternatives.");
  }
  if (input.relativeCredit > 0 && input.relativeCredit < 0.99) {
    weaknesses.push("A stronger alternative was available for this scenario.");
  }
  return weaknesses.slice(0, 3);
}

function buildFeedback(input: {
  score: number;
  relativeCredit: number;
  namedConcepts: string[];
  hasCausalLanguage: boolean;
  wordCount: number;
  mustMention: string;
}): string {
  if (input.score >= 85) {
    return `Strong application. You applied the concept to this scenario rather than restating it, and your reasoning established what mattered: ${input.mustMention}.`;
  }
  if (input.score >= 65) {
    return `Solid reasoning. To push it higher, make this explicit in a sentence of its own: ${input.mustMention}.`;
  }
  if (input.wordCount < 15) {
    return "The choice is there, but the reasoning is not. Write two sentences: what was given up, and why that matters in this situation.";
  }
  if (input.relativeCredit < 0.5) {
    return 'Re-read the scenario and ask "what was given up when this decision was made?" — then apply the concept to that specific alternative.';
  }
  return `You are describing the situation instead of applying the concept to it. A strong answer establishes this: ${input.mustMention}.`;
}

/* -------------------------------------------------------------------------- */

/** Convenience wrapper for the app's answer shape. */
export function evaluateAnswer(
  options: ApplicationOption[],
  rubric: Rubric,
  answer: AnswerInput,
): AnswerEvaluation {
  return evaluateWithRubric({
    optionId: answer.optionId,
    options,
    reasoning: answer.reasoning,
    rubric,
  });
}
