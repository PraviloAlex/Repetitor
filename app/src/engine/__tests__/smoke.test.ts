/**
 * Smoke tests для трёх ключевых состояний прогресса.
 *
 * Сценарий 1 — Первый пользователь (пустое состояние)
 * Сценарий 2 — Заблокированный навык становится разблокированным
 * Сценарий 3 — Boss-миссия
 */

import { describe, it, expect } from "vitest";
import { buildSkillMastery, getMasteryForTopic } from "../skillMastery";
import { buildDailyMission } from "../dailyMission";
import type { ProgressState } from "../../storage/localProgress";
import type { StudySession } from "../types";
import { SKILLS } from "../skills";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyState(): ProgressState {
  return {
    storageSchemaVersion: 1,
    sessions: [],
    topicAccuracy: {},
    streak: { count: 0 },
    parent: {},
    reviewQueue: [],
    reviewSchedule: {},
    skillProgress: {},
  };
}

function makeSession(
  topicId: string,
  skillId: string,
  correct: number,
  total: number,
  overrides: Partial<StudySession> = {}
): StudySession {
  const wrong = total - correct;
  return {
    id: `sess-${Math.random().toString(36).slice(2)}`,
    topicId,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    totalSeconds: 300,
    activeSeconds: 280,
    blurSeconds: 10,
    idleSeconds: 10,
    focusLossCount: 0,
    pauseCount: 0,
    questionsAnswered: total,
    correctAnswers: correct,
    hintsUsed: 0,
    wrongSkillTags: wrong > 0 ? Array(wrong).fill(skillId) : [],
    wrongQuestionIds: [],
    practicedSkillTags: Array(total).fill(skillId),
    missionSkillId: skillId,
    ...overrides,
  };
}

function masteredState(topicId: string, skillId: string): ProgressState {
  const sessions = Array.from({ length: 8 }, () =>
    makeSession(topicId, skillId, 1, 1)
  );
  return { ...emptyState(), sessions };
}

/**
 * Все навыки топика mastered + 5 финальных сессий со всеми навыками
 * чтобы maintenance не блокировал boss (maintenance проверяет последние 5 сессий).
 */
function allMasteredState(topicId: string): ProgressState {
  const topicSkills = SKILLS.filter((s) => s.topicId === topicId);
  const baseSessions: StudySession[] = topicSkills.flatMap((skill) =>
    Array.from({ length: 8 }, () => makeSession(topicId, skill.id, 1, 1))
  );
  const allSkillIds = topicSkills.map((s) => s.id);
  const recentSessions: StudySession[] = Array.from({ length: 5 }, (_, i) => ({
    id: `recent-${i}`,
    topicId,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    totalSeconds: 300,
    activeSeconds: 280,
    blurSeconds: 10,
    idleSeconds: 10,
    focusLossCount: 0,
    pauseCount: 0,
    questionsAnswered: allSkillIds.length,
    correctAnswers: allSkillIds.length,
    hintsUsed: 0,
    wrongSkillTags: [],
    wrongQuestionIds: [],
    practicedSkillTags: allSkillIds,
  }));
  return { ...emptyState(), sessions: [...baseSessions, ...recentSessions] };
}

// ---------------------------------------------------------------------------
// Сценарий 1: Первый пользователь
// ---------------------------------------------------------------------------

