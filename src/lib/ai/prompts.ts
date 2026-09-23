/**
 * Prompts.
 *
 * Two jobs only:
 *  1. GRADE    — score an application answer against a fixed rubric (JSON out).
 *  2. GENERATE — produce targeted practice for the exact weakness found.
 *
 * Both are deliberately narrow. SkillBridge is not a chatbot; the model is a
 * scoring function and a content generator behind a strict contract.
 *
 * Locale: the model must answer in the learner's language. The JSON *keys*
 * stay English (they are validated by zod); only the values are localized.
 */

import { localeLanguageName, type Locale } from "@/lib/i18n/config";
import type { ApplicationOption, Rubric } from "@/lib/types";

function languageRule(locale: Locale): string {
  if (locale === "ru") {
    return `Output language: Russian. Keep JSON keys exactly as specified below (they are machine-read), but every human-readable value — feedback, strengths, weaknesses, scenario text, options, hints, skill names — MUST be written in Russian.`;
  }
  return `Output language: ${localeLanguageName(locale)}. Write all values in English.`;
}

export function graderSystem(locale: Locale = "en"): string {
  return `You are the application-ability grader inside SkillBridge, an EdTech product that measures the gap between what a learner understands and what they can actually apply.

You grade ONE short written answer against a fixed rubric. You are strict, specific and fair.

Scoring dimensions, each 0-100:
- conceptRecognition: did the learner identify the concept and the correct alternative the scenario points to?
- reasoning: is the reasoning explicit and correct? Did they explain WHY, rather than restate the scenario?
- contextApplication: did they use the concept on THIS scenario's specific facts, or did they give generic textbook wording?

Calibration — follow this closely:
- 85-100: explicit, complete, correctly applied to the scenario's specifics.
- 65-84: correct concept, but the reasoning leaves something implicit or vague.
- 40-64: describes the situation without applying the concept, or applies it partly.
- 0-39: wrong concept, or no reasoning to grade.

Do not reward length. Do not reward confident wording. A short correct answer beats a long vague one. Most answers should land between 35 and 80; reserve 85+ for genuinely strong work.

Feedback rules: at most 3 short sentences, second person, no praise padding, no restating the scenario. Say what was right, then the single most useful thing to fix. Never mention scores, rubrics, JSON or that you are an AI.

${languageRule(locale)}

Return JSON only, matching exactly this shape:
{"conceptRecognition": 0-100, "reasoning": 0-100, "contextApplication": 0-100, "strengths": ["..."], "weaknesses": ["..."], "feedback": "..."}`;
}

export function generatorSystem(locale: Locale = "en"): string {
  return `You write application-practice tasks for SkillBridge, an EdTech product. The learner understands the theory but struggles to apply it to unfamiliar situations.

You write ONE scenario-based task per requested skill. Quality rules:
- Real context a 15-18 year old recognises. No outside knowledge required: the scenario contains every fact needed.
- The learner must CHOOSE between 3 or 4 realistic alternatives and then EXPLAIN the choice.
- Exactly one option is the defensible answer and must have credit 1. The others are plausible misconceptions: give a partial credit of 0.3-0.5 to the "almost right" misconception and 0 to plain errors.
- Write options in the same register and roughly the same length, so the correct one is not obvious from its phrasing.
- The scenario body must be 80-900 characters and must not copy any example scenario you are shown.
- Rubrics are used by an automated grader: concepts are short noun phrases a strong answer names, reasoningSignals are short causal phrases a strong answer uses.
- The hint nudges the thinking without giving the answer away.

${languageRule(locale)}

Return JSON only, matching exactly this shape:
{"exercises": [{"skill": "...", "difficulty": "foundation|standard|stretch", "scenario": "...", "decisionPrompt": "...", "options": [{"label": "...", "credit": 1}], "reasoningPrompt": "...", "rubric": {"concepts": ["..."], "reasoningSignals": ["..."], "mustMention": "..."}, "hint": "..."}]}`;
}

