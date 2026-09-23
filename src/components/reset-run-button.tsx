"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/**
 * Resets the current run and returns home, keeping completed history.
 * A demo needs to restart on stage without hunting through a menu.
 */
export function ResetRunButton() {
  const { state, reset, hydrated } = useSession();
  const { t } = useI18n();
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
    <Button variant="ghost" size="sm" onClick={handleReset} title={t.resetTitle}>
      {t.resetRun}
    </Button>
  );
}
