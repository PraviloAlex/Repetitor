import type { StudySession, Topic } from "./types";

export type RecommendationKey = "ok" | "repeat" | "hard" | "distracted";

export type RecommendationSignal = {
  key: RecommendationKey;
  topicId: string;
};

export function classifySession(session: StudySession): RecommendationSignal {
  const accuracy =
    session.questionsAnswered === 0
      ? 0
      : session.correctAnswers / session.questionsAnswered;

  const activeRatio =
    session.totalSeconds === 0 ? 0 : session.activeSeconds / session.totalSeconds;

  if (accuracy < 0.5) {
    return { key: "hard", topicId: session.topicId };
  }
  if (accuracy < 0.75) {
    return { key: "repeat", topicId: session.topicId };
  }
  if (activeRatio < 0.6 && session.totalSeconds > 60) {
    return { key: "distracted", topicId: session.topicId };
  }
  return { key: "ok", topicId: session.topicId };
}

// Backwards-compat helper used by some screens — returns a key + topic title is resolved by caller.
export function buildRecommendationKey(session: StudySession, _topic: Topic): RecommendationKey {
  return classifySession(session).key;
}
