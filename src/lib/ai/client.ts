/**
 * Server-side AI client.
 *
 * Design decisions:
 *  - Provider-agnostic: any OpenAI-compatible /chat/completions endpoint works.
 *  - Server-only: the API key is read from `process.env` and never appears in
 *    client code, client env vars, or the repository.
 *  - Model fallback chain: a provider can be configured with an ordered list of
 *    models. Free model variants are rate-limited independently of each other,
 *    so falling through the list multiplies the usable quota and means one
 *    saturated or broken model cannot take the product down mid-demo.
 *  - Bounded: every call has a hard timeout, and the number of attempts is
 *    capped, because the product must never leave the learner staring at a
 *    spinner.
 *  - Failure is a first-class result, not an exception: callers get
 *    `{ ok: false, error }` and fall back to the local rubric.
 */

import { z } from "zod";

import type { Locale } from "@/lib/i18n/config";

/** One candidate model, plus what the endpoint can be asked to do. */
export interface AiModel {
  id: string;
  /**
   * Whether this endpoint accepts `response_format: {type:"json_object"}`.
   *
   * This is asked only when *every* model in the chain supports it. Mixing is
   * what breaks: the provider's own failover would retry an unsupported
   * `response_format` against the next model and get a 400 there too. Since the
   * prompts state the exact JSON shape and `extractJson` recovers fenced or
   * prose-wrapped output, omitting the parameter is a safe trade.
   */
  jsonMode: boolean;
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  /** Ordered candidates. The first that answers wins. */
  models: AiModel[];
  label: string;
  /**
   * Whether this provider accepts a `models: [...]` array, letting the provider
   * fail over between them inside a single HTTP request.
   */
  modelArrayRouting: boolean;
  /** Extra request headers (e.g. OpenRouter app attribution). */
  headers: Record<string, string>;
}

export interface AiStatus {
  available: boolean;
  providerLabel: string;
  model: string | null;
  /** Why AI is unavailable, when it is. */
  reason: string | null;
}

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 15_000);

/**
 * Runtime health of the provider.
 *
 * A configured key is not the same as a working key — the account behind it can
 * run out of credit, be rate-limited, or be revoked. When a call fails for a
 * reason that is not transient we remember it briefly so the header can report
 * the truth instead of advertising an engine that is silently falling back.
 */
const FAILURE_TTL_MS = 60_000;
let lastFailure: { message: string; at: number } | null = null;

/**
 * The model that actually served the most recent successful call. Reported in
 * the header, which is how a presenter can confirm the live path is real.
 */
let lastServedModel: string | null = null;

function recordAiFailure(message: string): void {
  lastFailure = { message, at: Date.now() };
}

function recordAiSuccess(model: string): void {
  lastFailure = null;
  lastServedModel = model;
}

/**
 * Maps a provider status code onto a message safe to show a learner — in the
 * learner's language. These strings reach the UI via the fallback notice, so
 * they must never mix languages inside one evaluation.
 */
function friendlyError(status: number, detail: string, locale: Locale): string {
  // Keep the provider's own words in the server log, never in the UI.
  console.warn(`[skillbridge] AI provider responded ${status}: ${detail.slice(0, 500)}`);
  // A 429 can mean two very different things, and the honest distinction is
  // user-facing: the account's *daily* free-tier quota (resets at 00:00 UTC,
  // nothing anyone can do right now) versus momentary model overload (retry
  // another model in the chain and it usually works).
  const isDailyQuota =
    status === 429 &&
    (detail.includes("free-models-per-day") || detail.includes("free_tier_daily"));
  if (locale === "ru") {
    if (status === 401 || status === 403) return "AI-провайдер отклонил настроенный API-ключ.";
    if (status === 402) return "У аккаунта AI-провайдера закончились кредиты.";
    if (status === 429 && isDailyQuota)
      return "Дневной лимит бесплатных AI-запросов для этого ключа исчерпан (обновляется в 00:00 UTC).";
    if (status === 429) return "Все бесплатные AI-модели сейчас перегружены (лимит запросов).";
    if (status === 404) return "Ни одна из настроенных AI-моделей не найдена у провайдера.";
    if (status >= 500) return "AI-провайдер временно недоступен.";
    return "AI-провайдер вернул неожиданный ответ.";
  }
  if (status === 401 || status === 403) return "The AI provider rejected the configured API key.";
  if (status === 402) return "The AI provider account has no available credits.";
  if (status === 429 && isDailyQuota)
    return "The daily free-tier AI request quota for this key is used up (resets at 00:00 UTC).";
  if (status === 429) return "Every free AI model is rate-limited right now.";
  if (status === 404) return "None of the configured AI models were found on this provider.";
  if (status >= 500) return "The AI provider is temporarily unavailable.";
  return "The AI provider returned an unexpected response.";
}

