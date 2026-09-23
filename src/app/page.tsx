"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useSession } from "@/components/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { getTopics } from "@/content";
import { DEMO_TOPIC_ID } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
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
  const { t, locale } = useI18n();
  const router = useRouter();

  const topics = getTopics(locale);

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
              <SectionLabel>{t.homeEyebrow}</SectionLabel>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-5xl">
                {t.homeTitle1} <span className="gradient-text">{t.homeTitleAccent}</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                {t.homeSubtitle}
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
                  {t.homeResume}
                </Link>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" onClick={startFresh}>
                  {t.homeStart}
                </Button>
              )}
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={runDemo}
              >
                {t.homeDemo}
              </Button>
            </div>

            <p className="max-w-xl text-xs leading-relaxed text-subtle-foreground">
              {t.homeHint}{" "}
              <span className="text-muted-foreground">
                {t.homeHintDemoLead}
                {t.homeHintDemoRest}
              </span>
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <SectionLabel>{t.homeYourLearning}</SectionLabel>
            <p className="text-sm text-muted-foreground">
              {latest.size === 0
                ? t.homeNoResults
                : `${t.homeTopicsAssessed(latest.size, topics.length)} ${t.homeResultsNote}`}
            </p>
          </div>
          <Link
            href="/progress"
            className="shrink-0 whitespace-nowrap text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t.homeViewProgress}
          </Link>
        </div>

        <ul className="grid gap-3">
          {topics.map((topic) => (
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
            title: t.homeStep1,
            body: t.homeStep1Body,
          },
          {
            title: t.homeStep2,
            body: t.homeStep2Body,
          },
          {
            title: t.homeStep3,
            body: t.homeStep3Body,
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
  const { t } = useI18n();

  return (
    <Card as="li" className="transition-colors hover:border-border-strong">
      <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
              {topic.title}
            </p>
            {active ? <Badge tone="primary">{t.homeInProgress}</Badge> : null}
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
                  ? t.homeApplicationWas(progress.applicationScore)
                  : t.homeApplication}
              </p>
            </div>
          ) : (
            <p className="text-sm text-subtle-foreground">{t.homeNotAssessed}</p>
          )}

          <Button variant="secondary" size="sm" onClick={onStart}>
            {progress ? t.homeRetake : t.homeAssess}
          </Button>
        </div>
      </div>
    </Card>
  );
}
