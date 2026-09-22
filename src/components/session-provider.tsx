"use client";

/**
 * The single source of truth for the current run.
 *
 * Deliberately small: one state object, one `patch` function, one `startRun`,
 * one `reset`. Every screen reads from here, so the loop's data (answers,
 * scores, gap, bridge, before/after) is never duplicated in component state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  SESSION_VERSION,
  clearSession,
  createInitialState,
  loadSession,
  newRunId,
  saveSession,
} from "@/lib/session";
import type { SessionState, TopicId } from "@/lib/types";

interface SessionContextValue {
  state: SessionState;
  /** True once localStorage has been read, so screens can avoid a flash. */
  hydrated: boolean;
  patch: (partial: Partial<SessionState>) => void;
  startRun: (topicId: TopicId, demoMode: boolean) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  // Read once on mount. The first paint uses the server-safe initial state.
  useEffect(() => {
    const stored = loadSession();
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    saveSession(state);
  }, [state, hydrated]);

  const patch = useCallback((partial: Partial<SessionState>) => {
    setState((current) => ({ ...current, ...partial }));
  }, []);

  const startRun = useCallback((topicId: TopicId, demoMode: boolean) => {
    setState({
      ...createInitialState(),
      version: SESSION_VERSION,
      runId: newRunId(),
      topicId,
      demoMode,
    });
    skipPersist.current = false;
  }, []);

  /** Reset the run but keep the learner's history. */
  const reset = useCallback(() => {
    setState((current) => ({
      ...createInitialState(),
      history: current.history,
    }));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ state, hydrated, patch, startRun, reset }),
    [state, hydrated, patch, startRun, reset],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>");
  return context;
}

/** Hard reset used by the demo controls: wipes state and stored history. */
export function resetEverything(): void {
  clearSession();
}