/** Fallback-notice strings, localized once here so callers stay language-clean. */
function attemptMessage(key: "timeout" | "network" | "empty" | "unparseable" | "schema", locale: Locale): string {
  const ru: Record<typeof key, string> = {
    timeout: "Истекло время ожидания AI-провайдера.",
    network: "Не удалось связаться с AI-провайдером.",
    empty: "AI-провайдер вернул пустой ответ.",
    unparseable: "Ответ AI не удалось разобрать.",
    schema: "Ответ AI не совпал с ожидаемой структурой.",
  };
  const en: Record<typeof key, string> = {
    timeout: "The AI provider timed out.",
    network: "Could not reach the AI provider.",
    empty: "The AI provider returned an empty response.",
    unparseable: "The AI response could not be parsed.",
    schema: "The AI response did not match the expected structure.",
  };
  return (locale === "ru" ? ru : en)[key];
}

/* -------------------------------------------------------------------------- */
/* Provider presets                                                            */
/* -------------------------------------------------------------------------- */

type ProviderPreset = {
  keyEnv: string;
  baseUrl: string;
  models: AiModel[];
  label: string;
  modelArrayRouting?: boolean;
  headers?: Record<string, string>;
};

/**
 * OpenRouter's free tier — the only provider SkillBridge uses.
 *
 * Free variants (`:free`) are capped per minute and per day, and — in
 * OpenRouter's own words — "different models have different rate limits, so you
 * can share the load that way". Each model below sits on different upstream
 * infrastructure, so the list is both a quota multiplier and an outage
 * workaround.
 *
 * Ordered by fitness for the job at hand (grading short written answers into a
 * fixed JSON shape), weighing measured reasoning quality, JSON reliability and
 * context length. Every id and `jsonMode` flag below is verified against
 * GET /api/v1/models rather than assumed.
 *
 * `jsonMode` mirrors whether the model declares `response_format` support, so
 * single-model attempts can ask for structured output where it exists and
 * avoid a guaranteed 400 where it does not.
 */
const OPENROUTER_FREE_MODELS: AiModel[] = [
  // 120B MoE with native structured output; 262k context. Verified live:
  // grades a full answer in ~3–4 s with reasoning disabled.
  { id: "nvidia/nemotron-3-super-120b-a12b:free", jsonMode: true },
  // 512k-context preview MoE with structured output. Verified live: ~1.5 s.
  { id: "dots-studio/dots-3-note-preview:free", jsonMode: true },
  // Dense 31B from Google; dependable instruction following + structured output.
  { id: "google/gemma-4-31b-it:free", jsonMode: true },
  // Fast MoE with structured output.
  { id: "google/gemma-4-26b-a4b-it:free", jsonMode: true },
  // Very strong reasoning, smaller 32k window — ample for these prompts.
  { id: "z-ai/glm-5.2:free", jsonMode: false },
  // Strongest measured reasoning of the free set; 262k context.
  { id: "qwen/qwen3.8-27b:free", jsonMode: false },
  // 550B MoE, 1M context — big spare tyre, no structured output declared.
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", jsonMode: false },
  // (Removed: thinkingmachines/inkling:free — gated to agentic harnesses, 403s
  // unconditionally for plain API calls; nex-agi/nex-n2.5-pro:free — hung
  // without any response for 14 s+ during live testing. Both only added dead
  // latency between the models that actually work.)
];

/**
 * OpenRouter accepts at most 3 model ids per `models: [...]` routing array
 * (verified: a larger array is rejected with 400). The first group rides the
 * native failover request; the rest are walked one model at a time.
 */
const OPENROUTER_MAX_ROUTED = 3;

/**
 * The only provider preset. SkillBridge is OpenRouter-only: one key, free
 * models, an internal failover chain. (Cerebras was dropped after its credits
 * ran out mid-demo — the lesson is that a single paid endpoint is a single
 * point of failure, and free tiers multiply quota instead of spending it.)
 */
