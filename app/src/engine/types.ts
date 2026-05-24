import type { LocalizedText } from "../i18n/types";

export type QuestionType = "multiple_choice" | "numeric_input" | "true_false";

/** Collectible rarity of a question card. Optional - derived from difficulty if absent. */
export type CardRarity = "common" | "rare" | "epic" | "mythic" | "legend";

/** Gameplay flavour of a question card. Optional - defaults to "training". */
export type CardType =
  | "training"
  | "trick"
  | "speed"
  | "explain"
  | "visual"
  | "boss"
  | "comeback";

/**
 * Procedural generator descriptor. When present, the question text/answer/
 * explanation are built at runtime from a template instead of static content.
 * See engine/generator.ts.
 */
export type QuestionGenerator = {
  /** Template id, e.g. "add", "sub", "mul". */
  template: string;
};

/**
 * Placeholder for future card/pack reward delivery.
 * No logic attached yet - fields will be populated when the Football Academy
 * reward system is implemented.
 */
export type RewardPlaceholder = {
  /** Type of reward to deliver. */
  kind: "card_pack" | "skill_badge" | "xp_bonus";
  /** How many units (packs, badges, XP points). */
  amount: number;
  /** Optional: restrict to a specific card series / pack tier. */
  seriesId?: string;
};

export type Question = {
  id: string;
  topicId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: QuestionType;
  prompt: LocalizedText;
  options?: LocalizedText[];
  answer: string;
  explanation: LocalizedText;
  hint?: LocalizedText;
  commonMistake?: LocalizedText;
  skillTags: string[];
  verified: boolean;
  /** Collectible layer (Football Academy). Optional, backward compatible. */
  rarity?: CardRarity;
  cardType?: CardType;
  /** XP awarded when this question is answered correctly. Defaults to 10 if absent. */
  xp?: number;
  /** Whether this question can appear in a card pack drop. Defaults to true. */
  packEligible?: boolean;
  /** If set, this question was produced by the procedural generator. */
  generator?: QuestionGenerator;
};

export type Topic = {
  id: string;
  level: "A" | "B" | "C";
  title: LocalizedText;
  summary: LocalizedText;
  lessonText: LocalizedText;
  parentSummary: LocalizedText;
};

export type StudySession = {
  id: string;
  topicId: string;
  startedAt: string;
  endedAt?: string;
  totalSeconds: number;
  activeSeconds: number;
  blurSeconds: number;
  idleSeconds: number;
  focusLossCount: number;
  pauseCount: number;
  questionsAnswered: number;
  correctAnswers: number;
  hintsUsed: number;
  wrongSkillTags: string[];
  wrongQuestionIds: string[];
  skillOutcomes?: Record<string, { attempts: number; correct: number; wrong: number }>;
  practicedSkillTags?: string[];
  missionSkillId?: string;
  missionKind?: "new" | "repair" | "consolidate" | "challenge" | "maintenance" | "boss";
  /** Total XP earned in this session (sum of xp per correct question). */
  xpEarned?: number;
  /**
   * Reward to deliver at session end (e.g. card pack for completing a mission).
   * Populated by future reward engine - not consumed by any UI yet.
   */
  missionReward?: RewardPlaceholder;
  /**
   * Reward triggered by a skill reaching a mastery threshold during this session.
   * Populated by future reward engine - not consumed by any UI yet.
   */
  skillMasteryReward?: RewardPlaceholder;
};
