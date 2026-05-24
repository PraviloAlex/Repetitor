/**
 * calibrationEngine.ts
 *
 * Compares internal readiness score with actual simulacro accuracy.
 * Builds trust: "does Escala's estimate reflect the real result?"
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type CalibrationStatus =
  | "well_calibrated"
  | "overestimated"
  | "underestimated";

export type CalibrationResult = {
  id: string;
  createdAt: string;
  predictedReadiness: number;
  benchmarkAccuracy: number;
  calibrationDelta: number;
  status: CalibrationStatus;
  messageEs: string;
};

export type CalibrationHistory = {
  results: CalibrationResult[];
};

// ── Core function ─────────────────────────────────────────────────────────

/**
 * Compare predicted readiness (0–100) against actual simulacro accuracy (0–100).
 * Returns a CalibrationResult with a human-readable ES message.
 */
export function calculateCalibration(
  predictedReadiness: number,
  benchmarkAccuracy: number
): CalibrationResult {
  const delta = predictedReadiness - benchmarkAccuracy;

  let status: CalibrationStatus;
  if (Math.abs(delta) <= 10) {
    status = "well_calibrated";
  } else if (delta > 10) {
    status = "overestimated";
  } else {
    status = "underestimated";
  }

  const messageEs =
    status === "well_calibrated"
      ? `La estimación de preparación (${predictedReadiness}%) está bien calibrada con el resultado real (${benchmarkAccuracy}%).`
      : status === "overestimated"
      ? `Escala estimaba la preparación en ${predictedReadiness}%, pero el simulacro mostró ${benchmarkAccuracy}%. Vamos a ajustar las misiones.`
      : `Escala estimaba la preparación en ${predictedReadiness}%, pero el simulacro mostró ${benchmarkAccuracy}%. ¡Mejor de lo esperado!`;

  return {
    id: `cal-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    createdAt: new Date().toISOString(),
    predictedReadiness,
    benchmarkAccuracy,
    calibrationDelta: delta,
    status,
    messageEs,
  };
}

/**
 * Human-friendly one-line summary for ParentDashboard.
 */
export function calibrationSummaryEs(result: CalibrationResult): string {
  if (result.status === "well_calibrated") {
    return `El progreso estimado coincide con el rendimiento real. Buena señal.`;
  }
  if (result.status === "overestimated") {
    const gap = Math.abs(result.calibrationDelta);
    return `La estimación de preparación era ${gap} puntos más alta que el resultado del simulacro. Escala refuerza los puntos débiles.`;
  }
  const gap = Math.abs(result.calibrationDelta);
  return `El alumno superó la estimación por ${gap} puntos. El progreso real es mejor de lo esperado.`;
}

// ── Persist helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = "escala_calibration_history";

export function loadCalibrationHistory(): CalibrationResult[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function appendCalibrationResult(result: CalibrationResult): void {
  const list = loadCalibrationHistory();
  list.push(result);
  // Keep last 30
  const trimmed = list.slice(-30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getLastCalibration(): CalibrationResult | null {
  const list = loadCalibrationHistory();
  return list.length > 0 ? list[list.length - 1] : null;
}
