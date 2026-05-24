/**
 * skillProgressTracker.ts
 *
 * Per-skill spaced-repetition state, persisted in localStorage alongside sessions.
 *
 * Status transitions:
 *   new → learning (first attempt)
 *   wrong → needs_repair (nextReviewAt = tomorrow)
 *   streakCorrect >= 2 → stable
 *   streakCorrect >= 4 AND practiced on >= 3 different days → mastered
 *   lastAttemptAt > 14 days ago + was stable/mastered → maintenance
 */

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type SkillProgressStatus =
  | "new"
  | "learning"
  | "needs_repair"
  | "stable"
  | "mastered"
  | "maintenance";

export type SkillProgress = {
  skillId: string;
  attempts: number;
  correct: number;
  wrong: number;
  streakCorrect: number;   // consecutive correct answers (resets on wrong)
  lastAttemptAt: string;   // ISO date string YYYY-MM-DD
  nextReviewAt: string;    // ISO date string YYYY-MM-DD (when to resurface)
  status: SkillProgressStatus;
  errorTypes: Record<string, number>; // errorType → count
  /** Distinct dates on which the skill was practiced correctly */
  correctDays: string[];
};

export type SkillRepairData = {
  whyWrong: string;   // short description of the error pattern
  howToFix: string;   // step-by-step fix
  miniExample: string; // small example illustrating the fix
  nextStep: string;   // what to do next in the app
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function newProgress(skillId: string): SkillProgress {
  const today = todayISO();
  return {
    skillId,
    attempts: 0,
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    lastAttemptAt: today,
    nextReviewAt: today,
    status: "new",
    errorTypes: {},
    correctDays: [],
  };
}

// ------------------------------------------------------------------
// Core update function
// ------------------------------------------------------------------

/**
 * Given a skill's current progress and whether the latest answer was correct,
 * returns a new SkillProgress object with updated counters and status.
 *
 * @param progress  - current SkillProgress (or undefined if first attempt)
 * @param isCorrect - whether the student answered correctly
 * @param errorType - optional error category (e.g. "no_common_denominator")
 */
export function updateSkillProgress(
  progress: SkillProgress | undefined,
  isCorrect: boolean,
  errorType?: string
): SkillProgress {
  const today = todayISO();
  const base = progress ?? newProgress("unknown");

  const updated: SkillProgress = {
    ...base,
    attempts: base.attempts + 1,
    correct: isCorrect ? base.correct + 1 : base.correct,
    wrong: isCorrect ? base.wrong : base.wrong + 1,
    lastAttemptAt: today,
    errorTypes: { ...base.errorTypes },
    correctDays: [...base.correctDays],
  };

  // Track error types
  if (!isCorrect && errorType) {
    updated.errorTypes[errorType] = (updated.errorTypes[errorType] ?? 0) + 1;
  }

  if (isCorrect) {
    updated.streakCorrect = base.streakCorrect + 1;
    // Track distinct correct days
    if (!updated.correctDays.includes(today)) {
      updated.correctDays.push(today);
    }
    // Next review: stay accessible today, but schedule further in the future as skill improves
    const intervalDays =
      updated.streakCorrect >= 8 ? 14 :
      updated.streakCorrect >= 6 ? 7  :
      updated.streakCorrect >= 4 ? 3  :
      updated.streakCorrect >= 2 ? 2  : 1;
    updated.nextReviewAt = addDays(today, intervalDays);
  } else {
    // Wrong: reset streak, schedule review for tomorrow
    updated.streakCorrect = 0;
    updated.nextReviewAt = addDays(today, 1);
  }

  // Status transitions
  const distinctCorrectDays = updated.correctDays.length;
  updated.status = computeStatus(updated, distinctCorrectDays);

  return updated;
}

function computeStatus(p: SkillProgress, distinctCorrectDays: number): SkillProgressStatus {
  if (p.attempts === 0) return "new";

  // Was stable/mastered but hasn't been practiced in >14 days → maintenance
  if (
    (p.status === "stable" || p.status === "mastered") &&
    daysBetween(p.lastAttemptAt, todayISO()) > 14
  ) {
    return "maintenance";
  }

  // Still needs repair if streak is 0 after multiple attempts
  if (p.wrong > 0 && p.streakCorrect === 0) return "needs_repair";

  // Mastered: high streak, practiced on many different days
  if (p.streakCorrect >= 4 && distinctCorrectDays >= 3 && p.correct >= 6) return "mastered";

  // Stable: consistent correct answers
  if (p.streakCorrect >= 2 && p.correct >= 3) return "stable";

  // Needs repair: recent errors
  if (p.wrong > 0 && p.streakCorrect < 2) return "needs_repair";

  // Still learning
  return "learning";
}

// ------------------------------------------------------------------
// Batch update from a session
// ------------------------------------------------------------------

export type SessionSkillResult = {
  skillId: string;
  isCorrect: boolean;
  errorType?: string;
};

/**
 * Process all skill results from a finished session and return updated map.
 */
export function updateSkillProgressFromSession(
  current: Record<string, SkillProgress>,
  results: SessionSkillResult[]
): Record<string, SkillProgress> {
  const updated = { ...current };
  for (const { skillId, isCorrect, errorType } of results) {
    updated[skillId] = updateSkillProgress(updated[skillId], isCorrect, errorType);
  }
  return updated;
}

// ------------------------------------------------------------------
// Query helpers
// ------------------------------------------------------------------

/**
 * Skills that are due for review today (nextReviewAt <= today).
 */
export function getSkillsDueForReview(
  progressMap: Record<string, SkillProgress>
): SkillProgress[] {
  const today = todayISO();
  return Object.values(progressMap).filter(
    (p) => p.status === "needs_repair" || p.status === "maintenance" ||
           (p.status === "learning" && p.nextReviewAt <= today)
  );
}

/**
 * Skills to prioritize in the next session, sorted by urgency.
 */
export function getPrioritySkills(
  progressMap: Record<string, SkillProgress>
): SkillProgress[] {
  const today = todayISO();
  return Object.values(progressMap)
    .filter((p) => p.nextReviewAt <= today || p.status === "needs_repair")
    .sort((a, b) => {
      // needs_repair first, then maintenance, then by nextReviewAt
      const statusPriority: Record<SkillProgressStatus, number> = {
        needs_repair: 0, maintenance: 1, learning: 2,
        new: 3, stable: 4, mastered: 5,
      };
      const pa = statusPriority[a.status] ?? 9;
      const pb = statusPriority[b.status] ?? 9;
      if (pa !== pb) return pa - pb;
      return a.nextReviewAt.localeCompare(b.nextReviewAt);
    });
}

/**
 * 0–100 readiness score for ingreso, based on skill mastery across topics.
 * Uses the fracciones + divisibilidad ingreso skills as primary signals.
 */
export function computeIngressoReadiness(
  progressMap: Record<string, SkillProgress>
): number {
  const ingressoSkills = [
    "fraction-add-diff-den",
    "fraction-sub-diff-den",
    "fraction-mul",
    "fraction-div",
    "divisibility-prime-factor",
    "divisibility-gcd",
    "divisibility-lcm",
    "divisibility-conditions",
    "fraction-compare",
    "fraction-equivalent",
    "reverse-percent",
    "compound-area",
  ];

  const weightMap: Record<string, number> = {
    fraction_add_diff_den: 15,
    fraction_sub_diff_den: 15,
    fraction_mul: 12,
    fraction_div: 12,
    divisibility_prime_factor: 10,
    divisibility_gcd: 8,
    divisibility_lcm: 8,
    divisibility_conditions: 8,
    fraction_compare: 6,
    fraction_equivalent: 6,
  };

  const statusScore: Record<SkillProgressStatus, number> = {
    mastered: 1.0,
    stable: 0.75,
    learning: 0.4,
    needs_repair: 0.1,
    maintenance: 0.6,
    new: 0.0,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const skillId of ingressoSkills) {
    const weight = weightMap[skillId.replace(/-/g, "_")] ?? 5;
    const progress = progressMap[skillId];
    const score = progress ? (statusScore[progress.status] ?? 0) : 0;
    totalWeight += weight;
    weightedScore += weight * score;
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedScore / totalWeight) * 100);
}

/**
 * Extract skill results from a session's wrongSkillTags and practicedSkillTags.
 */
export function extractSessionSkillResults(session: {
  wrongSkillTags: string[];
  practicedSkillTags?: string[];
}): SessionSkillResult[] {
  const wrongSet = new Set(session.wrongSkillTags);
  const allSkills = new Set([
    ...(session.practicedSkillTags ?? []),
    ...session.wrongSkillTags,
  ]);
  return Array.from(allSkills).map((skillId) => ({
    skillId,
    isCorrect: !wrongSet.has(skillId),
    errorType: wrongSet.has(skillId) ? "incorrect" : undefined,
  }));
}
