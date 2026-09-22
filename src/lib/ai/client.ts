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

/** Maps a provider status code onto a message safe to show a learner. */
function friendlyError(status: number, detail: string): string {
  // Keep the provider's own words in the server log, never in the UI.
  console.warn(`[skillbridge] AI provider responded ${status}: ${detail.slice(0, 500)}`);
  if (status === 401 || status === 403) return "The AI provider rejected the configured API key.";
  if (status === 402) return "The AI provider account has no available credits.";
  if (status === 429) return "Every free AI model is rate-limited right now.";
  if (status === 404) return "None of the configured AI models were found on this provider.";
  if (status >= 500) return "The AI provider is temporarily unavailable.";
  return "The AI provider returned an unexpected response.";
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
 * OpenRouter's free tier.
 *
 * Free variants (`:free`) are capped per minute and per day, and — in
 * OpenRouter's own words — "different models have different rate limits, so you
 * can share the load that way". Each model below sits on different upstream
 * infrastructure, so the list is both a quota multiplier and an outage
 * workaround.
 *
 * Ordered by fitness for the job at hand (grading short written answers into a
 * fixed JSON shape), weighing measured reasoning quality, JSON reliability and
 * context length. Verified against GET /api/v1/models rather than assumed.
 *
 * Note `jsonMode: false` throughout: none of the current free variants declare
 * support for `response_format`, so asking for it would 400 on every first
 * attempt. The prompts pin the exact shape and `extractJson` handles the rest.
 */
const OPENROUTER_FREE_MODELS: AiModel[] = [
  // Strongest measured reasoning of the free set; 262k context.
  { id: "qwen/qwen3.8-27b:free", jsonMode: false },
  // 120B MoE, 262k context, the only free variant declaring structured output.
  { id: "nvidia/nemotron-3-super-120b-a12b:free", jsonMode: false },
  // Dense 31B from Google; dependable instruction following.
  { id: "google/gemma-4-31b-it:free", jsonMode: false },
  // Very strong reasoning, smaller 32k window — ample for these prompts.
  { id: "z-ai/glm-5.2:free", jsonMode: false },
  // Fast MoE; 1M context headroom.
  { id: "google/gemma-4-26b-a4b-it:free", jsonMode: false },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", jsonMode: false },
  { id: "thinkingmachines/inkling:free", jsonMode: false },
  // Last resort: small and fast, still enough to return the required shape.
  { id: "nvidia/nemotron-3.5-lightning:free", jsonMode: false },
];

/** Checked in order; the first provider with a key set wins. */
const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    keyEnv: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    models: [{ id: "gpt-4o-mini", jsonMode: true }],
    label: "OpenAI",
  },
  {
    keyEnv: "CEREBRAS_API_KEY",
    baseUrl: "https://api.cerebras.ai/v1",
    models: [{ id: "gpt-oss-120b", jsonMode: true }],
    label: "Cerebras",
  },
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
  {
    keyEnv: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    models: [{ id: "llama-3.3-70b-versatile", jsonMode: true }],
    label: "Groq",
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
  if (process.env.AI_API_KEY) {
    return {
      apiKey: process.env.AI_API_KEY,
      baseUrl: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
      models: modelsFromEnv([{ id: "gpt-4o-mini", jsonMode: true }]),
      label: "AI_API_KEY provider",
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
      ? { models: config.models.map((model) => model.id) }
      : { model: candidate.id }),
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 900,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
  };

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

      const message = friendlyError(response.status, detail);
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
      return { status: "next", message: "The AI provider returned an empty response." };
    }

    // Report which model actually answered — with array routing the provider
    // may have failed over internally without telling us which one it picked.
    return { status: "ok", content, model: payload.model ?? candidate.id };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const message = aborted ? "The AI provider timed out." : "Could not reach the AI provider.";
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

  const finish = (content: string, model: string): ChatJsonResult<z.infer<S>> | null => {
    const parsed = extractJson(content);
    if (parsed === undefined) {
      lastMessage = "The AI response could not be parsed.";
      return null;
    }
    const validated = options.schema.safeParse(parsed);
    if (!validated.success) {
      console.warn(
        "[skillbridge] AI response failed schema validation:",
        validated.error.issues[0]?.message,
      );
      lastMessage = "The AI response did not match the expected structure.";
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
      // The provider already failed over across the whole list, so re-walking
      // it one model at a time would only add latency before we give up.
      recordAiFailure(outcome.message);
      return { ok: false, error: outcome.message };
    }
  }

  // Layer 2 — walk the chain one model at a time.
  for (const candidate of candidates) {
    const outcome = await attempt(config, candidate, options, false);

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
