/**
 * Deterministic fallback evaluator.
 *
 * This is NOT fake AI output. It is a transparent rubric that scores the
 * learner's *actual* answer, and the UI always labels which engine produced a
 * score. It exists so the product keeps working — with real scoring — when the
 * AI provider is unreachable, rate-limited or slow.
 *
 * It scores on exactly the same three dimensions as the AI grader, so the two
 * engines produce comparable numbers and progress stays meaningful if the app
 * switches engines mid-session.
 *
 * Locale-aware: Russian answers are scored against Russian rubrics with
 * Cyrillic-preserving normalization, Russian stop words and Russian causal
 * markers. Feedback templates come from the i18n dictionaries, so the engine
 * never mixes languages in one evaluation.
 */

import { getRubricDictionary } from "@/lib/i18n/rubric-locale";
import { clamp, round, weightedScore } from "@/lib/scoring";
import type {
  AnswerEvaluation,
  AnswerInput,
  ApplicationOption,
  Rubric,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Locale-specific analysis tables                                            */
/* -------------------------------------------------------------------------- */

const EN_STOP_WORDS = new Set([
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

const RU_STOP_WORDS = new Set([
  "и", "а", "но", "да", "или", "либо", "то", "же", "ли", "бы", "б", "если", "бы",
  "когда", "чтобы", "потому", "что", "чтобы", "как", "так", "также", "тоже",
  "в", "во", "не", "ни", "нет", "ну", "вот", "ведь", "впрочем", "причём",
  "на", "по", "до", "из", "от", "за", "под", "над", "о", "об", "обо", "при",
  "про", "для", "без", "к", "ко", "у", "около", "это", "этот", "эта", "эти",
  "тот", "та", "те", "он", "она", "оно", "они", "его", "её", "их", "мне", "меня",
  "я", "ты", "мы", "вы", "он", "она", "мой", "моя", "твой", "твоя", "наш", "наш",
  "свой", "свою", "своё", "чем", "чём", "такой", "такая", "такое", "весь", "вся",
  "все", "всё", "быть", "был", "была", "было", "были", "есть", "будет", "будут",
  "могу", "может", "можем", "можно", "нужно", "надо", "должен", "должна",
  "очень", "более", "менее", "самый", "сама", "само", "ещё", "уж", "уже", "вот",
  "именно", "какой", "какая", "какое", "кто", "что", "где", "куда", "откуда",
  "сколько", "почему", "зачем", "там", "тут", "здесь", "сейчас", "тогда",
]);

/**
 * Causal and comparative language, English. Presence of one of these means the
 * answer is explaining rather than describing.
 */
const EN_REASONING_MARKERS = [
  "because", "since", "therefore", "thus", "hence", "so", "so that",
  "which means", "this means", "that means", "as a result", "instead of",
  "rather than", "compared to", "in exchange", "at the cost of", "due to",
  "leads to", "gives up", "give up", "given up", "sacrifice", "sacrificed",
  "forgo", "forgone", "next best", "alternative", "trade-off", "tradeoff",
];

/**
 * Causal and comparative language, Russian. Matched as substrings on
 * normalized text, so morphological variants ("отказываюсь", "отказался")
 * share a marker root.
 */
const RU_REASONING_MARKERS = [
  "потому что", "потому", "поэтому", "так как", "поскольку", "значит",
  "следовательно", "таким образом", "в результате", "вместо",
  "а не", "не как", "чем", "по сравнению", "в обмен", "ценой",
  "отказыва", "отказал", "отказ", "отказываюсь", "жертв", "жертвую",
  "упущен", "упуска", "лучший", "лучшая", "лучше", "альтернатив",
  "компромисс", "компромис", "теряет", "теряю", "потеря",
];

/* -------------------------------------------------------------------------- */
/* Text analysis                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Normalization that keeps BOTH scripts intact: lowercase, strip punctuation,
 * collapse whitespace. `[^\p{L}\p{N}\s'-]` with the `u` flag keeps letters of
 * any alphabet — the ASCII-only version silently deleted every Cyrillic word,
 * which would have made the whole evaluator blind to Russian answers.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words for prefix-matching; language-neutral (letters of any alphabet). */
function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

/** Stop-word filter picks the right list by script. */
function stopWordsFor(text: string): Set<string> {
  return /[\u0400-\u04FF]/.test(text) ? RU_STOP_WORDS : EN_STOP_WORDS;
}

/** Significant words of a phrase: stop words and one-letter tokens removed. */
function significantWords(phrase: string): string[] {
  const stop = stopWordsFor(phrase);
  return normalize(phrase)
    .split(" ")
    .filter((word) => word.length > 1 && !stop.has(word));
}

/**
 * Two words count as the same when they share a 4+ character prefix. Works for
 * both scripts: "sacrificed"/"sacrifices" and "альтернатив"/"альтернативу"
 * match without shipping a stemmer. (Cyrillic prefix of 4 chars is somewhat
 * coarser than English ones, which is fine — we score short rubric phrases.)
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
  /** Language of the rubric/answer; defaults to English. */
  locale?: "en" | "ru";
}

export function evaluateWithRubric(input: RubricEvaluationInput): AnswerEvaluation {
  const { optionId, options, reasoning, rubric } = input;
  const locale = input.locale ?? "en";
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
  const markers = locale === "ru" ? RU_REASONING_MARKERS : EN_REASONING_MARKERS;
  const hasCausalLanguage = markers.some(
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
        /given up|forgone|forgo|sacrific|next best|alternative|упущен|отказ|альтернатив|жертв/i.test(
          concept,
        ),
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
  const composite = weightedScore(breakdown);

  return {
    score: composite,
    breakdown,
    strengths: buildStrengths({ locale, relativeCredit, namedConcepts, hasCausalLanguage, wordCount }),
    weaknesses: buildWeaknesses({
      locale,
      relativeCredit,
      namedConcepts,
      conceptTotal: rubric.concepts.length,
      signalCoverage: mean(signalMatches),
      hasCausalLanguage,
      wordCount,
      mustMention: rubric.mustMention,
    }),
    feedback: buildFeedback({
      locale,
      score: composite,
      relativeCredit,
      namedConcepts,
      hasCausalLanguage,
      wordCount,
      mustMention: rubric.mustMention,
    }),
    engine: "rubric",
    notice: localeNotice(locale),
  };
}

/* -------------------------------------------------------------------------- */
/* Localized feedback construction                                            */
/* -------------------------------------------------------------------------- */

/**
 * The rubric engine is shared by server and client, so it cannot call
 * `useI18n()`. The dictionary is passed through this indirection instead —
 * the server route passes the locale explicitly; on the client the hook-less
 * accessor in `rubric-locale.ts` reads the same persisted locale.
 */
function dictionaries(locale: "en" | "ru") {
  return getRubricDictionary(locale);
}

function localeNotice(locale: "en" | "ru"): string {
  return dictionaries(locale).rubricNotice;
}

function buildStrengths(input: {
  locale: "en" | "ru";
  relativeCredit: number;
  namedConcepts: string[];
  hasCausalLanguage: boolean;
  wordCount: number;
}): string[] {
  const t = dictionaries(input.locale);
  const strengths: string[] = [];
  if (input.relativeCredit >= 0.99) {
    strengths.push(t.rubricStrongIdentified);
  } else if (input.relativeCredit >= 0.4) {
    strengths.push(t.rubricDefensible);
  }
  if (input.namedConcepts.length > 0) {
    strengths.push(t.rubricNamedKeyIdea(input.namedConcepts[0]));
  }
  if (input.hasCausalLanguage) {
    strengths.push(t.rubricCausal);
  }
  if (input.wordCount >= 30) {
    strengths.push(t.rubricDeveloped);
  }
  return strengths.slice(0, 3);
}

function buildWeaknesses(input: {
  locale: "en" | "ru";
  relativeCredit: number;
  namedConcepts: string[];
  conceptTotal: number;
  signalCoverage: number;
  hasCausalLanguage: boolean;
  wordCount: number;
  mustMention: string;
}): string[] {
  const t = dictionaries(input.locale);
  const weaknesses: string[] = [];
  if (input.wordCount < 15) {
    weaknesses.push(t.rubricTooShort);
  }
  if (input.namedConcepts.length === 0) {
    // `mustMention` is authored as a statement for the grading contract, so it
    // is quoted after a colon rather than glued into a sentence.
    weaknesses.push(t.rubricMustEstablish(input.mustMention));
  }
  if (!input.hasCausalLanguage) {
    weaknesses.push(t.rubricTradeOffImplied);
  }
  if (input.signalCoverage < NAMED_THRESHOLD && input.conceptTotal > 1) {
    weaknesses.push(t.rubricDescribesNotEvaluates);
  }
  if (input.relativeCredit > 0 && input.relativeCredit < 0.99) {
    weaknesses.push(t.rubricStrongerAlternative);
  }
  return weaknesses.slice(0, 3);
}

function buildFeedback(input: {
  locale: "en" | "ru";
  score: number;
  relativeCredit: number;
  namedConcepts: string[];
  hasCausalLanguage: boolean;
  wordCount: number;
  mustMention: string;
}): string {
  const t = dictionaries(input.locale);
  if (input.score >= 85) {
    return t.rubricFeedbackStrong(input.mustMention);
  }
  if (input.score >= 65) {
    return t.rubricFeedbackSolid(input.mustMention);
  }
  if (input.wordCount < 15) {
    return t.rubricFeedbackNoReasoning;
  }
  if (input.relativeCredit < 0.5) {
    return t.rubricFeedbackReread;
  }
  return t.rubricFeedbackDescribing(input.mustMention);
}

/* -------------------------------------------------------------------------- */

/** Convenience wrapper for the app's answer shape. */
export function evaluateAnswer(
  options: ApplicationOption[],
  rubric: Rubric,
  answer: AnswerInput,
  locale: "en" | "ru" = "en",
): AnswerEvaluation {
  return evaluateWithRubric({
    optionId: answer.optionId,
    options,
    reasoning: answer.reasoning,
    rubric,
    locale,
  });
}
