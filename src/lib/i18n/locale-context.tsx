"use client";

/**
 * The React side of i18n.
 *
 * A locale context + one hook. The provider is separate from SessionProvider
 * because language is a preference, not run data: switching it must never
 * touch answers, scores or history, and it must work on every screen —
 * including the topic chooser shown before any session exists.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  detectSystemLocale,
  loadLocale,
  saveLocale,
  type Locale,
} from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { ru } from "@/lib/i18n/dictionaries/ru";
import type { Dictionary } from "@/lib/i18n/types";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ru };

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Server render and the first client render both use this. */
const SERVER_LOCALE: Locale = "en";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // "en" on the server; corrected on mount before first paint of content
  // that reads it (screens are gated behind `hydrated` anyway).
  const [locale, setLocaleState] = useState<Locale>(SERVER_LOCALE);

  useEffect(() => {
    setLocaleState(loadLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: DICTIONARIES[locale], setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useI18n must be used inside <LocaleProvider>");
  return context;
}

/** Test helper / SSR escape hatch. */
export function systemLocale(): Locale {
  return detectSystemLocale() ?? SERVER_LOCALE;
}
