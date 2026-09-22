/**
 * Demo mode.
 *
 * WHAT THIS IS: a scripted set of *answers*, typed the way a real learner with
 * a real application gap would type them. It is a presentation fixture, so a
 * pitch does not depend on someone typing fast.
 *
 * WHAT THIS IS NOT: fake results. Demo mode still runs every answer through the
 * real scoring engine, the real gap analysis, the real bridge planner and the
 * real reassessment. Nothing here hardcodes a score — the 100 → ~24 → ~82 story
 * falls out of the answers below.
 *
 * Demo mode is explicitly labelled in the UI, and it bypasses the AI provider on
 * purpose so a live pitch is deterministic and network-independent.
 */

import type { AnswerInput } from "@/lib/types";

export const DEMO_TOPIC_ID = "opportunity-cost" as const;

/**
 * The learner has the definition memorised (all four correct) and cannot apply
 * it: the three application answers each land on a classic misconception.
 */
export const DEMO_THEORY_ANSWERS: Record<string, AnswerInput> = {
  "oc-t1": { optionId: "b", reasoning: "" },
  "oc-t2": { optionId: "b", reasoning: "" },
  "oc-t3": { optionId: "b", reasoning: "" },
  "oc-t4": { optionId: "b", reasoning: "" },
};

export const DEMO_APPLICATION_ANSWERS: Record<string, AnswerInput> = {
  // Misconception: opportunity cost is the sum of everything given up.
  "oc-a1": {
    optionId: "c",
    reasoning:
      "All three of them matter to me, so the cost is everything I missed — the project and the English revision together.",
  },
  // Misconception: the sunk ticket price makes attending the concert correct.
  "oc-a2": {
    optionId: "c",
    reasoning:
      "I would go to the concert first and then join the workshop, because I paid 25 dollars for the ticket and I do not want it to go to waste.",
  },
  // Misconception: an owned asset is free to use.
  "oc-a3": {
    optionId: "d",
    reasoning:
      "The space is hers already and no rent is paid, so using it does not really cost anything extra. The construction cost is the only thing she spends.",
  },
};

/** After the bridge, the same learner applies the concept correctly. */
export const DEMO_REASSESSMENT_ANSWERS: Record<string, AnswerInput> = {
  // oc-a4 — public spending.
  "oc-a4": {
    optionId: "c",
    reasoning:
      "The council gave up the best alternative use of the budget, which was the flood defences. The 2 million is the same for every option, so it does not distinguish them. Because the flood defences were ranked second, that forgone value is the real cost.",
  },
  // oc-a5 — value, not price.
  "oc-a5": {
    optionId: "a",
    reasoning:
      "The cost of choosing the internship is the product she gives up, so it is highest when the product would have been the most valuable use of her summer. The salary only tells you what the internship pays, not what choosing it costs her.",
  },
};

/** Bridge answers, used so the practice section plays through in one click. */
export const DEMO_BRIDGE_ANSWERS: Record<string, AnswerInput> = {
  "oc-b1": {
    optionId: "a",
    reasoning:
      "She gave up the 60 dollars she could have earned, because that was the next best alternative available to her on Saturday.",
  },
  "oc-b2": {
    optionId: "a",
    reasoning:
      "The team chose to build X, so the alternative they gave up is the unfixed bug. The ongoing losses to users are the cost of that choice, since the bug is still there.",
  },
  "oc-b3": {
    optionId: "a",
    reasoning:
      "Only the best alternative counts, because she could only have taken one elective. Debate at 70 is the highest-valued option she gave up, so that is the opportunity cost.",
  },
};

export function demoAnswerForTheory(questionId: string): AnswerInput | null {
  return DEMO_THEORY_ANSWERS[questionId] ?? null;
}

export function demoAnswerForApplication(questionId: string): AnswerInput | null {
  return DEMO_APPLICATION_ANSWERS[questionId] ?? DEMO_REASSESSMENT_ANSWERS[questionId] ?? null;
}

export function demoAnswerForBridge(exerciseId: string): AnswerInput | null {
  // Bridge ids are stamped per run, so match on the original id suffix.
  const originalId = exerciseId.split("-").slice(-2).join("-");
  return DEMO_BRIDGE_ANSWERS[originalId] ?? null;
}