const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    keyEnv: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    models: OPENROUTER_FREE_MODELS,
    label: "OpenRouter",
    modelArrayRouting: true,
    // Documented app-attribution headers. Optional, but OpenRouter asks for
    // them and they cost nothing.
    headers: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "https://github.com/skillbridge",
      "X-Title": process.env.OPENROUTER_SITE_NAME ?? "SkillBridge",
    },
  },
];

/** Parse a comma-separated model list from the environment, if present. */
function modelsFromEnv(fallback: AiModel[]): AiModel[] {
  const raw = process.env.AI_MODELS ?? process.env.AI_MODEL;
  if (!raw) return fallback;

  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) return fallback;

  // An explicit override means the operator knows their endpoint, so JSON mode
  // is opted in unless they turn it off with AI_JSON_MODE=false.
  const jsonMode = process.env.AI_JSON_MODE !== "false";
  return ids.map((id) => ({ id, jsonMode }));
}

/**
 * Resolution order:
 *  1. AI_API_KEY + AI_BASE_URL + AI_MODEL(S)   (explicit override)
 *  2. the first known provider whose key is present
 */
export function getAiConfig(): AiConfig | null {
  // Explicit override (AI_API_KEY + AI_BASE_URL) still wins for local
  // experimentation, but the shipped default path is OpenRouter free models.
  if (process.env.AI_API_KEY) {
    return {
      apiKey: process.env.AI_API_KEY,
      baseUrl: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
      models: modelsFromEnv([{ id: "gpt-4o-mini", jsonMode: true }]),
      label: "Custom provider",
      modelArrayRouting: false,
      headers: {},
    };
  }

  for (const preset of PROVIDER_PRESETS) {
    const apiKey = process.env[preset.keyEnv];
    if (!apiKey) continue;
    return {
      apiKey,
      baseUrl: (process.env.AI_BASE_URL ?? preset.baseUrl).replace(/\/$/, ""),
      models: modelsFromEnv(preset.models),
      label: preset.label,
      // A base-URL override means we are no longer talking to OpenRouter, so
      // its `models` array cannot be assumed.
      modelArrayRouting: process.env.AI_BASE_URL ? false : Boolean(preset.modelArrayRouting),
      headers: preset.headers ?? {},
    };
  }

  return null;
}

/** Short label for a model id, e.g. "qwen/qwen3.8-27b:free" -> "qwen3.8-27b". */
function shortModelName(id: string): string {
  const withoutVariant = id.replace(/:free$/, "");
  const tail = withoutVariant.includes("/") ? withoutVariant.split("/").pop()! : withoutVariant;
  return tail;
}

export function getAiStatus(): AiStatus {
  const config = getAiConfig();
  if (!config) {
    return {
      available: false,
      providerLabel: "Local rubric",
      model: null,
      reason: "No AI provider key configured. Scores come from the built-in rubric engine.",
    };
  }

  // A key exists but recent calls failed: report the engine actually in use.
  if (lastFailure && Date.now() - lastFailure.at < FAILURE_TTL_MS) {
    return {
      available: false,
      providerLabel: config.label,
      model: lastServedModel,
      reason: `${lastFailure.message} Answers are being scored by the local rubric engine.`,
    };
  }

  return {
    available: true,
    providerLabel: config.label,
    model: shortModelName(lastServedModel ?? config.models[0]!.id),
    reason: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Verified status                                                            */
/* -------------------------------------------------------------------------- */

const VERIFY_TTL_MS = 5 * 60_000;
let verification: { at: number; status: AiStatus } | null = null;
let verificationInFlight: Promise<AiStatus> | null = null;

/**
 * Status backed by an actual round trip to the provider.
 *
 * A key can be present and still be unusable — out of credit, revoked, or
 * pointing at a model that does not exist. Probing once (and caching the
 * answer) is what lets the UI say "this is being graded by AI" truthfully.
 */
export async function getAiStatusVerified(): Promise<AiStatus> {
  const config = getAiConfig();
  if (!config) return getAiStatus();

  const cached = verification;
  if (cached && Date.now() - cached.at < VERIFY_TTL_MS) return cached.status;
  if (verificationInFlight) return verificationInFlight;

  verificationInFlight = (async () => {
    const probe = await chatJson({
      system: "You are a health check. Reply with JSON only.",
      user: 'Return exactly {"ok":true}',
      schema: z.object({ ok: z.boolean() }),
      maxTokens: 32,
      temperature: 0,
      timeoutMs: 12_000,
    });

    const status: AiStatus = probe.ok
      ? {
          available: true,
          providerLabel: config.label,
          model: shortModelName(probe.model),
          reason: null,
        }
      : {
          available: false,
          providerLabel: config.label,
          model: null,
          reason: `${probe.error} Answers are being scored by the local rubric engine.`,
        };

    verification = { at: Date.now(), status };
    verificationInFlight = null;
    return status;
  })();

  return verificationInFlight;
}

/* -------------------------------------------------------------------------- */
/* Structured completion                                                      */
/* -------------------------------------------------------------------------- */

export type ChatJsonResult<T> =
  | { ok: true; data: T; raw: string; model: string }
  | { ok: false; error: string };

/** Pull the first JSON object out of a model response, fences and prose included. */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const candidates: string[] = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try the next shape */
    }
  }
  return undefined;
}

