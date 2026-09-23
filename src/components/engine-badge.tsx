"use client";

import { useEffect, useState } from "react";

import { Badge, StatusDot } from "@/components/ui/badge";
import { useSession } from "@/components/session-provider";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
      <Badge tone="warning" title={t.engineDemoTitle}>
        <StatusDot tone="warning" />
        {t.engineDemo}
      </Badge>
    );
  }

  if (!status) {
    return (
      <Badge tone="neutral">
        <StatusDot tone="neutral" />
        {t.engineChecking}
      </Badge>
    );
  }

  if (status.available) {
    return (
      <Badge tone="primary" title={t.engineLiveTitle}>
        <StatusDot tone="primary" />
        {t.engineLive} · {status.model}
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" title={t.engineLocalTitle}>
      <StatusDot tone="neutral" />
      {t.engineLocal}
    </Badge>
  );
}
