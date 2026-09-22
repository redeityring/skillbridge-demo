import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted-foreground border-border",
  primary: "bg-primary-subtle text-primary border-primary-border",
  success: "bg-success-subtle text-success-strong border-success-border",
  warning: "bg-warning-subtle text-warning-strong border-warning-border",
  danger: "bg-danger-subtle text-danger-strong border-danger-border",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  icon,
  title,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  /** Native tooltip — used to explain which engine scored an answer. */
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** A small filled/hollow dot used before status text. */
export function StatusDot({ tone = "neutral" }: { tone?: BadgeTone }) {
  const color: Record<BadgeTone, string> = {
    neutral: "bg-subtle-foreground",
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return <span className={cn("h-1.5 w-1.5 rounded-full", color[tone])} />;
}

/** Maps a 0..100 score to the semantic tone it should be shown in. */
export function toneForScore(score: number): BadgeTone {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export function toneForGapLevel(level: "low" | "medium" | "high"): BadgeTone {
  if (level === "low") return "success";
  if (level === "medium") return "warning";
  return "danger";
}
