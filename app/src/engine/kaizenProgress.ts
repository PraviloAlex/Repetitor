/**
 * kaizenProgress.ts
 *
 * Tracks readiness growth over time.
 * Each time a session ends or a simulacro is completed, append a point.
 * Summarise as "En 12 días subiste de 32% a 51%."
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type KaizenProgressPoint = {
  date: string;           // ISO date YYYY-MM-DD
  readiness: number;      // 0–100 ingreso readiness score
  accuracy?: number;      // optional: session accuracy 0–100
  minutesStudied?: number;
  source?: "session" | "simulacro";
};

export type KaizenProgressSummary = {
  startReadiness: number;
  currentReadiness: number;
  delta: number;
  daysActive: number;
  messageEs: string;
};

// ── Core function ──────────────────────────────────────────────────────────

export function buildKaizenProgressSummary(
  points: KaizenProgressPoint[]
): KaizenProgressSummary {
  if (points.length === 0) {
    return {
      startReadiness: 0,
      currentReadiness: 0,
      delta: 0,
      daysActive: 0,
      messageEs: "Todavía no hay datos de progreso. ¡Comenzá con una sesión corta!",
    };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const startReadiness = first.readiness;
  const currentReadiness = last.readiness;
  const delta = currentReadiness - startReadiness;

  // Distinct active days
  const distinctDays = new Set(points.map((p) => p.date)).size;

  // Date range in calendar days
  const startDate = new Date(first.date + "T00:00:00");
  const endDate = new Date(last.date + "T00:00:00");
  const calendarDays =
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const daysLabel = calendarDays > 1 ? `${calendarDays} días` : "1 día";

  let messageEs: string;

  if (delta > 5) {
    messageEs = `En ${daysLabel} subiste de ${startReadiness}% a ${currentReadiness}%. Eso es +${delta} puntos de preparación.`;
  } else if (delta >= 0 && distinctDays < 3) {
    messageEs =
      "El progreso todavía es pequeño, pero ya hay datos para ajustar las misiones.";
  } else if (delta >= 0) {
    messageEs = `Llevas ${distinctDays} días activos. Readiness: ${currentReadiness}%. Seguí así.`;
  } else {
    const drop = Math.abs(delta);
    messageEs = `El último simulacro mostró una caída de ${drop} puntos. Escala va a reforzar los puntos débiles.`;
  }

  return {
    startReadiness,
    currentReadiness,
    delta,
    daysActive: distinctDays,
    messageEs,
  };
}

// ── Persist helpers ────────────────────────────────────────────────────────

const STORAGE_KEY = "escala_kaizen_progress";

export function loadKaizenPoints(): KaizenProgressPoint[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Append a new progress point (or update today's entry if one already exists).
 * Keeps only the last 90 points.
 */
export function appendKaizenPoint(point: KaizenProgressPoint): void {
  const list = loadKaizenPoints();
  const idx = list.findIndex((p) => p.date === point.date && p.source === point.source);
  if (idx >= 0) {
    // Update existing entry for the same date+source
    list[idx] = point;
  } else {
    list.push(point);
  }
  // Keep last 90 entries
  const trimmed = list.slice(-90);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getKaizenSummary(): KaizenProgressSummary {
  return buildKaizenProgressSummary(loadKaizenPoints());
}

/** Convenience: append a point after a regular session. */
export function recordSessionKaizen(readiness: number, accuracy: number, minutesStudied: number): void {
  const today = new Date().toISOString().slice(0, 10);
  appendKaizenPoint({ date: today, readiness, accuracy, minutesStudied, source: "session" });
}

/** Convenience: append a point after a simulacro. */
export function recordSimulacroKaizen(readiness: number, accuracy: number): void {
  const today = new Date().toISOString().slice(0, 10);
  appendKaizenPoint({ date: today, readiness, accuracy, source: "simulacro" });
}
