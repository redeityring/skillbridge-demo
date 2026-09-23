/**
 * Locale configuration.
 *
 * The product ships in English and Russian. The default locale follows the
 * learner's system language ("ru" for any Russian-format browser), and the
 * learner can override it in the header; the override persists separately from
 * the run state, so switching language never touches answers or history.
 */

export const LOCALES = ["en", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = "skillbridge.locale";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** System language of the browser, or null when unavailable (SSR). */
export function detectSystemLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const language = window.navigator.language ?? "";
  if (language.toLowerCase().startsWith("ru")) return "ru";
  return "en";
}

/** Stored override wins; otherwise follow the system language. */
export function loadLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* private mode — fall through to detection */
  }
  return detectSystemLocale() ?? "en";
}

export function saveLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore — persistence is best-effort */
  }
}

/** English name of a locale, for AI output-language instructions. */
export function localeLanguageName(locale: Locale): string {
  return locale === "ru" ? "Russian" : "English";
}

/**
 * Russian numeral agreement: one/few/many, per the standard rules.
 * Used by the ru dictionary for phrases like "1 задача / 2 задачи / 5 задач".
 */
export function pluralRu(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
