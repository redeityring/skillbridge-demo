"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";

/**
 * Resets the current run and returns home, keeping completed history.
 * A demo needs to restart on stage without hunting through a menu.
 */
export function ResetRunButton() {
  const { state, reset, hydrated } = useSession();
  const router = useRouter();

  const hasRun =
    state.topicId !== null ||
    state.gap !== null ||
    Object.keys(state.theoryAnswers).length > 0;

  const handleReset = useCallback(() => {
    reset();
    router.push("/");
  }, [reset, router]);

  if (!hydrated || !hasRun) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      title="Clear this run and start again. Completed results stay in Progress."
    >
      Reset run
    </Button>
  );
}
