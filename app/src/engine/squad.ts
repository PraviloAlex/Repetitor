import { FOOTBALLERS } from "../content/footballers";
import type { Footballer, UnlockCondition } from "../content/footballers";

/** Topic ids used across the curriculum (kept in sync with topics.json). */
const TOPIC_IDS = [
  "operaciones",
  "divisibilidad",
  "fracciones",
  "decimales",
  "porcentajes",
  "geometria",
];

type Accuracy = Record<string, { correct: number; total: number }>;

export type PlayerStatus = {
  player: Footballer;
  unlocked: boolean;
  /** Progress toward unlocking, 0–100. 100 means unlocked. */
  progressPct: number;
};

function clamp01to100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function topicStats(acc: Accuracy, topicId: string): { pct: number; total: number } {
  const a = acc[topicId];
  if (!a || a.total === 0) return { pct: 0, total: 0 };
  return { pct: (a.correct / a.total) * 100, total: a.total };
}

function evaluateCondition(
  c: UnlockCondition,
  acc: Accuracy,
  sessionCount: number
): { unlocked: boolean; progressPct: number } {
  switch (c.kind) {
    case "first_session": {
      const unlocked = sessionCount > 0;
      return { unlocked, progressPct: unlocked ? 100 : 0 };
    }
    case "topic": {
      const { pct, total } = topicStats(acc, c.topicId);
      const accRatio = c.minAccuracy > 0 ? pct / c.minAccuracy : 1;
      const ansRatio = c.minAnswered > 0 ? total / c.minAnswered : 1;
      const unlocked = pct >= c.minAccuracy && total >= c.minAnswered;
      // The weaker of the two requirements drives the visible progress.
      return {
        unlocked,
        progressPct: unlocked ? 100 : clamp01to100(Math.min(accRatio, ansRatio) * 100),
      };
    }
    case "any_topic": {
      let best = 0;
      let unlocked = false;
      for (const id of TOPIC_IDS) {
        const { pct, total } = topicStats(acc, id);
        const accRatio = pct / c.minAccuracy;
        const ansRatio = total / c.minAnswered;
        best = Math.max(best, Math.min(accRatio, ansRatio));
        if (pct >= c.minAccuracy && total >= c.minAnswered) unlocked = true;
      }
      return { unlocked, progressPct: unlocked ? 100 : clamp01to100(best * 100) };
    }
    case "all_topics": {
      let met = 0;
      for (const id of TOPIC_IDS) {
        const { pct, total } = topicStats(acc, id);
        if (total > 0 && pct >= c.minAccuracy) met += 1;
      }
      const unlocked = met === TOPIC_IDS.length;
      return { unlocked, progressPct: clamp01to100((met / TOPIC_IDS.length) * 100) };
    }
  }
}

/** Evaluate every footballer against the child's local progress. */
export function evaluateSquad(acc: Accuracy, sessionCount: number): PlayerStatus[] {
  return FOOTBALLERS.map((player) => {
    const { unlocked, progressPct } = evaluateCondition(player.unlock, acc, sessionCount);
    return { player, unlocked, progressPct };
  });
}

export function countUnlocked(statuses: PlayerStatus[]): number {
  return statuses.filter((s) => s.unlocked).length;
}
