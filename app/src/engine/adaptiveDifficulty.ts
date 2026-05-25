import type { ProgressState } from "../storage/localProgress";
import type { GeneratorOptions } from "./generator";
import { getSkillsDueForReview } from "./skillProgressTracker";
import { SKILLS_BY_ID } from "./skills";

export type AdaptiveProfile = GeneratorOptions & {
  reason: "baseline" | "repair" | "challenge";
};

function twoRecentSessionsStrong(topicId: string, state: ProgressState): boolean {
  const recent = state.sessions.filter((session) => session.topicId === topicId).slice(-2);
  if (recent.length < 2) return false;
  return recent.every((session) => {
    if (session.questionsAnswered <= 0) return false;
    const acc = session.correctAnswers / session.questionsAnswered;
    const pace = session.activeSeconds / session.questionsAnswered;
    return acc >= 0.85 && session.hintsUsed === 0 && pace <= 50;
  });
}

function normalizeRepairTags(topicId: string, tags: string[], state: ProgressState): string[] {
  const lastMissionSkill = state.sessions[state.sessions.length - 1]?.missionSkillId;
  const scoped = tags.filter((skillId) => SKILLS_BY_ID.get(skillId)?.topicId === topicId);
  const withoutImmediateRepeat =
    scoped.length > 1 && lastMissionSkill ? scoped.filter((skillId) => skillId !== lastMissionSkill) : scoped;

  const normalized = withoutImmediateRepeat.map((skillId) => {
    const progress = state.skillProgress[skillId];
    const skill = SKILLS_BY_ID.get(skillId);
    const tooHard =
      !!progress &&
      (progress.status === "needs_repair" || progress.streakCorrect === 0) &&
      progress.wrong >= 2 &&
      progress.correct <= 1;
    if (tooHard && skill && skill.prerequisiteSkillIds.length > 0) {
      const fallback = skill.prerequisiteSkillIds.find((pr) => SKILLS_BY_ID.get(pr)?.topicId === topicId);
      return fallback ?? skillId;
    }
    return skillId;
  });

  return Array.from(new Set(normalized)).slice(0, 3);
}

export function buildAdaptiveProfile(topicId: string, state: ProgressState): AdaptiveProfile {
  const dueSkillTags = getSkillsDueForReview(state.skillProgress)
    .map((item) => item.skillId)
    .filter((skillId) => SKILLS_BY_ID.get(skillId)?.topicId === topicId);

  const recent = state.sessions
    .filter((session) => session.topicId === topicId)
    .slice(-3);

  if (recent.length === 0) {
    return {
      difficultyShift: dueSkillTags.length > 0 ? -1 : 0,
      focusSkillTags: dueSkillTags.slice(0, 2),
      reason: dueSkillTags.length > 0 ? "repair" : "baseline",
    };
  }

  const answered = recent.reduce((sum, session) => sum + session.questionsAnswered, 0);
  const correct = recent.reduce((sum, session) => sum + session.correctAnswers, 0);
  const hints = recent.reduce((sum, session) => sum + session.hintsUsed, 0);
  const activeSeconds = recent.reduce((sum, session) => sum + session.activeSeconds, 0);
  const accuracy = answered === 0 ? 0 : correct / answered;
  const secondsPerQuestion = answered === 0 ? Number.POSITIVE_INFINITY : activeSeconds / answered;

  const wrongTagCounts = new Map<string, number>();
  for (const session of recent) {
    for (const tag of session.wrongSkillTags) {
      wrongTagCounts.set(tag, (wrongTagCounts.get(tag) ?? 0) + 1);
    }
  }

  const focusSkillTags = Array.from(wrongTagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([tag]) => tag);

  const carryOverRepairTags = normalizeRepairTags(
    topicId,
    Array.from(new Set([...dueSkillTags, ...focusSkillTags])),
    state
  );

  if (carryOverRepairTags.length > 0 && (accuracy < 0.8 || dueSkillTags.length > 0)) {
    return { difficultyShift: -1, focusSkillTags: carryOverRepairTags, reason: "repair" };
  }

  if (twoRecentSessionsStrong(topicId, state) && accuracy >= 0.85 && hints === 0 && secondsPerQuestion <= 45) {
    return { difficultyShift: 1, focusSkillTags: [], reason: "challenge" };
  }

  return { difficultyShift: 0, focusSkillTags: carryOverRepairTags, reason: "baseline" };
}
