/**
 * Shared domain types for SkillBridge.
 *
 * The whole product is built around one loop:
 *   DIAGNOSE -> DETECT GAP -> BRIDGE -> REASSESS -> SHOW PROGRESS
 *
 * Everything below describes the data that travels through that loop.
 */

export type SubjectId = "economics";

export type TopicId = "opportunity-cost" | "supply-and-demand" | "inflation";

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

/** Multiple-choice question used to measure conceptual understanding. */
export interface TheoryQuestion {
  id: string;
  topicId: TopicId;
  /** Short label of the micro-skill this question probes. */
  skill: string;
  prompt: string;
  options: TheoryOption[];
  /** Shown after answering, so the learner closes the loop even when correct. */
  explanation: string;
}

export interface TheoryOption {
  id: string;
  label: string;
  correct?: boolean;
}

/**
 * Application options carry partial credit instead of a boolean: picking a
 * defensible-but-weaker alternative should not score the same as a wrong one.
 * `credit` is a 0..1 fraction of "concept recognition".
 */
export interface ApplicationOption {
  id: string;
  label: string;
  credit: number;
}

/**
 * A transparent rubric. It is used twice:
 *  - sent to the AI as the grading contract (structured, not free-form),
 *  - used locally by the deterministic fallback evaluator when AI is down.
 */
export interface Rubric {
  /** Ideas a strong answer should name. */
  concepts: string[];
  /** Reasoning moves a strong answer should make. */
  reasoningSignals: string[];
  /** The single thing a complete answer must contain. */
  mustMention: string;
}

/** A scenario-based task: pick a defensible choice, then justify it. */
export interface ApplicationQuestion {
  id: string;
  topicId: TopicId;
  /** Micro-skill measured, e.g. "Identifying the sacrificed alternative". */
  skill: string;
  title: string;
  scenario: string;
  /** Extra facts rendered as a compact list to keep the scenario scannable. */
  constraints: string[];
  decisionPrompt: string;
  options: ApplicationOption[];
  reasoningPrompt: string;
  rubric: Rubric;
  /** A model answer, revealed only in the results/debrief context. */
  exemplar: string;
}

export type BridgeDifficulty = "foundation" | "standard" | "stretch";

/** A targeted practice task, either AI-generated or drawn from the bank. */
export interface BridgeExercise {
  id: string;
  topicId: TopicId;
  skill: string;
  difficulty: BridgeDifficulty;
  scenario: string;
  decisionPrompt: string;
  options: ApplicationOption[];
  reasoningPrompt: string;
  rubric: Rubric;
  hint: string;
}

export interface Topic {
  id: TopicId;
  subject: SubjectId;
  subjectLabel: string;
  title: string;
  tagline: string;
  blurb: string;
  theoryQuestions: TheoryQuestion[];
  /** Index 0..n-2 are used for the diagnostic, the tail for reassessment. */
  applicationQuestions: ApplicationQuestion[];
  bridgeBank: BridgeExercise[];
}

/* -------------------------------------------------------------------------- */
/* Answers & evaluation                                                       */
/* -------------------------------------------------------------------------- */

export interface AnswerInput {
  optionId: string | null;
  reasoning: string;
}

/** Which engine actually produced a score. Shown in the UI — never hidden. */
export type EngineKind = "ai" | "rubric";

/** Transparent, weighted sub-scores. All values are 0..100. */
export interface EvaluationBreakdown {
  /** Did the learner recognise which concept/alternative applies? */
  conceptRecognition: number;
  /** Is the reasoning explicit and correct? */
  reasoning: number;
  /** Is the concept actually used on this scenario's specifics? */
  contextApplication: number;
}

export interface AnswerEvaluation {
  /** Weighted composite of `breakdown`. */
  score: number;
  breakdown: EvaluationBreakdown;
  strengths: string[];
  weaknesses: string[];
  /** Short, actionable, at most a couple of sentences. */
  feedback: string;
  /** Present when the local rubric produced the score because AI was unavailable. */
  engine: EngineKind;
  /** Human-readable reason the AI path was not used (rate limit, timeout, ...). */
  notice?: string;
}

/* -------------------------------------------------------------------------- */
/* Gap analysis                                                               */
/* -------------------------------------------------------------------------- */

export type GapLevel = "low" | "medium" | "high";

export interface GapAnalysis {
  theoryScore: number;
  applicationScore: number;
  /** theoryScore - applicationScore, in points. */
  gap: number;
  level: GapLevel;
  headline: string;
  detail: string;
}

/* -------------------------------------------------------------------------- */
/* Session / progress                                                         */
/* -------------------------------------------------------------------------- */

/** One finished run, kept so the home screen can show real history. */
export interface TopicProgress {
  runId: string;
  topicId: TopicId;
  theoryScore: number;
  applicationScore: number;
  /** Application score after bridging. Null while a run is still open. */
  afterScore: number | null;
  gapLevel: GapLevel;
  completedAt: string;
}

export interface BridgeAttempt {
  answer: AnswerInput;
  evaluation: AnswerEvaluation;
  exercise: BridgeExercise;
}

export type Phase =
  | "idle"
  | "theory"
  | "application"
  | "gap"
  | "bridge"
  | "reassess"
  | "progress";

export interface SessionState {
  /** Bumped on breaking shape changes so stale localStorage is discarded. */
  version: number;
  runId: string;
  topicId: TopicId | null;
  demoMode: boolean;

  theoryAnswers: Record<string, AnswerInput>;
  applicationAnswers: Record<string, AnswerInput>;
  applicationEvaluations: Record<string, AnswerEvaluation>;

  gap: GapAnalysis | null;

  bridgeExercises: BridgeExercise[];
  bridgeAttempts: BridgeAttempt[];
  /** True once the learner opts into one extra, harder challenge. */
  bridgeComplete: boolean;

  /** Reassessment uses unseen scenarios from the same topic. */
  reassessmentQuestionIds: string[];
  reassessmentAnswers: Record<string, AnswerInput>;
  reassessmentEvaluations: Record<string, AnswerEvaluation>;

  beforeScore: number | null;
  afterScore: number | null;

  /** Finished runs, newest last. Drives "Your Learning" on the home screen. */
  history: TopicProgress[];
}
