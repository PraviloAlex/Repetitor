import type { ProgressState } from "../storage/localProgress";
import type { GeneratorOptions } from "./generator";
import { getSkillsDueForReview } from "./skillProgressTracker";
import { SKILLS_BY_ID } from "./skills";

export type AdaptiveProfile = GeneratorOptions & {
  reason: "baseline" | "repair" | "challenge";
};

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

  const carryOverRepairTags = Array.from(
    new Set([...dueSkillTags, ...focusSkillTags])
  ).slice(0, 3);

  if (carryOverRepairTags.length > 0 && (accuracy < 0.8 || dueSkillTags.length > 0)) {
    return { difficultyShift: -1, focusSkillTags: carryOverRepairTags, reason: "repair" };
  }

  if (accuracy >= 0.85 && hints === 0 && secondsPerQuestion <= 45) {
    return { difficultyShift: 1, focusSkillTags: [], reason: "challenge" };
  }

  return { difficultyShift: 0, focusSkillTags: carryOverRepairTags, reason: "baseline" };
}
