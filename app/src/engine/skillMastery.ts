import type { ProgressState } from "../storage/localProgress";
import { SKILLS, SKILLS_BY_ID, type SkillDefinition } from "./skills";

export type SkillMasteryStatus = "new" | "learning" | "stable" | "mastered" | "needs_review" | "challenge_ready" | "blocked";

export type SkillMastery = {
  skill: SkillDefinition;
  practiced: number;
  mistakes: number;
  recentMistakes: number;
  accuracy: number | null;
  status: SkillMasteryStatus;
  /** ISO date string of the most recent session that included this skill. Undefined if never practiced. */
  lastPracticedAt?: string;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function buildSkillMastery(state: ProgressState): SkillMastery[] {
  const practicedCounts = new Map<string, number>();
  const mistakeCounts = new Map<string, number>();
  const recentMistakeCounts = new Map<string, number>();
  const lastPracticedMap = new Map<string, string>();
  const recentSessions = state.sessions.slice(-4);

  for (const session of state.sessions) {
    if (session.skillOutcomes) {
      for (const [tag, outcome] of Object.entries(session.skillOutcomes)) {
        if (!SKILLS_BY_ID.has(tag)) continue;
        practicedCounts.set(tag, (practicedCounts.get(tag) ?? 0) + outcome.attempts);
        mistakeCounts.set(tag, (mistakeCounts.get(tag) ?? 0) + outcome.wrong);
        if (session.endedAt) lastPracticedMap.set(tag, session.endedAt);
      }
    }

    const practiced = session.practicedSkillTags?.length
      ? session.practicedSkillTags
      : unique(session.wrongSkillTags);

    for (const tag of practiced) {
      if (SKILLS_BY_ID.has(tag) && !session.skillOutcomes) {
        practicedCounts.set(tag, (practicedCounts.get(tag) ?? 0) + 1);
        if (session.endedAt) {
          lastPracticedMap.set(tag, session.endedAt);
        }
      }
    }

    for (const tag of session.wrongSkillTags) {
      if (SKILLS_BY_ID.has(tag) && !session.skillOutcomes) mistakeCounts.set(tag, (mistakeCounts.get(tag) ?? 0) + 1);
    }
  }

  for (const session of recentSessions) {
    if (session.skillOutcomes) {
      for (const [tag, outcome] of Object.entries(session.skillOutcomes)) {
        if (!SKILLS_BY_ID.has(tag)) continue;
        recentMistakeCounts.set(tag, (recentMistakeCounts.get(tag) ?? 0) + outcome.wrong);
      }
      continue;
    }
    for (const tag of session.wrongSkillTags) {
      if (SKILLS_BY_ID.has(tag)) recentMistakeCounts.set(tag, (recentMistakeCounts.get(tag) ?? 0) + 1);
    }
  }

  // First pass: compute raw statuses (without blocked)
  const rawStatuses = new Map<string, SkillMasteryStatus>();
  for (const skill of SKILLS) {
    const practiced = practicedCounts.get(skill.id) ?? 0;
    const mistakes = mistakeCounts.get(skill.id) ?? 0;
    const recentMistakes = recentMistakeCounts.get(skill.id) ?? 0;
    const accuracy = practiced === 0 ? null : Math.max(0, Math.round(((practiced - mistakes) / practiced) * 100));
    let status: SkillMasteryStatus = "new";

    if (recentMistakes >= 2 || (practiced >= 2 && accuracy !== null && accuracy < 65)) {
      status = "needs_review";
    } else if (practiced === 0) {
      status = "new";
    } else if (practiced >= 7 && accuracy !== null && accuracy >= 90 && recentMistakes === 0) {
      status = "mastered";
    } else if (practiced >= 4 && accuracy !== null && accuracy >= 85 && recentMistakes === 0) {
      status = "challenge_ready";
    } else if (practiced >= 4 && accuracy !== null && accuracy >= 75) {
      status = "stable";
    } else {
      status = "learning";
    }

    rawStatuses.set(skill.id, status);
  }

  // Second pass: apply blocked — a skill is blocked if ANY prerequisite is "new"
  return SKILLS.map((skill) => {
    const practiced = practicedCounts.get(skill.id) ?? 0;
    const mistakes = mistakeCounts.get(skill.id) ?? 0;
    const recentMistakes = recentMistakeCounts.get(skill.id) ?? 0;
    const accuracy = practiced === 0 ? null : Math.max(0, Math.round(((practiced - mistakes) / practiced) * 100));
    const lastPracticedAt = lastPracticedMap.get(skill.id);
    let status = rawStatuses.get(skill.id)!;

    // Mark blocked: only if the skill is "new" itself AND has at least one "new" prerequisite
    if (status === "new" && skill.prerequisiteSkillIds.length > 0) {
      const hasNewPrereq = skill.prerequisiteSkillIds.some(
        (prereqId) => rawStatuses.get(prereqId) === "new"
      );
      if (hasNewPrereq) {
        status = "blocked";
      }
    }

    return { skill, practiced, mistakes, recentMistakes, accuracy, status, lastPracticedAt };
  });
}

export function getMasteryForTopic(state: ProgressState, topicId: string): SkillMastery[] {
  return buildSkillMastery(state).filter((item) => item.skill.topicId === topicId);
}

export function getSkillMastery(state: ProgressState, skillId: string): SkillMastery | undefined {
  return buildSkillMastery(state).find((item) => item.skill.id === skillId);
}
