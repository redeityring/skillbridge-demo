/**
 * The complete set of UI strings, typed.
 *
 * A single interface means the compiler enforces that every locale dictionary
 * provides every string — a missing translation is a type error, not a runtime
 * English fallback silently shown to a Russian learner.
 */

import type { GapLevel } from "@/lib/types";

export interface Dictionary {
  /* Shell */
  navLearn: string;
  navProgress: string;
  skipToContent: string;
  footerTagline: string;
  footerEvent: string;

  /* Engine badge */
  engineChecking: string;
  engineDemo: string;
  engineDemoTitle: string;
  engineLive: string;
  engineLiveTitle: string;
  engineLocal: string;
  engineLocalTitle: string;

  /* Reset button */
  resetRun: string;
  resetTitle: string;

  /* Locale switcher */
  language: string;

  /* Home */
  homeEyebrow: string;
  homeTitle1: string;
  homeTitleAccent: string;
  homeSubtitle: string;
  homeResume: string;
  homeStart: string;
  homeDemo: string;
  homeHint: string;
  homeHintDemoLead: string;
  homeHintDemoRest: string;
  homeYourLearning: string;
  homeViewProgress: string;
  homeNoResults: string;
  homeResultsNote: string;
  homeTopicsAssessed: (n: number, total: number) => string;
  homeStep1: string;
  homeStep1Body: string;
  homeStep2: string;
  homeStep2Body: string;
  homeStep3: string;
  homeStep3Body: string;
  homeInProgress: string;
  homeNotAssessed: string;
  homeRetake: string;
  homeAssess: string;
  homeApplication: string;
  homeApplicationWas: (n: number) => string;

  /* Diagnostic */
  diagLoadingTitle: string;
  diagLoadingMsg: string;
  startDiagnostic: string;
  chooseTopic: string;
  chooseTopicIntro: string;
  start: string;
  runDemoInstead: string;
  backHome: string;
  theory: string;
  application: string;
  demoNotice: string;
  skipToResults: string;
  chooseAnswer: string;
  answerRecorded: string;
  continueLabel: string;
  continueToApplication: string;
  answerScored: string;
  nextScenario: string;
  seeMyResults: string;
  appChallenge: string;
  placeholder: string;
  reasoningHelper: string;
  submitAnswer: string;
  pickStrongest: string;
  explainThenSubmit: string;

  /* Gap */
  gapLoadingTitle: string;
  gapLoadingMsg: string;
  yourResults: string;
  twoAbilities: string;
  bridgeTheGap: string;
  backToDiagnostic: string;
  alignedNote: string;
  wherePointsWent: string;
  scenariosScoredOn: string;
  youChose: string;
  bridgeComplete: string;
  measureAgainTitle: string;
  measureAgainBody: (n: number) => string;
  measureAgainNote: string;
  reassessApplication: string;
  backToGap: string;
  bridgeNoticeAI: string;
  bridgeNoticeBank: string;
  buildingPractice: string;
  targeting: (s: string) => string;
  writingScenario: string;
  calibrating: string;
  buildFailed: string;
  tryAgain: string;
  challenge: string;
  targetedPractice: string;
  needHint: string;
  checkAnswer: string;
  explainTradeOff: string;
  nextChallenge: (n: number) => string;
  finishBridge: string;

  /* Reassess */
  reassessEyebrow: string;
  reassessTitle: string;
  unseenScenario: string;
  sameConceptHelper: string;
  reassessScored: string;
  seeMyProgress: string;
  reassessLoadingTitle: string;
  reassessLoadingMsg: string;
  noReassessment: string;

  /* Progress */
  progressEyebrow: string;
  progressTitle: string;
  progressLoadingTitle: string;
  progressLoadingMsg: string;
  emptyRunNotFinished: string;
  emptyNoRun: string;
  emptyNothingYet: string;
  emptyDescription: string;
  finishTheRun: string;
  continueLearning: string;
  runAnother: string;
  measuredOnNew: string;
  applicationAbility: string;
  measuredAfterBridging: string;
  before: string;
  after: string;
  understanding: string;
  understandingVsApplication: string;
  deltaPositive: (delta: number, theory: string) => string;
  deltaNeutral: string;
  skills: string;
  skillsNote: string;
  skillsImproved: string;
  noSkillCrossed: (n: number) => string;
  bridgePracticeLabel: string;
  bridgeSkipped: string;
  gapAtDiagnosis: string;
  pts: string;
  /** Localized unit word for deltas, e.g. "pts" / "балл.". */
  ptsUnit: string;
  allTopics: string;
  realResults: string;
  runNotFinishedBody: string;
  comparisonLegend: (v: number, l: string) => string;
  questionOf: (s: number, t: number) => string;
  progressOf: (s: number, t: number) => string;

  /* Loading states */
  loadingAnalyzing: string;
  loadingReading: string;
  loadingComparing: string;
  loadingIdentifying: string;
  loadingSession: string;
  loadingRestoring: string;

  /* Feedback card */
  feedbackTitle: string;
  aiGraded: string;
  localRubric: string;
  whatWorked: string;
  whatToFix: string;
  howScoreBuilt: string;
  conceptRecognition: string;
  reasoning: string;
  contextApplication: string;

  /* Gap copy */
  gapLow: string;
  gapMedium: string;
  gapHigh: string;
  gapHeadlineLow: string;
  gapHeadlineMedium: string;
  gapHeadlineHigh: string;
  gapDetailLow: string;
  gapDetailMedium: string;
  gapDetailHigh: string;
  applicationGapLabel: string;
  pointsBetween: (n: number) => string;
  noGapBetween: string;
  conceptualUnderstanding: string;
  pointsShort: string;

  /* Rubric feedback templates (localized fallback engine) */
  rubricNotice: string;
  networkNotice: string;
  bankNotice: string;
  rubricStrongIdentified: string;
  rubricDefensible: string;
  rubricNamedKeyIdea: (s: string) => string;
  rubricCausal: string;
  rubricDeveloped: string;
  rubricTooShort: string;
  rubricMustEstablish: (s: string) => string;
  rubricTradeOffImplied: string;
  rubricDescribesNotEvaluates: string;
  rubricStrongerAlternative: string;
  rubricFeedbackStrong: (s: string) => string;
  rubricFeedbackSolid: (s: string) => string;
  rubricFeedbackNoReasoning: string;
  rubricFeedbackReread: string;
  rubricFeedbackDescribing: (s: string) => string;
}
