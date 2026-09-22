import { NextResponse } from "next/server";
import { z } from "zod";

import { gradeWithAi } from "@/lib/ai/tasks";
import { getTopic } from "@/content/economics";
import { evaluateAnswer } from "@/lib/rubric";
import type { ApplicationOption, Rubric, TopicId } from "@/lib/types";

/**
 * Grades one written answer.
 *
 * Two guarantees:
 *  1. It always returns a usable evaluation — AI failure degrades to the local
 *     rubric rather than an error page.
 *  2. The rubric it grades against is authoritative. For content questions it
 *     is read from the server-side content bank, not trusted from the request.
 */

const optionSchema = z.object({
  id: z.string().min(1).max(8),
  label: z.string().min(1).max(300),
  credit: z.coerce.number().min(0).max(1),
});

const rubricSchema = z.object({
  concepts: z.array(z.string().min(1).max(120)).min(1).max(8),
  reasoningSignals: z.array(z.string().min(1).max(80)).min(1).max(8),
  mustMention: z.string().min(1).max(300),
});

const generatedTaskSchema = z.object({
  skill: z.string().min(1).max(80),
  scenario: z.string().min(20).max(1200),
  decisionPrompt: z.string().min(5).max(300),
  options: z.array(optionSchema).min(2).max(5),
  rubric: rubricSchema,
});

const requestSchema = z.object({
  /** "content" resolves the task from the server content bank by id. */
  source: z.enum(["content", "generated"]),
  topicId: z.enum(["opportunity-cost", "supply-and-demand", "inflation"]),
  questionId: z.string().min(1).max(120).optional(),
  task: generatedTaskSchema.optional(),
  answer: z.object({
    optionId: z.string().max(8).nullable(),
    reasoning: z.string().max(4000).default(""),
  }),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Malformed request. The answer could not be graded." },
      { status: 400 },
    );
  }

  const resolved = resolveTask(payload);
  if (!resolved) {
    return NextResponse.json({ error: "Unknown question." }, { status: 404 });
  }

  const { skill, scenario, decisionPrompt, options, rubric, title } = resolved;

  const outcome = await gradeWithAi({
    subject: "Economics",
    topicTitle: title,
    topicId: payload.topicId as TopicId,
    skill,
    scenario,
    decisionPrompt,
    options,
    rubric,
    answer: payload.answer,
  });

  if (outcome.ok) {
    return NextResponse.json({ evaluation: outcome.evaluation, engine: "ai" });
  }

  // Graceful degradation: the learner's real answer, really scored, plainly
  // labelled. The provider error is never surfaced as a failure page.
  const fallback = evaluateAnswer(options, rubric, payload.answer);
  return NextResponse.json({
    evaluation: {
      ...fallback,
      notice: `${outcome.error} This answer was scored by the local rubric engine.`,
    },
    engine: "rubric",
  });
}

function resolveTask(payload: z.infer<typeof requestSchema>):
  | {
      skill: string;
      title: string;
      scenario: string;
      decisionPrompt: string;
      options: ApplicationOption[];
      rubric: Rubric;
    }
  | null {
  if (payload.source === "generated") {
    if (!payload.task) return null;
    const options: ApplicationOption[] = payload.task.options.map((option, index) => ({
      id: option.id || String.fromCharCode(97 + index),
      label: option.label,
      credit: option.credit,
    }));
    return {
      skill: payload.task.skill,
      title: payload.task.skill,
      scenario: payload.task.scenario,
      decisionPrompt: payload.task.decisionPrompt,
      options,
      rubric: payload.task.rubric,
    };
  }

  if (!payload.questionId) return null;
  const topic = getTopic(payload.topicId as TopicId);
  const question = topic.applicationQuestions.find((item) => item.id === payload.questionId);
  if (!question) return null;

  return {
    skill: question.skill,
    title: topic.title,
    scenario: question.scenario,
    decisionPrompt: question.decisionPrompt,
    options: question.options,
    rubric: question.rubric,
  };
}
