import type { ProgressState } from "../storage/localProgress";
import { SKILLS_BY_ID, getSkillParentSignal } from "./skills";

export type SkillIssue = {
  skillId: string;
  titleEs: string;
  mistakes: number;
  parentSignalEs: string;
};

export type SkillTrendPoint = {
  date: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
};

export function getWeakSkills(state: ProgressState, limit = 3): SkillIssue[] {
  const counts = new Map<string, number>();
  for (const session of state.sessions.slice(-8)) {
    for (const tag of session.wrongSkillTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .filter(([skillId]) => SKILLS_BY_ID.has(skillId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skillId, mistakes]) => {
      const skill = SKILLS_BY_ID.get(skillId)!;
      return {
        skillId,
        titleEs: skill.titleEs,
        mistakes,
        parentSignalEs: getSkillParentSignal(skillId),
      };
    });
}

export function getRecoveredSkills(state: ProgressState, limit = 2): SkillIssue[] {
  const recent = state.sessions.slice(-3);
  const previous = state.sessions.slice(-8, -3);
  const recentWrong = new Set(recent.flatMap((session) => session.wrongSkillTags));
  const previousCounts = new Map<string, number>();

  for (const session of previous) {
    for (const tag of session.wrongSkillTags) {
      previousCounts.set(tag, (previousCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(previousCounts.entries())
    .filter(([skillId]) => SKILLS_BY_ID.has(skillId) && !recentWrong.has(skillId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skillId, mistakes]) => {
      const skill = SKILLS_BY_ID.get(skillId)!;
      return {
        skillId,
        titleEs: skill.titleEs,
        mistakes,
        parentSignalEs: "Antes aparecia como dificultad; en las ultimas sesiones no se repitio.",
      };
    });
}

export function getSkillTimeSeries(state: ProgressState, skillId: string, days = 14): SkillTrendPoint[] {
  const bucket = new Map<string, { attempts: number; correct: number; wrong: number }>();
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    bucket.set(key, { attempts: 0, correct: 0, wrong: 0 });
  }

  for (const session of state.sessions) {
    const dateKey = (session.endedAt ?? session.startedAt).slice(0, 10);
    if (!bucket.has(dateKey)) continue;
    const current = bucket.get(dateKey)!;

    const outcome = session.skillOutcomes?.[skillId];
    if (outcome) {
      current.attempts += outcome.attempts;
      current.correct += outcome.correct;
      current.wrong += outcome.wrong;
      continue;
    }

    const practiced = (session.practicedSkillTags ?? []).includes(skillId);
    const wrong = session.wrongSkillTags.includes(skillId);
    if (practiced || wrong) {
      current.attempts += 1;
      current.wrong += wrong ? 1 : 0;
      current.correct += wrong ? 0 : 1;
    }
  }

  return Array.from(bucket.entries()).map(([date, value]) => ({
    date,
    attempts: value.attempts,
    correct: value.correct,
    wrong: value.wrong,
    accuracy: value.attempts > 0 ? Math.round((value.correct / value.attempts) * 100) : null,
  }));
}

export function getSkillImprovementDelta(state: ProgressState, skillId: string, windowDays = 7): number | null {
  const series = getSkillTimeSeries(state, skillId, windowDays * 2);
  if (series.length < windowDays * 2) return null;
  const prev = series.slice(0, windowDays);
  const curr = series.slice(windowDays);

  const avg = (points: SkillTrendPoint[]) => {
    const withAttempts = points.filter((point) => point.attempts > 0);
    if (withAttempts.length === 0) return null;
    return Math.round(
      withAttempts.reduce((sum, point) => sum + (point.accuracy ?? 0), 0) / withAttempts.length
    );
  };

  const prevAvg = avg(prev);
  const currAvg = avg(curr);
  if (prevAvg === null || currAvg === null) return null;
  return currAvg - prevAvg;
}
