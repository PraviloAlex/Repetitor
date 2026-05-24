/**
 * simulacroEngine.ts
 *
 * Mini-exam / benchmark system.
 * Produces timed, hint-free exams from existing question generators.
 * Does NOT call any AI API — purely deterministic, client-side.
 */

import type { Question } from "./types";
import { generateForTopicWithOptions } from "./generator";
import { SKILLS, SKILLS_BY_ID } from "./skills";
import type { SkillProgress } from "./skillProgressTracker";
import { computeIngressoReadiness } from "./skillProgressTracker";

// ── Types ───────────────────────────────────���──────────────────────────────

export type SimulacroType = "mini" | "weekly" | "full";

export type SimulacroQuestion = Question & {
  order: number;
  points: number;
  noHints: true;
};

export type SimulacroSession = {
  id: string;
  type: SimulacroType;
  startedAt: string;
  finishedAt?: string;
  questions: SimulacroQuestion[];
  answers: Record<string, string | number>;
  score?: number;
  accuracy?: number;
  skillBreakdown?: Record<
    string,
    { total: number; correct: number; accuracy: number }
  >;
};

export type SimulacroResult = {
  sessionId: string;
  type: SimulacroType;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  score: number;
  strongestSkills: string[];
  weakestSkills: string[];
  readinessAfterExam: number;
  messageEs: string;
  parentMessageEs: string;
};

// ── Config ─────────────────────────���───────────────────────���───────────────

const SIMULACRO_CONFIG: Record<SimulacroType, { count: number; difficultyMin: number }> = {
  mini:   { count: 5,  difficultyMin: 3 },
  weekly: { count: 15, difficultyMin: 3 },
  full:   { count: 25, difficultyMin: 4 },
};

// Core ingreso skill IDs (subset of all skills; used for question selection)
const INGRESO_SKILL_IDS = [
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
  "order-of-operations",
  "compound-area",
];

// ── Helpers ─────────────────────��────────────────────────────────���─────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pseudoUUID(): string {
  return `sim-${Date.now()}-${Math.floor(Math.random() * 0xfffff).toString(16)}`;
}

/** Pick `n` distinct integers from [0, max) using a simple deterministic hash. */
function pickIndices(n: number, max: number, seed: number): number[] {
  const indices: number[] = [];
  let s = seed >>> 0;
  for (let attempt = 0; indices.length < n && attempt < max * 4; attempt++) {
    s = ((s * 1664525 + 1013904223) & 0xffffffff) >>> 0;
    const idx = s % max;
    if (!indices.includes(idx)) indices.push(idx);
  }
  // fill remaining sequentially if RNG ran out
  for (let i = 0; indices.length < Math.min(n, max); i++) {
    if (!indices.includes(i)) indices.push(i);
  }
  return indices.slice(0, Math.min(n, max));
}

// ── Core: createSimulacroSession ───────────────────────────���───────────────

/**
 * Builds a SimulacroSession with no hints.
 * Selects questions from ingreso-relevant skills, mixing difficulties.
 *
 * @param type         mini | weekly | full
 * @param progressMap  current SkillProgress map (keyed by skillId)
 * @param seed         optional RNG seed; defaults to Date.now()
 */
export function createSimulacroSession(
  type: SimulacroType,
  progressMap: Record<string, SkillProgress>,
  seed?: number
): SimulacroSession {
  const cfg = SIMULACRO_CONFIG[type];
  const rngSeed = (seed ?? Date.now()) >>> 0;

  // Decide which skills to pull questions from.
  // Prefer skills with needs_repair or learning status; fill with others.
  const repairSkills = INGRESO_SKILL_IDS.filter((id) => {
    const p = progressMap[id];
    return p && (p.status === "needs_repair" || p.status === "learning");
  });
  const otherSkills = INGRESO_SKILL_IDS.filter((id) => !repairSkills.includes(id));

  const poolSkillIds = [...repairSkills, ...otherSkills];
  if (poolSkillIds.length === 0) {
    // fallback: use all known skills with templates
    SKILLS.forEach((s) => {
      if (s.templateIds.length > 0) poolSkillIds.push(s.id);
    });
  }

  // Build question pool: 1–2 questions per skill, difficulty shifted up
  const pool: Question[] = [];
  const difficultyShift: -1 | 0 | 1 = cfg.difficultyMin >= 4 ? 1 : 0;

  for (const skillId of poolSkillIds) {
    const skillDef = SKILLS_BY_ID.get(skillId);
    if (!skillDef) continue;
    const qSeed = (rngSeed ^ skillId.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) >>> 0;
    try {
      const qs = generateForTopicWithOptions(skillDef.topicId, 2, qSeed, {
        focusSkillTags: [skillId],
        difficultyShift,
      });
      pool.push(...qs);
    } catch {
      // skip skills whose topic generator throws
    }
    if (pool.length >= cfg.count * 3) break; // plenty of candidates
  }

  // Pick cfg.count questions from pool
  const indices = pickIndices(cfg.count, pool.length, rngSeed);
  const selected = indices.map((i) => pool[i]).filter(Boolean);

  // Wrap as SimulacroQuestion (no hints, assign points)
  const questions: SimulacroQuestion[] = selected.map((q, order) => ({
    ...q,
    hint: undefined,
    order,
    points: 1,
    noHints: true,
  }));

  return {
    id: pseudoUUID(),
    type,
    startedAt: new Date().toISOString(),
    questions,
    answers: {},
  };
}

