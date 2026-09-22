"use client";

import { useEffect, useState } from "react";

import { Badge, StatusDot } from "@/components/ui/badge";
import { useSession } from "@/components/session-provider";

interface AiStatus {
  available: boolean;
  providerLabel: string;
  model: string | null;
  reason: string | null;
}

/**
 * Shows which engine is scoring answers.
 *
 * This is intentionally visible to the learner: the product should never imply
 * an AI judgement when the local rubric produced the number.
 */
export function EngineBadge() {
  const { state } = useSession();
  const [status, setStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AiStatus | null) => {
        if (!cancelled && data) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.demoMode) {
    return (
      <Badge
        tone="warning"
        title="Demo mode: scripted answers, scored by the local rubric engine. No AI calls are made."
      >
        <StatusDot tone="warning" />
        Demo mode
      </Badge>
    );
  }

  if (!status) {
    return (
      <Badge tone="neutral">
        <StatusDot tone="neutral" />
        Checking engine…
      </Badge>
    );
  }

  if (status.available) {
    return (
      <Badge tone="primary" title={`Answers are graded by ${status.providerLabel} (${status.model}).`}>
        <StatusDot tone="primary" />
        Live AI · {status.model}
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" title={status.reason ?? undefined}>
      <StatusDot tone="neutral" />
      Local rubric engine
    </Badge>
  );
}
