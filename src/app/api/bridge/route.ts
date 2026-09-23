import { NextResponse } from "next/server";
import { z } from "zod";

import { getTopic } from "@/content";
import { generateBridgeWithAi } from "@/lib/ai/tasks";
import { pickBankExercises, stampExercises, type BridgePlan } from "@/lib/bridge";
import { ASSESSMENT_CONFIG } from "@/lib/scoring";
import type { BridgeExercise, GapLevel, TopicId } from "@/lib/types";

/**
 * Generates targeted practice for a detected gap.
 *
 * The plan (which skills to train, what went wrong, what to avoid repeating)
 * comes from the client, because only the client holds the learner's
 * evaluations. The exercise bank and the AI call are server-side, resolved in
 * the learner's language.
 */

const requestSchema = z.object({
  topicId: z.enum(["opportunity-cost", "supply-and-demand", "inflation"]),
  runId: z.string().min(1).max(40),
  gapLevel: z.enum(["low", "medium", "high"]),
  targetSkills: z.array(z.string().min(1).max(120)).min(1).max(6),
  weaknesses: z.array(z.string().min(1).max(300)).max(6).default([]),
  avoid: z.array(z.string().min(1).max(300)).max(6).default([]),
  count: z.coerce.number().int().min(1).max(4).optional(),
  locale: z.enum(["en", "ru"]).default("en"),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const topicId = payload.topicId as TopicId;
  const topic = getTopic(topicId, payload.locale);
  const count = payload.count ?? ASSESSMENT_CONFIG.bridgeExerciseCount;

  const plan: BridgePlan = {
    targetSkills: payload.targetSkills,
    weaknesses: payload.weaknesses,
    avoid: payload.avoid,
  };

  const generated = await generateBridgeWithAi({
    subject: topic.subjectLabel,
    topicId,
    topicTitle: topic.title,
    gapLevel: payload.gapLevel as GapLevel,
    targetSkills: plan.targetSkills,
    weaknesses: plan.weaknesses,
    avoid: plan.avoid,
    count,
    locale: payload.locale,
  });

  if (generated.ok && generated.exercises.length > 0) {
    const exercises = stampExercises(generated.exercises.slice(0, count), payload.runId, "ai");
    return NextResponse.json({ exercises, source: "ai", notice: null });
  }

  // Fallback: the curated bank, selected for the same weak skills.
  const exercises = stampExercises(pickBankExercises(topic, plan, count), payload.runId, "bank");

  return NextResponse.json({
    exercises,
    source: "bank",
    notice: generated.ok
      ? null
      : `${generated.error} ${payload.locale === "ru"
          ? "Используем курируемый банк практики SkillBridge."
          : "Using SkillBridge's curated practice bank instead."}`,
  });
}

export async function GET() {
  // Small discoverability endpoint: how many bank tasks exist per topic.
  const topics = ["opportunity-cost", "supply-and-demand", "inflation"] as const;
  return NextResponse.json({
    bank: topics.map((id) => ({
      topicId: id,
      exercises: getTopic(id, "en").bridgeBank.length,
    })),
  });
}

export type BridgeResponse = {
  exercises: BridgeExercise[];
  source: "ai" | "bank";
  notice: string | null;
};