// ── Core: finishSimulacroSession ────────────────────────���──────────────────

/**
 * Evaluates all answers and returns a SimulacroResult.
 *
 * @param session      the SimulacroSession (with questions)
 * @param answers      map questionId → student answer
 * @param progressMap  current SkillProgress map
 */
export function finishSimulacroSession(
  session: SimulacroSession,
  answers: Record<string, string | number>,
  progressMap: Record<string, SkillProgress>
): SimulacroResult {
  const skillBreakdown: Record<string, { total: number; correct: number; accuracy: number }> = {};

  let correctAnswers = 0;
  let score = 0;

  for (const q of session.questions) {
    const studentAnswer = String(answers[q.id] ?? "").trim().toLowerCase();
    const correctAnswer = String(q.answer).trim().toLowerCase();
    const isCorrect = studentAnswer === correctAnswer;

    if (isCorrect) {
      correctAnswers++;
      score += q.points;
    }

    // Attribute to all skill tags on the question
    for (const skillId of q.skillTags) {
      if (!skillBreakdown[skillId]) {
        skillBreakdown[skillId] = { total: 0, correct: 0, accuracy: 0 };
      }
      skillBreakdown[skillId].total++;
      if (isCorrect) skillBreakdown[skillId].correct++;
    }
  }

  // Compute per-skill accuracy
  for (const key of Object.keys(skillBreakdown)) {
    const s = skillBreakdown[key];
    s.accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
  }

  const totalQuestions = session.questions.length;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Rank skills
  const skillEntries = Object.entries(skillBreakdown).filter(([, s]) => s.total > 0);
  skillEntries.sort((a, b) => b[1].accuracy - a[1].accuracy);

  const strongestSkills = skillEntries.slice(0, 2).map(([id]) => id);
  const weakestSkills = skillEntries.slice(-2).reverse().map(([id]) => id).filter(
    (id) => !strongestSkills.includes(id)
  );

  // Readiness after exam — update progress map optimistically
  const updatedProgress = { ...progressMap };
  for (const q of session.questions) {
    const studentAnswer = String(answers[q.id] ?? "").trim().toLowerCase();
    const isCorrect = studentAnswer === String(q.answer).trim().toLowerCase();
    for (const skillId of q.skillTags) {
      const current = updatedProgress[skillId];
      if (!current) continue;
      // Only bump forward if correct; if wrong, don't regress here
      // (calibration engine handles the delta separately)
      if (isCorrect && current.streakCorrect >= 0) {
        updatedProgress[skillId] = {
          ...current,
          streakCorrect: current.streakCorrect + 1,
          correct: current.correct + 1,
          attempts: current.attempts + 1,
        };
      }
    }
  }
  const readinessAfterExam = computeIngressoReadiness(updatedProgress);

  // Human-readable messages
  const strongLabel = strongestSkills[0]
    ? (SKILLS_BY_ID.get(strongestSkills[0])?.titleEs ?? strongestSkills[0])
    : null;
  const weakLabel = weakestSkills[0]
    ? (SKILLS_BY_ID.get(weakestSkills[0])?.titleEs ?? weakestSkills[0])
    : null;

  const typeLabel =
    session.type === "mini"
      ? "mini simulacro"
      : session.type === "weekly"
      ? "simulacro semanal"
      : "simulacro completo";

  const messageEs =
    `Terminaste un ${typeLabel}. ` +
    `Tu precisión fue ${accuracy}%. ` +
    (strongLabel ? `Tu punto fuerte: ${strongLabel}. ` : "") +
    (weakLabel
      ? `Tu punto débil: ${weakLabel}. Mañana Escala te prepara una misión repair.`
      : "¡Sin puntos débiles hoy!");

  const parentMessageEs =
    `El simulacro muestra que el alumno está avanzando` +
    (weakLabel
      ? `, pero todavía necesita reforzar: ${weakLabel}.`
      : `, sin áreas críticas en este momento.`) +
    ` Precisión: ${accuracy}%. Readiness estimado: ${readinessAfterExam}%.`;

  return {
    sessionId: session.id,
    type: session.type,
    totalQuestions,
    correctAnswers,
    accuracy,
    score,
    strongestSkills,
    weakestSkills,
    readinessAfterExam,
    messageEs,
    parentMessageEs,
  };
}

// ── Persist helpers ─────────���───────────────────────────────────────────────

const KEYS = {
  SESSIONS: "escala_simulacro_sessions",
  RESULTS: "escala_simulacro_results",
};

export function loadSimulacroSessions(): SimulacroSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SESSIONS) ?? "[]");
  } catch {
    return [];
  }
}

export function saveSimulacroSession(session: SimulacroSession): void {
  const list = loadSimulacroSessions();
  const idx = list.findIndex((s) => s.id === session.id);
  if (idx >= 0) list[idx] = session;
  else list.push(session);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(list));
}

export function loadSimulacroResults(): SimulacroResult[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.RESULTS) ?? "[]");
  } catch {
    return [];
  }
}

export function saveSimulacroResult(result: SimulacroResult): void {
  const list = loadSimulacroResults();
  list.push(result);
  // Keep last 50
  const trimmed = list.slice(-50);
  localStorage.setItem(KEYS.RESULTS, JSON.stringify(trimmed));
}

export function getLastSimulacroResult(): SimulacroResult | null {
  const list = loadSimulacroResults();
  return list.length > 0 ? list[list.length - 1] : null;
}