describe("Первый пользователь (пустое состояние)", () => {
  const state = emptyState();
  const mastery = buildSkillMastery(state);

  it("все навыки имеют статус new или blocked", () => {
    for (const item of mastery) {
      expect(["new", "blocked"]).toContain(item.status);
    }
  });

  it("навыки без prerequisites имеют статус new", () => {
    const noPrereqs = mastery.filter(
      (item) => item.skill.prerequisiteSkillIds.length === 0
    );
    expect(noPrereqs.length).toBeGreaterThan(0);
    for (const item of noPrereqs) {
      expect(item.status).toBe("new");
    }
  });

  it("навыки с prerequisites имеют статус blocked", () => {
    const withPrereqs = mastery.filter(
      (item) => item.skill.prerequisiteSkillIds.length > 0
    );
    expect(withPrereqs.length).toBeGreaterThan(0);
    for (const item of withPrereqs) {
      expect(item.status).toBe("blocked");
    }
  });

  it("accuracy null для всех навыков", () => {
    for (const item of mastery) {
      expect(item.accuracy).toBeNull();
    }
  });

  it("дневная миссия operaciones имеет kind = new", () => {
    const mission = buildDailyMission("operaciones", state);
    expect(mission).not.toBeNull();
    expect(mission!.kind).toBe("new");
  });

  it("дневная миссия указывает на навык без prerequisites", () => {
    const mission = buildDailyMission("operaciones", state);
    const skill = SKILLS.find((s) => s.id === mission!.focusSkillId);
    expect(skill?.prerequisiteSkillIds.length).toBe(0);
  });

  it("title и outcome миссии — LocalizedText с непустыми es и ru", () => {
    const mission = buildDailyMission("operaciones", state);
    expect(mission!.title.es).toBeTruthy();
    expect(mission!.title.ru).toBeTruthy();
    expect(mission!.outcome.es).toBeTruthy();
    expect(mission!.outcome.ru).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Сценарий 2: Заблокированный навык
// ---------------------------------------------------------------------------

describe("Заблокированный навык", () => {
  it("subtraction заблокирован пока addition не пройден", () => {
    const state = emptyState();
    const mastery = getMasteryForTopic(state, "operaciones");
    const sub = mastery.find((item) => item.skill.id === "subtraction");
    expect(sub).toBeDefined();
    expect(sub!.status).toBe("blocked");
  });

  it("subtraction разблокируется когда addition пройден", () => {
    const sessions = Array.from({ length: 5 }, () =>
      makeSession("operaciones", "addition", 1, 1)
    );
    const state: ProgressState = { ...emptyState(), sessions };
    const mastery = getMasteryForTopic(state, "operaciones");
    const add = mastery.find((item) => item.skill.id === "addition");
    const sub = mastery.find((item) => item.skill.id === "subtraction");
    // 5 правильных сессий → stable или challenge_ready (оба = разблокирован)
    expect(["stable", "challenge_ready"]).toContain(add!.status);
    expect(sub!.status).toBe("new");
  });

  it("заблокированный навык не выбирается как дневная миссия", () => {
    const state = emptyState();
    const mission = buildDailyMission("operaciones", state);
    const focusSkill = SKILLS.find((s) => s.id === mission!.focusSkillId);
    const masteryMap = new Map(
      buildSkillMastery(state).map((m) => [m.skill.id, m.status])
    );
    for (const prereqId of focusSkill!.prerequisiteSkillIds) {
      expect(["stable", "mastered"]).toContain(masteryMap.get(prereqId));
    }
  });

  it("division заблокирован пока multiplication не пройден", () => {
    const state = emptyState();
    const mastery = getMasteryForTopic(state, "operaciones");
    const div = mastery.find((item) => item.skill.id === "division");
    expect(div!.status).toBe("blocked");
  });

  it("division разблокируется когда multiplication mastered", () => {
    const addSessions = Array.from({ length: 8 }, () =>
      makeSession("operaciones", "addition", 1, 1)
    );
    const mulState = masteredState("operaciones", "multiplication");
    const fullState: ProgressState = {
      ...mulState,
      sessions: [...addSessions, ...mulState.sessions],
    };
    const mastery = getMasteryForTopic(fullState, "operaciones");
    const div = mastery.find((item) => item.skill.id === "division");
    expect(div!.status).toBe("new");
  });
});

// ---------------------------------------------------------------------------
// Сценарий 3: Boss-миссия
// ---------------------------------------------------------------------------

describe("Boss-миссия", () => {
  it("возвращает kind=boss когда все навыки масtered и practiced >= 20", () => {
    const state = allMasteredState("operaciones");
    const mission = buildDailyMission("operaciones", state);
    expect(mission).not.toBeNull();
    expect(mission!.kind).toBe("boss");
  });

  it("boss xpReward больше чем у maintenance (20)", () => {
    const state = allMasteredState("operaciones");
    const boss = buildDailyMission("operaciones", state);
    expect(boss!.xpReward).toBeGreaterThan(80);
  });

  it("boss estimatedMinutes = 20", () => {
    const state = allMasteredState("operaciones");
    const boss = buildDailyMission("operaciones", state);
    expect(boss!.estimatedMinutes).toBe(20);
  });

  it("boss title и outcome имеют es и ru", () => {
    const state = allMasteredState("operaciones");
    const boss = buildDailyMission("operaciones", state);
    expect(boss!.title.es).toBeTruthy();
    expect(boss!.title.ru).toBeTruthy();
    expect(boss!.outcome.es).toBeTruthy();
    expect(boss!.outcome.ru).toBeTruthy();
  });

  it("boss НЕ выбирается если недавно был boss в этом топике", () => {
    const state = allMasteredState("operaciones");
    const recentBoss: StudySession = makeSession("operaciones", "addition", 1, 1, {
      missionKind: "boss",
    });
    const stateWithBoss: ProgressState = {
      ...state,
      sessions: [...state.sessions, recentBoss],
    };
    const mission = buildDailyMission("operaciones", stateWithBoss);
    expect(mission!.kind).not.toBe("boss");
  });

  it("boss НЕ выбирается если practiced < 20", () => {
    const sessions = [
      makeSession("operaciones", "addition", 1, 1),
      makeSession("operaciones", "addition", 1, 1),
    ];
    const state: ProgressState = { ...emptyState(), sessions };
    const mission = buildDailyMission("operaciones", state);
    expect(mission!.kind).not.toBe("boss");
  });
});
