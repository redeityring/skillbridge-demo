import { Badge } from "@/components/ui/badge";
import { Card, SectionLabel } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * The shared frame for every application-style task: diagnostic scenarios,
 * bridge challenges and reassessment all render through this, which is what
 * keeps the three screens visually consistent.
 */
export function ScenarioBlock({
  eyebrow,
  skill,
  title,
  scenario,
  constraints = [],
  decisionPrompt,
  badge,
  children,
  className,
}: {
  eyebrow?: string;
  skill?: string;
  title: string;
  scenario: string;
  constraints?: string[];
  decisionPrompt: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("animate-fade-up overflow-hidden", className)}>
      <div className="space-y-5 px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
          {skill ? <Badge tone="primary">{skill}</Badge> : null}
          {badge}
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{scenario}</p>
        </div>

        {constraints.length > 0 ? (
          <ul className="space-y-1.5 rounded-md border border-border bg-surface-muted px-4 py-3.5">
            {constraints.map((constraint) => (
              <li key={constraint} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-border-strong" />
                <span>{constraint}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-[0.9375rem] font-medium leading-relaxed text-foreground">
          {decisionPrompt}
        </p>

        {children}
      </div>
    </Card>
  );
}