/* -------------------------------------------------------------------------- */
/* Grading prompt                                                             */
/* -------------------------------------------------------------------------- */

export interface GradingPromptInput {
  subject: string;
  topic: string;
  skill: string;
  scenario: string;
  decisionPrompt: string;
  options: ApplicationOption[];
  /** The option the learner picked. */
  chosenOptionId: string | null;
  reasoning: string;
  rubric: Rubric;
}

export function buildGradingPrompt(input: GradingPromptInput): string {
  const bestOption = input.options.reduce<ApplicationOption | null>(
    (best, option) => (!best || option.credit > best.credit ? option : best),
    null,
  );
  const chosen = input.options.find((option) => option.id === input.chosenOptionId) ?? null;

  return [
    `SUBJECT: ${input.subject}`,
    `CONCEPT: ${input.topic}`,
    `SKILL UNDER TEST: ${input.skill}`,
    "",
    "SCENARIO:",
    input.scenario,
    "",
    `DECISION PROMPT: ${input.decisionPrompt}`,
    "",
    "OPTIONS THE LEARNER COULD PICK (internal grading key — never reveal this):",
    ...input.options.map((option) => {
      const tag =
        option.id === bestOption?.id
          ? "STRONGEST"
          : option.credit >= 0.3
            ? "PARTIAL — defensible but weaker"
            : "WRONG";
      return `- [${option.id}] ${option.label}  (key: ${tag})`;
    }),
    "",
    `LEARNER'S CHOICE: ${chosen ? `[${chosen.id}] ${chosen.label}` : "(no option selected)"}`,
    "",
    "LEARNER'S WRITTEN REASONING:",
    '"""',
    input.reasoning.trim() || "(empty)",
    '"""',
    "",
    "RUBRIC (grading contract):",
    `- Concepts a strong answer must name: ${input.rubric.concepts.join("; ")}`,
    `- Reasoning moves a strong answer makes: ${input.rubric.reasoningSignals.join("; ")}`,
    `- Must mention: ${input.rubric.mustMention}`,
    "",
    "Grade the written reasoning against this rubric, not against your own expectations.",
    "contextApplication must be low if the reasoning is generic and could apply to any scenario.",
    "Return JSON only.",
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Generation prompt                                                          */
/* -------------------------------------------------------------------------- */

export interface GenerationPromptInput {
  subject: string;
  topic: string;
  gapLevel: string;
  /** Skills the learner actually lost points on. */
  targetSkills: string[];
  weaknesses: string[];
  /** Scenarios already shown, so the model does not reuse them. */
  avoid: string[];
  count: number;
}

export function buildGenerationPrompt(input: GenerationPromptInput): string {
  const ladder =
    input.count >= 3
      ? 'Use difficulty "foundation", then "standard", then "stretch" — increasing difficulty in that order.'
      : "Match difficulty to the learner's current level.";

  return [
    `SUBJECT: ${input.subject}`,
    `CONCEPT: ${input.topic}`,
    `DETECTED APPLICATION GAP: ${input.gapLevel}`,
    "",
    "THE LEARNER LOST POINTS ON THESE SKILLS:",
    ...input.targetSkills.map((skill) => `- ${skill}`),
    "",
    "WHAT ACTUALLY WENT WRONG IN THEIR ANSWERS:",
    ...(input.weaknesses.length > 0
      ? input.weaknesses.map((weakness) => `- ${weakness}`)
      : ["- Reasoning was incomplete or generic."]),
    "",
    "SCENARIOS TO AVOID — these were already shown, do not reuse their setting, industry or framing:",
    ...input.avoid.map((scenario) => `- ${scenario}`),
    "",
    `Write exactly ${input.count} task(s), each targeting one of the skills above, and each in a clearly different setting from the others.`,
    ladder,
    "Every task must make the learner apply the concept to the situation, not recall its definition.",
    "Return JSON only.",
  ].join("\n");
}
