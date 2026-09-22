import { cn } from "@/lib/cn";

/**
 * Surface treatments.
 *
 * `solid` is the default on purpose. `backdrop-filter` is the most expensive
 * paint on the page, so glass is reserved for the handful of panels that carry
 * the product's story (results, the gap, practice) rather than applied to every
 * card — a long list of blurred rows is what makes a glassy UI feel slow.
 */
export type CardVariant = "solid" | "glass" | "glassStrong" | "glassAccent";

const VARIANTS: Record<CardVariant, string> = {
  solid: "rounded-lg border border-border bg-surface shadow-sm",
  // The lit rim needs the panel to be translucent, so glass brings its own
  // border and shadow from the `.glass` recipe.
  glass: "sheen rounded-xl glass",
  glassStrong: "sheen rounded-xl glass-strong",
  glassAccent: "sheen rounded-xl glass-accent",
};

export function Card({
  className,
  children,
  as: Tag = "div",
  variant = "solid",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "article" | "li";
  variant?: CardVariant;
}) {
  return <Tag className={cn(VARIANTS[variant], className)}>{children}</Tag>;
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("space-y-1.5 px-6 pt-5 pb-4", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
  as: Tag = "h2",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn("text-base font-semibold tracking-[-0.015em] text-foreground", className)}
    >
      {children}
    </Tag>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm leading-relaxed text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-6 pb-5", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-border/70 px-6 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Small uppercase eyebrow used to label sections without adding weight. */
export function SectionLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-subtle-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
