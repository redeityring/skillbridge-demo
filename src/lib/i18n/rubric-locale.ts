/**
 * Server-safe dictionary accessor for the rubric engine.
 *
 * The evaluator runs in API routes (server) and as the client-side fallback, so
 * it cannot call the `useI18n()` hook. Both consumers resolve the locale through
 * this module instead: the server passes it explicitly, the client reads the
 * same persisted preference via `loadLocale()`.
 */

import { loadLocale, type Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { ru } from "@/lib/i18n/dictionaries/ru";
import type { Dictionary } from "@/lib/i18n/types";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ru };

export function getRubricDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en;
}

/** Locale for an evaluation when the caller has no explicit one (client side). */
export function currentLocale(): Locale {
  return loadLocale();
}