interface ChatJsonOptions<S extends z.ZodType> {
  system: string;
  user: string;
  schema: S;
  /** Max output tokens. Kept small: these are structured, not essays. */
  maxTokens?: number;
  timeoutMs?: number;
  temperature?: number;
  /** Learner's language — failure notices are worded in it. */
  locale?: Locale;
}

/** How one HTTP attempt ended. Drives whether the chain keeps going. */
type AttemptOutcome =
  | { status: "ok"; content: string; model: string }
  /** This model cannot answer; a different model might. */
  | { status: "next"; message: string }
  /** The request itself is wrong; another model will not help. */
  | { status: "stop"; message: string };

/**
 * One HTTP attempt against one candidate model.
 *
 * `asArray` asks the provider to fail over between the whole list internally,
 * which is one round trip instead of several.
 */
async function attempt(
  config: AiConfig,
  candidate: AiModel,
  options: ChatJsonOptions<z.ZodType>,
  asArray: boolean,
): Promise<AttemptOutcome> {
  const body: Record<string, unknown> = {
    ...(asArray
      ? {
          models: config.models
            .slice(0, OPENROUTER_MAX_ROUTED)
            .map((model) => model.id),
        }
      : { model: candidate.id }),
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 1200,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
  };

  // Free reasoning models burn their token budget (and our attempt deadline)
  // on hidden chain-of-thought before ever writing the JSON they were asked
  // for — measured live: 780+ reasoning tokens, answer truncated at the
  // token limit, every attempt timing out. These tasks are short structured
  // judgments, so thinking is disabled for the whole chain. Verified live on
  // OpenRouter that `reasoning: {enabled:false}` is accepted by every model
  // in this list and cuts a graded answer from timeout (>15 s) to ~3 s.
  body.reasoning = { enabled: false };

  // `response_format` only when the model itself declares support.
  if (!asArray && candidate.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await safeText(response);

      // A 400 naming response_format means this endpoint rejects JSON mode.
      // Drop it and let the same model try again rather than skipping it.
      if (response.status === 400 && "response_format" in body) {
        return { status: "next", message: "response_format rejected" };
      }

      const message = friendlyError(response.status, detail, options.locale ?? "en");
      // A daily-quota 429 is account-wide: no other model in the chain can
      // lift it, so walking the rest would only burn seconds of the budget.
      if (
        response.status === 429 &&
        (detail.includes("free-models-per-day") || detail.includes("free_tier_daily"))
      ) {
        return { status: "stop", message };
      }
      // 4xx (other than 429) mean this request will never succeed as written;
      // 429 and 5xx are worth trying against a different model.
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[skillbridge] model ${candidate.id} unavailable (${response.status}); trying next.`);
        return { status: "next", message };
      }
      return { status: "stop", message };
    }

    const payload = (await response.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    if (!content) {
      console.warn(`[skillbridge] model ${candidate.id} returned an empty response; trying next.`);
      return { status: "next", message: attemptMessage("empty", options.locale ?? "en") };
    }

    // Report which model actually answered — with array routing the provider
    // may have failed over internally without telling us which one it picked.
    return { status: "ok", content, model: payload.model ?? candidate.id };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const message = attemptMessage(aborted ? "timeout" : "network", options.locale ?? "en");
    console.warn(`[skillbridge] model ${candidate.id} failed (${message}); trying next.`);
    return { status: "next", message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the model for a JSON object and validate it against `schema`.
 * Returns a result object — never throws, never returns unvalidated data.
 *
 * Three resilience layers, in order:
 *  1. Provider-level failover — one request with the whole model list, so the
 *     provider retries internally on rate limits and downtime.
 *  2. Per-model retry — if the reply arrived but was unusable (unparseable or
 *     schema-invalid), walk the remaining models one at a time. A model that is
 *     merely bad at following the JSON contract gets skipped rather than
 *     failing the learner.
 *  3. Give up cleanly, and the caller uses the local rubric.
 */
export async function chatJson<S extends z.ZodType>(
  options: ChatJsonOptions<S>,
): Promise<ChatJsonResult<z.infer<S>>> {
  const config = getAiConfig();
  if (!config) return { ok: false, error: "No AI provider configured." };

  const candidates = config.models;
  const first = candidates[0];
  if (!first) return { ok: false, error: "No AI model configured." };

  let lastMessage = "AI provider unavailable.";

  // Whole-chain deadline. The client never aborts these requests, but Vercel
  // caps a serverless invocation, so the server must give up in time —
  // otherwise the learner sees a network error instead of the honest "scored
  // by the local rubric" notice. Budget: the first attempt's timeout plus a
  // reserve for the rest of the chain.
  const chainDeadline = Date.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS) + 25_000;

  const finish = (content: string, model: string): ChatJsonResult<z.infer<S>> | null => {
    const parsed = extractJson(content);
    if (parsed === undefined) {
      lastMessage = attemptMessage("unparseable", options.locale ?? "en");
      return null;
    }
    const validated = options.schema.safeParse(parsed);
    if (!validated.success) {
      console.warn(
        "[skillbridge] AI response failed schema validation:",
        validated.error.issues[0]?.message,
      );
      lastMessage = attemptMessage("schema", options.locale ?? "en");
      return null;
    }
    recordAiSuccess(model);
    return { ok: true, data: validated.data as z.infer<S>, raw: content, model };
  };

  // Layer 1 — native multi-model failover, when the provider supports it.
  if (config.modelArrayRouting && candidates.length > 1) {
    const outcome = await attempt(config, first, options, true);
    if (outcome.status === "ok") {
      const result = finish(outcome.content, outcome.model);
      if (result) return result;
      // A 200 with an unusable body is worth retrying model by model: a model
      // that ignores the JSON contract should be skipped, not fatal.
      console.warn("[skillbridge] chained reply was unusable; trying models individually.");
    } else if (outcome.status === "stop") {
      recordAiFailure(outcome.message);
      return { ok: false, error: outcome.message };
    } else {
      // A 429/5xx on the grouped request only means these first models are
      // saturated or the grouped route itself hiccuped — the rest of the chain
      // sits on different upstream infrastructure and may be perfectly free.
      // Keep the message as the last-resort error, then fall through to the
      // model-by-model walk below instead of giving up here.
      console.warn(`[skillbridge] grouped request failed (${outcome.message}); walking the chain individually.`);
      lastMessage = outcome.message;
    }
  }

  // Layer 2 — walk the chain one model at a time, inside the chain deadline.
  // Each attempt gets whatever time is left, so the total stays bounded even
  // when every model is slow.
  for (const candidate of candidates) {
    const remaining = chainDeadline - Date.now();
    if (remaining < 3_000) {
      console.warn("[skillbridge] chain deadline reached; falling back to the local engine.");
      break;
    }
    // No single attempt may eat the whole budget: cap it so at least two
    // models get their chance even when the first one hangs.
    const attemptOptions = {
      ...options,
      timeoutMs: Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, remaining, 25_000),
    };
    const outcome = await attempt(config, candidate, attemptOptions, false);

    if (outcome.status === "stop") {
      recordAiFailure(outcome.message);
      return { ok: false, error: outcome.message };
    }
    if (outcome.status === "next") {
      lastMessage = outcome.message;
      continue;
    }

    const result = finish(outcome.content, outcome.model);
    if (result) return result;
  }

  recordAiFailure(lastMessage);
  return { ok: false, error: lastMessage };
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
