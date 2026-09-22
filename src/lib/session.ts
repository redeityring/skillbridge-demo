/**
 * Session persistence.
 *
 * The MVP has no accounts (deliberately — see the README roadmap). A run lives
 * in `localStorage`, which is enough to carry state across screens, survive a
 * page reload mid-diagnostic, and let a demo be reset instantly.
 */

import type { GapAnalysis, SessionState, TopicProgress } from "@/lib/types";

export const SESSION_STORAGE_KEY = "skillbridge.session.v1";
export const SESSION_VERSION = 1;

export function createInitialState(): SessionState {
  return {
    version: SESSION_VERSION,
    runId: "",
    topicId: null,
    demoMode: false,
    theoryAnswers: {},
    applicationAnswers: {},
    applicationEvaluations: {},
    gap: null,
    bridgeExercises: [],
    bridgeAttempts: [],
    bridgeComplete: false,
    reassessmentQuestionIds: [],
    reassessmentAnswers: {},
    reassessmentEvaluations: {},
    beforeScore: null,
    afterScore: null,
    history: [],
  };
}

export function newRunId(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Read persisted state. Returns null when absent, stale, or unreadable. */
export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed || parsed.version !== SESSION_VERSION) return null;
    // Merge onto a fresh state so a schema addition can never break a session.
    return { ...createInitialState(), ...parsed };
  } catch {
    return null;
  }
}

export function saveSession(state: SessionState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode). Losing persistence is not
    // worth breaking the run, so this is intentionally silent.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/* Derived selectors                                                          */
/* -------------------------------------------------------------------------- */

/** The most recent completed run per topic — what the home screen lists. */
export function latestProgressByTopic(history: TopicProgress[]): Map<string, TopicProgress> {
  const map = new Map<string, TopicProgress>();
  for (const entry of history) map.set(entry.topicId, entry);
  return map;
}

export function isRunInProgress(state: SessionState): boolean {
  return Boolean(
    state.topicId &&
      (Object.keys(state.theoryAnswers).length > 0 ||
        Object.keys(state.applicationAnswers).length > 0) &&
      !state.afterScore,
  );
}

export function gapIsActionable(gap: GapAnalysis | null): boolean {
  return Boolean(gap && gap.level !== "low");
}
