"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useSession } from "@/components/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { TOPICS } from "@/content/economics";
import { DEMO_TOPIC_ID } from "@/lib/demo";
import { latestProgressByTopic } from "@/lib/session";
import type { Topic, TopicProgress } from "@/lib/types";

/**
 * Home.
 *
 * One job: get the learner into the diagnostic. The score list below uses only
 * results the learner actually earned — "Not assessed" until they are.
 */
export default function HomePage() {
  const { state, startRun, reset, hydrated } = useSession();
  const router = useRouter();

  const startFresh = useCallback(() => {
    reset();
    router.push("/diagnostic");
  }, [reset, router]);

  const runDemo = useCallback(() => {
    startRun(DEMO_TOPIC_ID, true);
    router.push("/diagnostic");
  }, [startRun, router]);

  const latest = latestProgressByTopic(state.history);
  const inProgress =
    hydrated &&
    state.topicId !== null &&
    !state.afterScore &&
    (Object.keys(state.theoryAnswers).length > 0 ||
      Object.keys(state.applicationAnswers).length > 0);

  return (
    <div className="space-y-12">
      {/*
        The hero is a single glass panel. It has one job — make the promise and
        put the primary CTA within easy reach — so it holds no extra content.
      */}
      <section className="animate-rise">
        <Card variant="glassAccent" className="px-6 py-8 sm:px-10 sm:py-11">
          <div className="space-y-7">
            <div className="space-y-4">
              <SectionLabel>Economics · diagnostic</SectionLabel>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-5xl">
                From knowing to <span className="gradient-text">applying.</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                SkillBridge measures the gap between what you understand and what you can
                actually apply — then builds the practice that closes it.
              </p>
            </div>

            {/*
              Stacked and full-width on a phone: a thumb should not have to aim
              at a half-width target, and the primary CTA stays unmissable.
            */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {inProgress ? (
                <Link
                  href="/diagnostic"
                  className={buttonClass({ size: "lg", className: "w-full sm:w-auto" })}
                >
                  Resume diagnostic
                </Link>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" onClick={startFresh}>
                  Start Diagnostic
                </Button>
              )}
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={runDemo}
              >
                Run demo
              </Button>
            </div>

            <p className="max-w-xl text-xs leading-relaxed text-subtle-foreground">
              The diagnostic takes about two minutes: four theory questions, then three
              application scenarios. <span className="text-muted-foreground">Run demo</span> uses
              scripted answers so the whole loop can be shown in under a minute.
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <SectionLabel>Your learning</SectionLabel>
            <p className="text-sm text-muted-foreground">
              {historySummary(hydrated ? latest.size : 0)}
            </p>
          </div>
          <Link
            href="/progress"
            className="shrink-0 whitespace-nowrap text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View progress
          </Link>
        </div>

        <ul className="grid gap-3">
          {TOPICS.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              progress={latest.get(topic.id) ?? null}
              onStart={() => {
                startRun(topic.id, false);
                router.push("/diagnostic");
              }}
              active={state.topicId === topic.id && !state.afterScore}
            />
          ))}
        </ul>
      </section>

      <section className="grid gap-4 [&>*]:min-w-0 sm:grid-cols-3">
        {[
          {
            title: "Measure",
            body: "Theory questions and application scenarios are scored separately, so the two abilities never blur together.",
          },
          {
            title: "Detect the gap",
            body: "SkillBridge compares the two scores and isolates which micro-skills the learner cannot yet transfer.",
          },
          {
            title: "Bridge it",
            body: "Targeted practice is generated for exactly those skills, then application is re-measured on a new scenario.",
          },
        ].map((step, index) => (
          <Card key={step.title} variant="glass" className="p-5">
            <div className="space-y-2">
              <span className="text-xs font-semibold tabular-nums text-primary">
                0{index + 1}
              </span>
              <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                {step.title}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}

function historySummary(assessedTopics: number): string {
  if (assessedTopics === 0) {
    return "Nothing assessed yet. Your results appear here after a diagnostic.";
  }
  return `${assessedTopics} of ${TOPICS.length} topics assessed. Scores are your own results.`;
}

function TopicRow({
  topic,
  progress,
  onStart,
  active,
}: {
  topic: Topic;
  progress: TopicProgress | null;
  onStart: () => void;
  active: boolean;
}) {
  return (
    <Card as="li" className="transition-colors hover:border-border-strong">
      <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
              {topic.title}
            </p>
            {active ? <Badge tone="primary">In progress</Badge> : null}
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {topic.tagline}
          </p>
        </div>

        <div className="flex items-center gap-5">
          {progress ? (
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums tracking-[-0.02em] text-foreground">
                {Math.round(progress.afterScore ?? progress.applicationScore)}%
              </p>
              <p className="text-xs text-subtle-foreground">
                {progress.afterScore !== null
                  ? `application · was ${progress.applicationScore}%`
                  : "application"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-subtle-foreground">Not assessed</p>
          )}

          <Button variant="secondary" size="sm" onClick={onStart}>
            {progress ? "Retake" : "Assess"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
