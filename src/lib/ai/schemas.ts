/**
 * Zod schemas for every AI response.
 *
 * The model never returns free-form text into the UI: it returns a shape that
 * is validated here first. If validation fails the caller falls back to the
 * local rubric instead of rendering something broken.
 *
 * Note that the model does NOT return the final score. It returns the three
 * rubric dimensions, and the app applies `SCORE_WEIGHTS` itself — so the
 * weighting stays visible in the codebase instead of hidden in a prompt.
 */

import { z } from "zod";

const score = z.coerce.number().min(0).max(100);

export const evaluationResponseSchema = z.object({
  conceptRecognition: score,
  reasoning: score,
  contextApplication: score,
  strengths: z.array(z.string().min(3).max(220)).max(3).default([]),
  weaknesses: z.array(z.string().min(3).max(220)).max(3).default([]),
  feedback: z.string().min(10).max(420),
});

export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;

export const generatedExerciseSchema = z.object({
  skill: z.string().min(3).max(60),
  difficulty: z.enum(["foundation", "standard", "stretch"]),
  scenario: z.string().min(80).max(900),
  decisionPrompt: z.string().min(10).max(240),
  options: z
    .array(
      z.object({
        label: z.string().min(5).max(240),
        credit: z.coerce.number().min(0).max(1),
      }),
    )
    .min(3)
    .max(4),
  reasoningPrompt: z.string().min(10).max(240),
  rubric: z.object({
    concepts: z.array(z.string().min(3).max(90)).min(2).max(6),
    reasoningSignals: z.array(z.string().min(2).max(60)).min(2).max(6),
    mustMention: z.string().min(10).max(240),
  }),
  hint: z.string().min(10).max(240),
});

export const generatedExerciseBatchSchema = z.object({
  exercises: z.array(generatedExerciseSchema).min(1).max(4),
});

export type GeneratedExercise = z.infer<typeof generatedExerciseSchema>;
