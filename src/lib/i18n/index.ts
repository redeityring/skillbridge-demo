/**
 * Public surface of the i18n module.
 * Import from "@/lib/i18n" everywhere; internal file layout is free to change.
 */

export {
  LOCALES,
  LOCALE_STORAGE_KEY,
  detectSystemLocale,
  isLocale,
  loadLocale,
  localeLanguageName,
  pluralRu,
  saveLocale,
} from "./config";
export type { Locale } from "./config";
export { LocaleProvider, systemLocale, useI18n } from "./locale-context";
export type { Dictionary } from "./types";
