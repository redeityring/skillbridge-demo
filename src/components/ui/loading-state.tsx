"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * A loading state that says what is happening.
 *
 * Messages rotate on a timer so a slow model call reads as work in progress
 * rather than a frozen screen.
 */
export function LoadingState({
  title,
  messages,
  className,
}: {
  title?: string;
  messages?: string[];
  className?: string;
}) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t.loadingAnalyzing;
  const resolvedMessages =
    messages ?? [t.loadingReading, t.loadingComparing, t.loadingIdentifying];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (resolvedMessages.length < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % resolvedMessages.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [resolvedMessages.length]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="space-y-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <p className="text-sm font-medium text-foreground">{resolvedTitle}</p>
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resolvedMessages[index % resolvedMessages.length] ?? ""}
        </p>

        <div className="space-y-2" aria-hidden="true">
          <SkeletonLine width="92%" />
          <SkeletonLine width="78%" />
          <SkeletonLine width="85%" />
        </div>
      </div>
    </Card>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      className="h-2.5 animate-shimmer rounded-full bg-surface-sunken"
      style={{ width }}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface/60 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

/** Inline, non-blocking error with a retry affordance. */
export function ErrorNotice({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning-border bg-warning-subtle px-4 py-3 text-sm text-warning-strong",
        className,
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <LocalizedRetry onRetry={onRetry} />
      ) : null}
    </div>
  );
}

function LocalizedRetry({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onRetry}
      className="rounded-sm font-medium underline decoration-warning underline-offset-2 hover:no-underline"
    >
      {t.tryAgain}
    </button>
  );
}
