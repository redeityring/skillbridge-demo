/**
 * UI copy — English.
 *
 * Everything a learner reads outside of question content lives here. Question
 * content is localized in the content bank, not in this dictionary.
 */

import type { Dictionary } from "@/lib/i18n/types";

export const en: Dictionary = {
  /* Navigation / shell */
  navLearn: "Learn",
  navProgress: "Progress",
  skipToContent: "Skip to content",
  footerTagline: "From knowing to applying.",
  footerEvent: "Built for VentureHack 2026 · EduTech track",

  /* Engine badge */
  engineChecking: "Checking engine…",
  engineDemo: "Demo mode",
  engineDemoTitle:
    "Demo mode: the answers are scripted, but the engine is real — AI first, local rubric fallback.",
  engineLive: "Live AI",
  engineLiveTitle: "Answers are graded live by the AI provider's model.",
  engineLocal: "Local rubric engine",
  engineLocalTitle:
    "AI is temporarily unavailable, so answers are scored locally by the transparent rubric engine.",

  /* Reset button */
  resetRun: "Reset run",
  resetTitle: "Clear this run and start again. Completed results stay in Progress.",

  /* Locale switcher */
  language: "Language",

  /* Home */
  homeEyebrow: "Economics · diagnostic",
  homeTitle1: "From knowing to",
  homeTitleAccent: "applying.",
  homeSubtitle:
    "SkillBridge measures the gap between what you understand and what you can actually apply — then builds the practice that closes it.",
  homeResume: "Resume diagnostic",
  homeStart: "Start Diagnostic",
  homeDemo: "Run demo",
  homeHint:
    "The diagnostic takes about two minutes: four theory questions, then three application scenarios.",
  homeHintDemoLead: "Run demo",
  homeHintDemoRest:
    " uses scripted answers so the whole loop can be shown in under a minute.",
  homeYourLearning: "Your learning",
  homeViewProgress: "View progress",
  homeNoResults: "Nothing assessed yet. Your results appear here after a diagnostic.",
  homeResultsNote: "Scores are your own results.",
  homeTopicsAssessed: (n, total) => `${n} of ${total} topics assessed.`,
  homeStep1: "Measure",
  homeStep1Body:
    "Theory questions and application scenarios are scored separately, so the two abilities never blur together.",
  homeStep2: "Detect the gap",
  homeStep2Body:
    "SkillBridge compares the two scores and isolates which micro-skills the learner cannot yet transfer.",
  homeStep3: "Bridge it",
  homeStep3Body:
    "Targeted practice is generated for exactly those skills, then application is re-measured on a new scenario.",
  homeInProgress: "In progress",
  homeNotAssessed: "Not assessed",
  homeRetake: "Retake",
  homeAssess: "Assess",
  homeApplication: "application",
  homeApplicationWas: (n) => `application · was ${n}%`,

  /* Diagnostic */
  diagLoadingTitle: "Loading your session…",
  diagLoadingMsg: "Restoring your answers…",
  startDiagnostic: "Start diagnostic",
  chooseTopic: "Choose a topic",
  chooseTopicIntro:
    "Each diagnostic takes about two minutes: four theory questions, then three application scenarios that test whether you can transfer the concept to a new situation.",
  start: "Start",
  runDemoInstead: "Run demo instead",
  backHome: "Back home",
  theory: "theory",
  application: "application",
  demoNotice:
    "Demo mode — answers are scripted, but scored by the real engine (AI first, local rubric fallback).",
  skipToResults: "Skip to results",
  chooseAnswer: "Choose an answer",
  answerRecorded: "Answer recorded. Continue when ready.",
  continueLabel: "Continue",
  continueToApplication: "Continue to application",
  answerScored: "Answer scored",
  nextScenario: "Next scenario",
  seeMyResults: "See my results",
  appChallenge: "Application challenge",
  placeholder: "Two or three sentences is enough.",
  reasoningHelper:
    "Your reasoning is what SkillBridge measures — not just your choice.",
  submitAnswer: "Submit answer",
  pickStrongest: "Pick the alternative you think is strongest.",
  explainThenSubmit: "Explain your reasoning, then submit.",

  /* Gap */
  gapLoadingTitle: "Calculating your gap…",
  gapLoadingMsg: "Comparing your answers…",
  yourResults: "Your results",
  twoAbilities: "Two abilities, measured separately on the same concept.",
  bridgeTheGap: "Bridge the gap",
  backToDiagnostic: "Back to diagnostic",
  alignedNote:
    "Understanding and application already align — bridge practice is optional.",
  wherePointsWent: "Where the points went",
  scenariosScoredOn:
    "application scenarios, scored on concept recognition, reasoning and context application.",
  youChose: "You chose: ",
  bridgeComplete: "Bridge complete",
  measureAgainTitle: "Now let's measure it again",
  measureAgainBody: (n) =>
    `You practised ${n} task${n === 1 ? "" : "s"}. The next step uses scenarios you have not seen, so the improvement is measured — not assumed.`,
  // (Legacy duplicate of the sentence above, kept only as an unused key.)
  measureAgainNote:
    "The next step uses scenarios you have not seen, so the improvement is measured — not assumed.",
  reassessApplication: "Reassess my application",
  backToGap: "Back to gap analysis",
  bridgeNoticeAI:
    "Practice generated for the skills that lost points in your diagnostic.",
  bridgeNoticeBank:
    "Practice selected from the curated bank for the skills that lost points in your diagnostic.",
  buildingPractice: "Building your practice…",
  targeting: (s) => `Targeting: ${s}…`,
  writingScenario: "Writing a new scenario…",
  calibrating: "Calibrating the difficulty…",
  buildFailed: "Could not build practice tasks. You can still be reassessed.",
  tryAgain: "Try again",
  challenge: "Challenge",
  targetedPractice: "Targeted practice",
  needHint: "Need a hint?",
  checkAnswer: "Check answer",
  explainTradeOff: "Now explain the trade-off in your own words.",
  nextChallenge: (n) => `Next challenge (${n} left)`,
  finishBridge: "Finish bridge practice",

  /* Reassess */
  reassessEyebrow: "Reassessment · new scenarios",
  reassessTitle: "again",
  unseenScenario: "Unseen scenario",
  sameConceptHelper:
    "Same concept, new setting — this is what measures transfer.",
  reassessScored: "Reassessment scored",
  seeMyProgress: "See my progress",
  reassessLoadingTitle: "Loading reassessment…",
  reassessLoadingMsg: "Restoring your session…",
  noReassessment: "No reassessment available. Complete a diagnostic first.",

  /* Progress */
  progressEyebrow: "Progress",
  progressTitle: "Your progress",
  progressLoadingTitle: "Loading your progress…",
  progressLoadingMsg: "Reading your results…",
  emptyRunNotFinished: "This run is not finished yet",
  emptyNoRun: "No run in progress",
  emptyNothingYet: "No completed run yet",
  emptyDescription:
    "The before-and-after comparison appears after a full loop: diagnostic, gap analysis, bridge practice and reassessment. It needs the reassessment, so both scores describe the same concept.",
  finishTheRun: "Finish the run",
  continueLearning: "Continue learning",
  runAnother: "Run another diagnostic",
  measuredOnNew:
    "The diagnostic and the reassessment used different scenarios. The change below is the measured difference, not a repeat of the same questions.",
  applicationAbility: "Application ability",
  measuredAfterBridging: "Measured on a new scenario after bridging",
  before: "Before",
  after: "After",
  understanding: "Understanding",
  understandingVsApplication: "Understanding vs. application",
  deltaPositive: (delta, theory) =>
    `Application moved ${delta > 0 ? "+" : ""}${delta} points while understanding stayed at ${theory}.`,
  deltaNeutral: "Your scores were measured on the same concept.",
  skills: "Skills",
  skillsNote:
    "Listed only when a skill you lost points on now holds up on a new scenario.",
  skillsImproved: "Skills improved",
  noSkillCrossed: (n) =>
    `No skill crossed the ${n}-point threshold yet. Bridge practice targets the gaps that cost the most points — running it again will move them.`,
  bridgePracticeLabel: "Bridge practice",
  bridgeSkipped: "Bridge practice was skipped in this run.",
  gapAtDiagnosis: "Gap at diagnosis",
  pts: "pts",
  ptsUnit: "pts",
  allTopics: "All assessed topics",
  realResults: "Real results from this browser. Nothing is estimated.",
  runNotFinishedBody: "The before-and-after comparison appears after a full loop.",
  comparisonLegend: (v, l) => `Dashed line = ${l} (${v}%)`,
  questionOf: (s, t) => `Question ${s} of ${t}`,
  progressOf: (s, t) => `Progress: question ${s} of ${t}`,

  /* Loading states */
  loadingAnalyzing: "Analyzing your application…",
  loadingReading: "Reading your reasoning…",
  loadingComparing: "Comparing it against the concept…",
  loadingIdentifying: "Identifying what to practise next…",
  loadingSession: "Loading your session…",
  loadingRestoring: "Restoring your answers…",

  /* Feedback card */
  feedbackTitle: "Feedback",
  aiGraded: "AI graded",
  localRubric: "Local rubric",
  whatWorked: "What worked",
  whatToFix: "What to fix",
  howScoreBuilt: "How this score was built",
  conceptRecognition: "Concept recognition",
  reasoning: "Reasoning",
  contextApplication: "Context application",

  /* Gap copy */
  gapLow: "Low",
  gapMedium: "Medium",
  gapHigh: "High",
  gapHeadlineLow: "Understanding and application are aligned",
  gapHeadlineMedium: "Application gap detected",
  gapHeadlineHigh: "High application gap",
  gapDetailLow:
    "Your reasoning holds up in unfamiliar scenarios too. Keep stretching with harder cases.",
  gapDetailMedium:
    "You understand the concept, but your reasoning thins out once the scenario changes.",
  gapDetailHigh:
    "You understand the concept, but applying it to unfamiliar situations is still challenging.",
  applicationGapLabel: "Application gap",
  pointsBetween: (n) => `${n} points between knowing and applying`,
  noGapBetween: "no gap between knowing and applying",
  conceptualUnderstanding: "Conceptual understanding",
  pointsShort: "points",

  /* Rubric engine feedback templates */
  rubricNotice:
    "Scored by the local rubric engine — no AI grader was used for this answer.",
  networkNotice:
    "Could not reach the grading service. Scored locally with the rubric engine.",
  bankNotice:
    "Could not reach the practice generator. Using the curated practice bank.",
  rubricStrongIdentified:
    "You identified the alternative the concept actually points to.",
  rubricDefensible: "Your choice is defensible, even though a stronger option existed.",
  rubricNamedKeyIdea: (s) => `You named the key idea: ${s}.`,
  rubricCausal:
    "You explained cause and effect instead of only stating a conclusion.",
  rubricDeveloped:
    "You developed the answer far enough for the reasoning to be checkable.",
  rubricTooShort: "The reasoning is too short to show how the concept was applied.",
  rubricMustEstablish: (s) => `A complete answer has to establish this: ${s}.`,
  rubricTradeOffImplied: "The trade-off is implied but never explained in words.",
  rubricDescribesNotEvaluates:
    "The answer describes the situation without evaluating the alternatives.",
  rubricStrongerAlternative: "A stronger alternative was available for this scenario.",
  rubricFeedbackStrong: (s) =>
    `Strong application. You applied the concept to this scenario rather than restating it, and your reasoning established what mattered: ${s}.`,
  rubricFeedbackSolid: (s) =>
    `Solid reasoning. To push it higher, make this explicit in a sentence of its own: ${s}.`,
  rubricFeedbackNoReasoning:
    "The choice is there, but the reasoning is not. Write two sentences: what was given up, and why that matters in this situation.",
  rubricFeedbackReread:
    'Re-read the scenario and ask "what was given up when this decision was made?" — then apply the concept to that specific alternative.',
  rubricFeedbackDescribing: (s) =>
    `You are describing the situation instead of applying the concept to it. A strong answer establishes this: ${s}.`,
};
