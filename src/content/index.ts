/**
 * Content registry.
 *
 * `content/economics.ts` keeps the English bank (canonical ids and copy);
 * `content/ru/` holds the Russian mirror with identical ids. Everything in the
 * app reads topics through `getTopic(topicId, locale)`, so a locale switch
 * changes wording and rubrics — never ids, structure or scoring.
 */

import { inflationRu } from "@/content/ru/inflation";
import { opportunityCostRu } from "@/content/ru/opportunity-cost";
import { supplyAndDemandRu } from "@/content/ru/supply-and-demand";
import {
  getTopic as getTopicEn,
  TOPICS as TOPICS_EN,
} from "@/content/economics";
import type { Locale } from "@/lib/i18n/config";
import type { Topic, TopicId } from "@/lib/types";

/** Per-locale topic banks. Ids match 1:1 across locales. */
const BANKS: Record<Locale, Topic[]> = {
  en: TOPICS_EN,
  ru: [opportunityCostRu, supplyAndDemandRu, inflationRu],
};

/** Ordered topic list for listings (home, topic chooser). */
export function getTopics(locale: Locale): Topic[] {
  return BANKS[locale] ?? BANKS.en;
}

/** One topic by id in the requested locale. Throws on an unknown id. */
export function getTopic(topicId: TopicId, locale: Locale = "en"): Topic {
  const bank = BANKS[locale] ?? BANKS.en;
  const topic = bank.find((candidate) => candidate.id === topicId);
  if (!topic) return getTopicEn(topicId);
  return topic;
}

/** Tolerant lookup: null instead of a throw, for UI code paths. */
export function findTopic(topicId: TopicId | null, locale: Locale = "en"): Topic | null {
  if (!topicId) return null;
  try {
    return getTopic(topicId, locale);
  } catch {
    return null;
  }
}

export { TOPICS_EN as TOPICS_EN };
