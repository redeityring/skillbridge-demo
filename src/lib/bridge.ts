/**
 * From "where did the learner lose points?" to "what should they practise?"
 *
 * The plan is built from the actual evaluations of the diagnostic — the bridge
 * is never generic. If AI generation is unavailable, the same plan selects
 * matching tasks from the curated bank in the topic content, so the bridge
 * still targets the real weakness.
 */

import { round } from "@/lib/scoring";
import type {
  AnswerEvaluation,
  BridgeExercise,
  GapLevel,
  Topic,
} from "@/lib/types";

export interface SkillLoss {
  skill: string;
  /** Mean score achieved on this skill across the diagnostic, 0..100. */
  score: number;
  /** 100 - score. Used to rank what to practise first. */
  losses: number;
  questionIds: string[];
}

export interface BridgePlan {
  targetSkills: string[];
  weaknesses: string[];
  avoid: string[];
}

const DIFFICULTY_ORDER: Record<BridgeExercise["difficulty"], number> = {
  foundation: 0,
  standard: 1,
  stretch: 2,
};

/** Rank the diagnostic micro-skills by how many points were lost on them. */
export function analyseSkillLosses(
  questions: { id: string; skill: string }[],
  evaluations: Record<string, AnswerEvaluation>,
): SkillLoss[] {
  const grouped = new Map<string, { scores: number[]; questionIds: string[] }>();

  for (const question of questions) {
    const evaluation = evaluations[question.id];
    if (!evaluation) continue;
    const entry = grouped.get(question.skill) ?? { scores: [], questionIds: [] };
    entry.scores.push(evaluation.score);
    entry.questionIds.push(question.id);
    grouped.set(question.skill, entry);
  }

  return [...grouped.entries()]
    .map(([skill, entry]) => {
      const score = round(
        entry.scores.reduce((total, value) => total + value, 0) / entry.scores.length,
      );
      return { skill, score, losses: 100 - score, questionIds: entry.questionIds };
    })
    .sort((a, b) => b.losses - a.losses);
}

/**
 * Build the practice plan:
 *  - `targetSkills`  the micro-skills to train, weakest first,
 *  - `weaknesses`    the grader's own notes, for the generation prompt,
 *  - `avoid`         scenarios already seen, so practice is never a repeat.
 */
export function buildBridgePlan(
  topic: Topic,
  diagnosticQuestions: { id: string; skill: string; scenario: string }[],
  evaluations: Record<string, AnswerEvaluation>,
  count: number,
): BridgePlan {
  const losses = analyseSkillLosses(diagnosticQuestions, evaluations);

  const targetSkills = (losses.length > 0
    ? losses.map((entry) => entry.skill)
    : diagnosticQuestions.map((question) => question.skill)
  ).slice(0, count);

  // Fall back to the bank's own skills if the topic has fewer distinct skills.
  for (const exercise of topic.bridgeBank) {
    if (targetSkills.length >= count) break;
    if (!targetSkills.includes(exercise.skill)) targetSkills.push(exercise.skill);
  }

  const weaknesses = losses
    .flatMap((entry) => evaluations[entry.questionIds[0]]?.weaknesses ?? [])
    .filter((weakness, index, list) => list.indexOf(weakness) === index)
    .slice(0, 5);

  const avoid = diagnosticQuestions
    .map((question) => question.scenario.replace(/\s+/g, " ").slice(0, 140))
    .slice(0, 4);

  return { targetSkills, weaknesses, avoid };
}

/**
 * Deterministic fallback: pick the bank tasks whose skill matches the learner's
 * weakest skills, then order them from foundation to stretch.
 */
export function pickBankExercises(
  topic: Topic,
  plan: BridgePlan,
  count: number,
): BridgeExercise[] {
  const rank = (exercise: BridgeExercise): number => {
    const index = plan.targetSkills.indexOf(exercise.skill);
    return index === -1 ? plan.targetSkills.length + 1 : index;
  };

  const ordered = [...topic.bridgeBank].sort((a, b) => {
    const bySkill = rank(a) - rank(b);
    if (bySkill !== 0) return bySkill;
    return DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
  });

  const picked = ordered.slice(0, count);
  // Keep the ladder ascending so the learner warms up before the stretch task.
  picked.sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
  return picked;
}

/** Copy bank tasks with run-scoped ids so attempts stay traceable per run. */
export function stampExercises(
  exercises: BridgeExercise[],
  runId: string,
  source: "bank" | "ai",
): BridgeExercise[] {
  return exercises.map((exercise, index) => ({
    ...exercise,
    id: `${source}-${runId}-${index}-${exercise.id.replace(/^ai-\d+[a-z0-9]*-/, "")}`,
  }));
}

export function gapLevelNarrative(level: GapLevel): string {
  switch (level) {
    case "high":
      return "large and specific";
    case "medium":
      return "present but narrow";
    default:
      return "small";
  }
}
