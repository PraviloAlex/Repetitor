import type { StudySession } from "../engine/types";
import type { Language } from "../i18n/types";
import type { SkillProgress } from "../engine/skillProgressTracker";
import { updateSkillProgressFromSession, extractSessionSkillResults, computeIngressoReadiness } from "../engine/skillProgressTracker";
import { recordSessionKaizen } from "../engine/kaizenProgress";

const STORAGE_KEY = "prepamate6:v1";
const SCHEMA_VERSION = 1;

// Max wrong questions kept in the review queue (FIFO trim)
const MAX_REVIEW_QUEUE = 30;

// Valid promo codes → activate premium (hardcoded, no backend needed for pilot)
const VALID_PROMO_CODES = ["INGRESO2027"];

export type ParentSettings = {
  pinHash?: string;
  childNick?: string;
  grade?: "6" | "7" | "ingreso";
  dailyGoalMinutes?: 10 | 15 | 20 | 30;
  language?: Language;
  // Onboarding
  onboardingDone?: boolean;
  level?: "A" | "B" | "C";
  goal?: "secundaria" | "ingreso" | "refuerzo";
  mode?: "primaria" | "ingreso";
  // Premium
  isPremium?: boolean;
  promoCodeUsed?: string;
};

export type ProgressState = {
  storageSchemaVersion: number;
  sessions: StudySession[];
  topicAccuracy: Record<string, { correct: number; total: number }>;
  streak: { count: number; lastSessionDate?: string };
  parent: ParentSettings;
  reviewQueue: string[];
  /**
   * Spaced-repetition schedule for individual questions.
   * Key = questionId, value = ISO date (YYYY-MM-DD) when due.
   * Questions not yet due are hidden from the review badge and ReviewSession.
   */
  reviewSchedule: Record<string, string>;
  /** Per-skill spaced-repetition state. Key = skillId. */
  skillProgress: Record<string, SkillProgress>;
};

function emptyState(): ProgressState {
  return {
    storageSchemaVersion: SCHEMA_VERSION,
    sessions: [],
    topicAccuracy: {},
    streak: { count: 0 },
    parent: {},
    reviewQueue: [],
    reviewSchedule: {},
    skillProgress: {},
  };
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as ProgressState;
    if (!parsed.storageSchemaVersion) return emptyState();
    if (!parsed.reviewQueue) parsed.reviewQueue = [];
    if (!parsed.reviewSchedule) parsed.reviewSchedule = {};
    if (!parsed.skillProgress) parsed.skillProgress = {};
    return parsed;
  } catch (e) {
    console.warn("Failed to read local progress, resetting.", e);
    return emptyState();
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save local progress.", e);
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function recordSession(session: StudySession): ProgressState {
  const state = loadProgress();
  const today = todayKey();
  state.sessions.push(session);

  const acc = state.topicAccuracy[session.topicId] ?? { correct: 0, total: 0 };
  acc.correct += session.correctAnswers;
  acc.total += session.questionsAnswered;
  state.topicAccuracy[session.topicId] = acc;

  if (session.wrongQuestionIds?.length) {
    const existing = new Set(state.reviewQueue);
    for (const id of session.wrongQuestionIds) {
      existing.add(id);
      // Spaced repetition: first miss → tomorrow (+1d); each subsequent miss doubles
      // up to a cap of 7 days.
      const prev = state.reviewSchedule[id];
      if (!prev) {
        state.reviewSchedule[id] = addDays(today, 1);
      } else {
        // Already scheduled → failed again. Extend: 1→2→4→7 days
        const prevInterval = Math.max(1, diffDays(today, prev));
        const nextInterval = Math.min(prevInterval * 2, 7);
        state.reviewSchedule[id] = addDays(today, nextInterval);
      }
    }
    state.reviewQueue = Array.from(existing).slice(-MAX_REVIEW_QUEUE);
  }

  // Update per-skill spaced-repetition progress
  const skillResults = extractSessionSkillResults(session);
  state.skillProgress = updateSkillProgressFromSession(state.skillProgress, skillResults);

  // Record kaizen progress point
  const readiness = computeIngressoReadiness(state.skillProgress);
  const sessionAccuracy = session.questionsAnswered > 0
    ? Math.round((session.correctAnswers / session.questionsAnswered) * 100)
    : 0;
  const minutesStudied = Math.round((session.activeSeconds ?? 0) / 60);
  recordSessionKaizen(readiness, sessionAccuracy, minutesStudied);

  const last = state.streak.lastSessionDate;
  if (!last) {
    state.streak = { count: 1, lastSessionDate: today };
  } else {
    const d = diffDays(last, today);
    if (d === 0) {
      // same day — no change
    } else if (d === 1) {
      state.streak = { count: state.streak.count + 1, lastSessionDate: today };
    } else {
      state.streak = { count: 1, lastSessionDate: today };
    }
  }

  saveProgress(state);
  return state;
}

/**
 * Returns question IDs that are due today or overdue.
 * Use this for the review badge count and for loading ReviewSession.
 */
export function getOverdueReviewIds(state: ProgressState): string[] {
  const today = todayKey();
  return state.reviewQueue.filter((id) => {
    const dueAt = state.reviewSchedule[id];
    // No schedule entry = legacy data → treat as due immediately
    return !dueAt || dueAt <= today;
  });
}

export function removeFromReviewQueue(ids: string[]): ProgressState {
  const state = loadProgress();
  const toRemove = new Set(ids);
  state.reviewQueue = state.reviewQueue.filter((id) => !toRemove.has(id));
  for (const id of toRemove) {
    delete state.reviewSchedule[id];
  }
  saveProgress(state);
  return state;
}

export function setParentSettings(patch: Partial<ParentSettings>): ProgressState {
  const state = loadProgress();
  state.parent = { ...state.parent, ...patch };
  saveProgress(state);
  return state;
}

/** Returns true if the promo code is valid and activates premium. */
export function redeemPromoCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (!VALID_PROMO_CODES.includes(normalized)) return false;
  setParentSettings({ isPremium: true, promoCodeUsed: normalized });
  return true;
}

export function getSessionById(id: string): StudySession | undefined {
  const state = loadProgress();
  return state.sessions.find((s) => s.id === id);
}

// Naive non-cryptographic hash, sufficient for a local 4-digit PIN gate.
export function hashPin(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (h * 31 + pin.charCodeAt(i)) | 0;
  }
  return String(h);
}
