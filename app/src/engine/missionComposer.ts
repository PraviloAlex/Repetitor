/**
 * missionComposer.ts
 *
 * Builds a structured multi-block daily mission based on SkillProgress.
 * Distinct from the single-skill DailyMission in dailyMission.ts —
 * this composes a full 15-minute sequence: confidence win → repair → consolidate → challenge.
 *
 * No AI API. Pure deterministic logic.
 */

import { SKILLS, SKILLS_BY_ID } from "./skills";
import type { SkillProgress } from "./skillProgressTracker";

// ── Types ─────────────────────────────────────────────────────────────────

export type MissionBlockType =
  | "confidence_win"
  | "repair"
  | "consolidation"
  | "challenge"
  | "maintenance";

export type MissionBlock = {
  type: MissionBlockType;
  skillId: string;
  skillTitleEs: string;
  reasonEs: string;
};

/** Full structured daily mission. */
export type ComposedMission = {
  id: string;
  createdAt: string;
  titleEs: string;
  subtitleEs: string;
  blocks: MissionBlock[];
  estimatedMinutes: number;
  kaizenFocusEs: string;
};

// ── Reason templates ───────────────────────────────────────────────────────

const REASONS: Record<MissionBlockType, string> = {
  confidence_win:
    "Empezamos con algo que ya sabés para entrar en ritmo.",
  repair:
    "Este skill volvió porque ayer hubo una dificultad.",
  consolidation:
    "Este skill necesita una repetición más para estabilizarse.",
  challenge:
    "Cerramos con un desafío para medir si podés subir de nivel.",
  maintenance:
    "Este skill no se practica hace tiempo — repaso rápido para no olvidar.",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function skillTitle(skillId: string): string {
  return SKILLS_BY_ID.get(skillId)?.titleEs ?? skillId;
}

function makeBlock(type: MissionBlockType, skillId: string): MissionBlock {
  return {
    type,
    skillId,
    skillTitleEs: skillTitle(skillId),
    reasonEs: REASONS[type],
  };
}

function pickFirst(
  progressMap: Record<string, SkillProgress>,
  predicate: (p: SkillProgress) => boolean,
  exclude: Set<string>
): string | null {
  for (const skill of SKILLS) {
    const p = progressMap[skill.id];
    if (!p) continue;
    if (exclude.has(skill.id)) continue;
    if (predicate(p)) return skill.id;
  }
  return null;
}

// ── Core function ──────────────────────────────────────────────────────────

/**
 * Compose a structured daily mission from current skill progress.
 *
 * Structure (ideal):
 *   1. confidence_win  — something already stable/mastered
 *   2. repair          — needs_repair or maintenance
 *   3. repair          — second repair if available
 *   4. consolidation   — learning / stable but not mastered
 *   5. challenge       — mastered skill pushed harder
 *
 * Falls back gracefully when progress data is sparse.
 */
export function composeDailyMission(
  progressMap: Record<string, SkillProgress>,
  now: Date = new Date()
): ComposedMission {
  const used = new Set<string>();
  const blocks: MissionBlock[] = [];

  // 1. Confidence win: stable or mastered skill
  const confWinId = pickFirst(
    progressMap,
    (p) => p.status === "stable" || p.status === "mastered",
    used
  );
  if (confWinId) {
    blocks.push(makeBlock("confidence_win", confWinId));
    used.add(confWinId);
  }

  // 2–3. Repair: needs_repair first, then maintenance
  for (let i = 0; i < 2; i++) {
    const repairId = pickFirst(
      progressMap,
      (p) => p.status === "needs_repair",
      used
    ) ?? pickFirst(
      progressMap,
      (p) => p.status === "maintenance",
      used
    );
    if (repairId) {
      blocks.push(makeBlock("repair", repairId));
      used.add(repairId);
    }
  }

  // 4. Consolidation: learning or stable (not yet mastered)
  const consolidateId = pickFirst(
    progressMap,
    (p) => p.status === "learning" || p.status === "stable",
    used
  );
  if (consolidateId) {
    blocks.push(makeBlock("consolidation", consolidateId));
    used.add(consolidateId);
  }

  // 5. Challenge: mastered skill
  const challengeId = pickFirst(
    progressMap,
    (p) => p.status === "mastered",
    used
  );
  if (challengeId) {
    blocks.push(makeBlock("challenge", challengeId));
    used.add(challengeId);
  }

  // Fallback: if very few blocks, fill with any practiced skill
  if (blocks.length < 3) {
    for (const skill of SKILLS) {
      if (used.has(skill.id)) continue;
      const p = progressMap[skill.id];
      if (!p || p.attempts === 0) continue;
      blocks.push(makeBlock("consolidation", skill.id));
      used.add(skill.id);
      if (blocks.length >= 3) break;
    }
  }

  // Kaizen focus: first repair skill, or first block
  const repairBlock = blocks.find((b) => b.type === "repair");
  const kaizenFocusEs = repairBlock
    ? `Foco de hoy: mejorar ${repairBlock.skillTitleEs}.`
    : blocks.length > 0
    ? `Foco de hoy: practicar ${blocks[0].skillTitleEs}.`
    : "Comenzá con cualquier tema para generar datos.";

  // Title variants
  const repairCount = blocks.filter((b) => b.type === "repair").length;
  const titleEs =
    repairCount >= 2
      ? "Repair + desafío de ingreso"
      : repairCount === 1
      ? `Repair: ${repairBlock?.skillTitleEs ?? "navegar"}`
      : "Tu escala de hoy";

  const subtitleEs = `${blocks.length} bloques · ≈${estimateMinutes(blocks)} minutos`;

  const dateKey = now.toISOString().slice(0, 10).replace(/-/g, "");
  return {
    id: `mission-${dateKey}-${blocks.length}`,
    createdAt: now.toISOString(),
    titleEs,
    subtitleEs,
    blocks,
    estimatedMinutes: estimateMinutes(blocks),
    kaizenFocusEs,
  };
}

function estimateMinutes(blocks: MissionBlock[]): number {
  const BLOCK_MINUTES: Record<MissionBlockType, number> = {
    confidence_win: 2,
    repair: 4,
    consolidation: 3,
    challenge: 4,
    maintenance: 2,
  };
  return blocks.reduce((sum, b) => sum + (BLOCK_MINUTES[b.type] ?? 3), 0);
}

// ── Persist helper ─────────────────────────────────────────────────────────

const STORAGE_KEY = "escala_composed_mission";

export function saveComposedMission(mission: ComposedMission): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mission));
}

export function loadComposedMission(): ComposedMission | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ComposedMission) : null;
  } catch {
    return null;
  }
}

/**
 * Returns today's mission if one was already composed today,
 * otherwise composes a fresh one and saves it.
 */
export function getTodaysMission(
  progressMap: Record<string, SkillProgress>
): ComposedMission {
  const today = new Date().toISOString().slice(0, 10);
  const cached = loadComposedMission();
  if (cached && cached.createdAt.startsWith(today)) return cached;
  const fresh = composeDailyMission(progressMap);
  saveComposedMission(fresh);
  return fresh;
}
