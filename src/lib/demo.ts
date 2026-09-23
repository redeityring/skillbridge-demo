/**
 * Demo mode.
 *
 * WHAT THIS IS: a scripted set of *answers*, typed the way a real learner with
 * a real application gap would type them. It is a presentation fixture, so a
 * pitch does not depend on someone typing fast.
 *
 * WHAT THIS IS NOT: fake results. Demo mode runs every answer through the real
 * grading path — AI first, local rubric fallback — plus the real gap analysis,
 * the real bridge planner and the real reassessment. Nothing here hardcodes a
 * score — the 100 → ~17 → ~80 story falls out of the answers below.
 *
 * Answers are localized: a Russian demo types Russian answers, so the scripted
 * reasoning reads naturally in whatever language the pitch is delivered in.
 * Option ids are locale-independent (they match both content banks).
 *
 * Demo mode is explicitly labelled in the UI so the audience knows the answers
 * are scripted. The engine behind them is not labelled any differently, because
 * it is not different.
 */

import type { Locale } from "@/lib/i18n/config";
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

interface ScriptedAnswer {
  optionId: string;
  reasoning: Record<Locale, string>;
}

const DEMO_APPLICATION_SCRIPT: Record<string, ScriptedAnswer> = {
  // Misconception: opportunity cost is the sum of everything given up.
  "oc-a1": {
    optionId: "c",
    reasoning: {
      en: "All three of them matter to me, so the cost is everything I missed — the project and the English revision together.",
      ru: "Все три дела мне важны, поэтому стоимость — это всё, что я упустил: проект и подготовка по английскому вместе.",
    },
  },
  // Misconception: the sunk ticket price makes attending the concert correct.
  "oc-a2": {
    optionId: "c",
    reasoning: {
      en: "I would go to the concert first and then join the workshop, because I paid 25 dollars for the ticket and I do not want it to go to waste.",
      ru: "Сначала пойду на концерт, потом присоединюсь к воркшопу: я заплатил 25 долларов за билет и не хочу, чтобы они пропали зря.",
    },
  },
  // Misconception: an owned asset is free to use.
  "oc-a3": {
    optionId: "d",
    reasoning: {
      en: "The space is hers already and no rent is paid, so using it does not really cost anything extra. The construction cost is the only thing she spends.",
      ru: "Помещение уже её, аренды нет — пользоваться им ничего дополнительно не стоит. Единственная трата — стоимость строительства.",
    },
  },
};

/** After the bridge, the same learner applies the concept correctly. */
const DEMO_REASSESSMENT_SCRIPT: Record<string, ScriptedAnswer> = {
  // oc-a4 — public spending.
  "oc-a4": {
    optionId: "c",
    reasoning: {
      en: "The council gave up the best alternative use of the budget, which was the flood defences. The 2 million is the same for every option, so it does not distinguish them. Because the flood defences were ranked second, that forgone value is the real cost.",
      ru: "Администрация отказалась от лучшего альтернативного использования бюджета — защиты от наводнений. 2 миллиона одинаковы для всех вариантов, поэтому они ничего не различают. Так как защита шла второй, именно эта упущенная ценность — реальные затраты.",
    },
  },
  // oc-a5 — value, not price.
  "oc-a5": {
    optionId: "a",
    reasoning: {
      en: "The cost of choosing the internship is the product she gives up, so it is highest when the product would have been the most valuable use of her summer. The salary only tells you what the internship pays, not what choosing it costs her.",
      ru: "Стоимость выбора стажировки — это продукт, от которого она отказывается, поэтому она максимальна, когда продукт был бы самым ценным использованием лета. Зарплата говорит лишь о том, что платит стажировка, а не о том, чего выбор стоит.",
    },
  },
};

/** Bridge answers, used so the practice section plays through in one click. */
const DEMO_BRIDGE_SCRIPT: Record<string, ScriptedAnswer> = {
  "oc-b1": {
    optionId: "a",
    reasoning: {
      en: "She gave up the 60 dollars she could have earned, because that was the next best alternative available to her on Saturday.",
      ru: "Она отказалась от 60 долларов, которые могла бы заработать, потому что это была лучшая из доступных ей альтернатив в субботу.",
    },
  },
  "oc-b2": {
    optionId: "a",
    reasoning: {
      en: "The team chose to build X, so the alternative they gave up is the unfixed bug. The ongoing losses to users are the cost of that choice, since the bug is still there.",
      ru: "Команда выбрала разработку X, значит от чего они отказались — от неисправленного бага. Постоянные потери пользователей — цена этого выбора, потому что баг всё ещё там.",
    },
  },
  "oc-b3": {
    optionId: "a",
    reasoning: {
      en: "Only the best alternative counts, because she could only have taken one elective. Debate at 70 is the highest-valued option she gave up, so that is the opportunity cost.",
      ru: "Учитывается только лучшая альтернатива: она могла выбрать лишь один факультатив. Дебаты с ценностью 70 — самая ценная упущенная опция, значит это и есть альтернативная стоимость.",
    },
  },
};

function toAnswer(scripted: ScriptedAnswer, locale: Locale): AnswerInput {
  return { optionId: scripted.optionId, reasoning: scripted.reasoning[locale] };
}

export function demoAnswerForTheory(questionId: string): AnswerInput | null {
  return DEMO_THEORY_ANSWERS[questionId] ?? null;
}

export function demoAnswerForApplication(
  questionId: string,
  locale: Locale = "en",
): AnswerInput | null {
  const scripted =
    DEMO_APPLICATION_SCRIPT[questionId] ?? DEMO_REASSESSMENT_SCRIPT[questionId];
  return scripted ? toAnswer(scripted, locale) : null;
}

export function demoAnswerForBridge(
  exerciseId: string,
  locale: Locale = "en",
): AnswerInput | null {
  // Bridge ids are stamped per run, so match on the original id suffix.
  const originalId = exerciseId.split("-").slice(-2).join("-");
  const scripted = DEMO_BRIDGE_SCRIPT[originalId];
  return scripted ? toAnswer(scripted, locale) : null;
}
