import type { LocalizedText } from "../i18n/types";
import { getSkillTitleRu, getSkillRepairRu } from "../i18n/skillLabels";
import { STRINGS } from "../i18n/strings";
import type { ProgressState } from "../storage/localProgress";
import { getMasteryForTopic, type SkillMastery, type SkillMasteryStatus } from "./skillMastery";
import { SKILLS_BY_ID } from "./skills";
import { getSkillsDueForReview } from "./skillProgressTracker";

/** Подставляет {key} плейсхолдеры в строку. */
function interp(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/**
 * Строит LocalizedText из ключа STRINGS.
 * esVars — переменные для ES строки (например, название навыка на испанском).
 * ruVars — переменные для RU строки; если не задано, используются esVars.
 */
function lt(
  key: keyof typeof STRINGS.ru,
  esVars: Record<string, string> = {},
  ruVars?: Record<string, string>
): LocalizedText {
  const esStrings = STRINGS.es as Record<string, string>;
  const ruStrings = STRINGS.ru as Record<string, string>;
  return {
    es: interp(esStrings[key] ?? ruStrings[key] ?? key, esVars),
    ru: interp(ruStrings[key] ?? key, ruVars ?? esVars),
  };
}

export type DailyMissionKind = "new" | "repair" | "consolidate" | "challenge" | "maintenance" | "boss";

export type DailyMission = {
  kind: DailyMissionKind;
  focusSkillId: string;
  title: LocalizedText;
  outcome: LocalizedText;
  reason: LocalizedText;
  status: SkillMasteryStatus;
  masteryPct: number | null;
  /** Estimated session duration in minutes. */
  estimatedMinutes: number;
  /** XP reward for completing this mission. */
  xpReward: number;
};

const MISSION_ESTIMATED_MINUTES: Record<DailyMissionKind, number> = {
  new: 12,
  repair: 10,
  consolidate: 10,
  challenge: 15,
  maintenance: 8,
  boss: 20,
};

const MISSION_XP_REWARD: Record<DailyMissionKind, number> = {
  new: 50,
  repair: 40,
  consolidate: 30,
  challenge: 80,
  maintenance: 20,
  boss: 150,
};

function missionMeta(kind: DailyMissionKind): { estimatedMinutes: number; xpReward: number } {
  return {
    estimatedMinutes: MISSION_ESTIMATED_MINUTES[kind],
    xpReward: MISSION_XP_REWARD[kind],
  };
}

function recentMissionCount(skillId: string, state: ProgressState): number {
  return state.sessions.slice(-3).filter((session) => session.missionSkillId === skillId).length;
}

function recentBossCount(topicId: string, state: ProgressState): number {
  return state.sessions.slice(-10).filter((s) => s.topicId === topicId && s.missionKind === "boss").length;
}

function hasReadyPrerequisites(item: SkillMastery, topicMastery: SkillMastery[]): boolean {
  if (item.skill.prerequisiteSkillIds.length === 0) return true;
  const byId = new Map(topicMastery.map((mastery) => [mastery.skill.id, mastery]));
  return item.skill.prerequisiteSkillIds.every((id) => {
    const prerequisite = byId.get(id);
    return !prerequisite || ["stable", "mastered"].includes(prerequisite.status);
  });
}

function previousPrerequisite(item: SkillMastery, topicMastery: SkillMastery[]): SkillMastery | undefined {
  const byId = new Map(topicMastery.map((mastery) => [mastery.skill.id, mastery]));
  return item.skill.prerequisiteSkillIds
    .map((id) => byId.get(id))
    .find((mastery): mastery is SkillMastery => mastery != null && !["stable", "mastered"].includes(mastery.status));
}

function byLearningPriority(a: SkillMastery, b: SkillMastery): number {
  if (a.skill.level !== b.skill.level) return a.skill.level - b.skill.level;
  return a.skill.id.localeCompare(b.skill.id);
}

export function buildMissionForSkill(skillId: string, state: ProgressState): DailyMission | null {
  const skill = SKILLS_BY_ID.get(skillId);
  if (!skill) return null;
  const mastery = getMasteryForTopic(state, skill.topicId).find((item) => item.skill.id === skillId);
  const kind: DailyMissionKind =
    mastery?.status === "needs_review" ? "repair"
    : mastery?.status === "mastered" ? "challenge"
    : "consolidate";
  const skillNameEs = skill.titleEs;
  const skillNameRu = getSkillTitleRu(skill.id, skill.titleEs);
  const outcomeEs = skill.repairExplanationEs ?? STRINGS.es.dm_outcome_practice_fallback;
  const outcomeRu = getSkillRepairRu(skill.id, skill.repairExplanationEs);
  return {
    kind,
    focusSkillId: skill.id,
    title: lt("dm_title_practice", { skill: skillNameEs }, { skill: skillNameRu }),
    outcome: { es: outcomeEs, ru: outcomeRu },
    reason: lt("dm_reason_practice"),
    status: mastery?.status ?? "new",
    masteryPct: mastery?.accuracy ?? null,
    ...missionMeta(kind),
  };
}

export function buildDailyMission(topicId: string, state: ProgressState): DailyMission | null {
  const skills = getMasteryForTopic(state, topicId);
  if (skills.length === 0) return null;
  const dueRepairByTopic = new Set(
    getSkillsDueForReview(state.skillProgress)
      .map((item) => item.skillId)
      .filter((skillId) => SKILLS_BY_ID.get(skillId)?.topicId === topicId)
  );

  // --- REPAIR ---
  const repair = skills
    .filter((item) => item.status === "needs_review" || dueRepairByTopic.has(item.skill.id))
    .filter((item) => recentMissionCount(item.skill.id, state) < 2)
    .sort((a, b) => {
      const aDue = dueRepairByTopic.has(a.skill.id) ? 1 : 0;
      const bDue = dueRepairByTopic.has(b.skill.id) ? 1 : 0;
      if (aDue !== bDue) return bDue - aDue;
      return b.recentMistakes - a.recentMistakes || byLearningPriority(a, b);
    })[0];
  if (repair) {
    const fallback = previousPrerequisite(repair, skills);
    const target = fallback ?? repair;
    const repairOutcomeEs = target.skill.repairExplanationEs ?? STRINGS.es.dm_outcome_repair_fallback;
    const repairOutcomeRu = getSkillRepairRu(target.skill.id, target.skill.repairExplanationEs);
    return {
      kind: "repair",
      focusSkillId: target.skill.id,
      title: lt("dm_title_repair", { skill: target.skill.titleEs }, { skill: getSkillTitleRu(target.skill.id, target.skill.titleEs) }),
      outcome: { es: repairOutcomeEs, ru: repairOutcomeRu },
      reason: lt(fallback ? "dm_reason_repair_prereq" : "dm_reason_repair"),
      status: target.status,
      masteryPct: target.accuracy,
      ...missionMeta("repair"),
    };
  }

  // --- NEW SKILL ---
  const fresh = skills
    .filter((item) => item.status === "new")
    .filter((item) => hasReadyPrerequisites(item, skills))
    .filter((item) => recentMissionCount(item.skill.id, state) === 0)
    .sort(byLearningPriority)[0];
  if (fresh) {
    return {
      kind: "new",
      focusSkillId: fresh.skill.id,
      title: lt("dm_title_new", { skill: fresh.skill.titleEs }, { skill: getSkillTitleRu(fresh.skill.id, fresh.skill.titleEs) }),
      outcome: lt("dm_outcome_new"),
      reason: lt("dm_reason_new"),
      status: fresh.status,
      masteryPct: null,
      ...missionMeta("new"),
    };
  }

  // --- CONSOLIDATE ---
  const learning = skills
    .filter((item) => item.status === "learning")
    .filter((item) => recentMissionCount(item.skill.id, state) < 2)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0) || byLearningPriority(a, b))[0];
  if (learning) {
    return {
      kind: "consolidate",
      focusSkillId: learning.skill.id,
      title: lt("dm_title_consolidate", { skill: learning.skill.titleEs }, { skill: getSkillTitleRu(learning.skill.id, learning.skill.titleEs) }),
      outcome: lt("dm_outcome_consolidate"),
      reason: lt("dm_reason_consolidate"),
      status: learning.status,
      masteryPct: learning.accuracy,
      ...missionMeta("consolidate"),
    };
  }

  // --- MAINTENANCE ---
  const recentlyPracticed = new Set(
    state.sessions.slice(-5).flatMap((s) => s.practicedSkillTags ?? s.wrongSkillTags)
  );
  const maintenance = skills
    .filter((item) => item.status === "mastered" || item.status === "stable")
    .filter((item) => !recentlyPracticed.has(item.skill.id))
    .filter((item) => recentMissionCount(item.skill.id, state) === 0)
    .sort((a, b) => byLearningPriority(a, b))[0];
  if (maintenance) {
    return {
      kind: "maintenance",
      focusSkillId: maintenance.skill.id,
      title: lt("dm_title_maintenance", { skill: maintenance.skill.titleEs }, { skill: getSkillTitleRu(maintenance.skill.id, maintenance.skill.titleEs) }),
      outcome: lt("dm_outcome_maintenance"),
      reason: lt("dm_reason_maintenance"),
      status: maintenance.status,
      masteryPct: maintenance.accuracy,
      ...missionMeta("maintenance"),
    };
  }

  // --- BOSS: all topic skills stable or mastered, rare ---
  const allSolidOrMastered = skills.every(
    (item) => item.status === "stable" || item.status === "mastered" || item.status === "challenge_ready"
  );
  const practiceCount = skills.reduce((acc, item) => acc + item.practiced, 0);
  if (allSolidOrMastered && practiceCount >= 20 && recentBossCount(topicId, state) === 0) {
    const hardestSkill = [...skills].sort((a, b) => b.skill.level - a.skill.level)[0];
    return {
      kind: "boss",
      focusSkillId: hardestSkill.skill.id,
      title: lt("dm_title_boss"),
      outcome: lt("dm_outcome_boss"),
      reason: lt("dm_reason_boss"),
      status: hardestSkill.status,
      masteryPct: hardestSkill.accuracy,
      ...missionMeta("boss"),
    };
  }

  // --- CHALLENGE (fallback) ---
  const recentGoodSessions = state.sessions
    .filter((session) => session.topicId === topicId)
    .slice(-2)
    .filter((session) => session.questionsAnswered > 0 && session.correctAnswers / session.questionsAnswered >= 0.85 && session.hintsUsed === 0);
  const allowChallenge = recentGoodSessions.length >= 2;
  const challenge = skills
    .filter((item) => item.status === "stable" || item.status === "mastered")
    .filter((item) => allowChallenge || item.status === "mastered")
    .sort((a, b) => b.skill.level - a.skill.level || (a.accuracy ?? 0) - (b.accuracy ?? 0))[0] ?? skills[0];

  return {
    kind: "challenge",
    focusSkillId: challenge.skill.id,
    title: lt("dm_title_challenge", { skill: challenge.skill.titleEs }, { skill: getSkillTitleRu(challenge.skill.id, challenge.skill.titleEs) }),
    outcome: lt("dm_outcome_challenge"),
    reason: lt("dm_reason_challenge"),
    status: challenge.status,
    masteryPct: challenge.accuracy,
    ...missionMeta("challenge"),
  };
}
