/**
 * cognitiveInsights.ts
 *
 * Classifies error patterns into pedagogically meaningful categories.
 * Explains WHY the student is making mistakes (not just WHAT was wrong).
 * No AI API — purely rule-based mapping.
 */

import type { SkillProgress } from "./skillProgressTracker";

// ── Types ─────────────────────────────────────────────────────────────────

export type CognitivePattern =
  | "procedural_confusion"
  | "concept_gap"
  | "reading_misinterpretation"
  | "careless_execution"
  | "strategy_missing";

export type CognitiveErrorInsight = {
  pattern: CognitivePattern;
  count: number;
  messageEs: string;
  repairStrategyEs: string;
};

// ── Pattern messages ──────────────────────────────────────────────────────

const PATTERN_INFO: Record<
  CognitivePattern,
  { messageEs: string; repairStrategyEs: string }
> = {
  concept_gap: {
    messageEs: "Hay una idea base que todavía no está firme.",
    repairStrategyEs:
      "Conviene volver a una explicación corta y luego practicar con ejemplos simples.",
  },
  procedural_confusion: {
    messageEs: "El alumno conoce el tema, pero se confunde en los pasos.",
    repairStrategyEs: "Conviene usar ejercicios guiados paso a paso.",
  },
  reading_misinterpretation: {
    messageEs:
      "El problema no está solo en la cuenta, sino en entender el enunciado.",
    repairStrategyEs:
      "Conviene practicar problemas de texto y subrayar datos importantes.",
  },
  careless_execution: {
    messageEs:
      "El alumno entiende el procedimiento, pero se apura o se equivoca al calcular.",
    repairStrategyEs:
      "Conviene practicar con revisión final antes de responder.",
  },
  strategy_missing: {
    messageEs: "El alumno no sabe qué estrategia elegir al empezar.",
    repairStrategyEs:
      "Conviene enseñar una regla de decisión: primero identificar el tipo de problema.",
  },
};

// ── Error-type → pattern mapping ──────────────────────────────────────────

const ERROR_TYPE_MAP: Record<string, CognitivePattern> = {
  // Fraction errors
  add_denominators: "concept_gap",
  no_common_denominator: "procedural_confusion",
  wrong_lcm: "procedural_confusion",
  forgot_simplify: "procedural_confusion",
  invert_wrong_fraction: "procedural_confusion",
  cross_multiply_wrong: "concept_gap",
  // Divisibility errors
  no_factorization_strategy: "strategy_missing",
  wrong_prime_check: "concept_gap",
  divisor_vs_factor_confusion: "concept_gap",
  // Word problems
  missed_keyword: "reading_misinterpretation",
  wrong_unit: "reading_misinterpretation",
  ignored_condition: "reading_misinterpretation",
  // Arithmetic slips
  arithmetic_slip: "careless_execution",
  sign_error: "careless_execution",
  decimal_misplace: "careless_execution",
  // General fallback
  incorrect: "procedural_confusion",
};

// ── Core functions ─────────────────────────────────────────────────────────

/**
 * Map a raw error-type string to a CognitivePattern category.
 */
export function classifyCognitivePattern(errorType: string): CognitivePattern {
  return ERROR_TYPE_MAP[errorType] ?? "procedural_confusion";
}

/**
 * Aggregate error types from all skill progress into cognitive insights.
 * Returns patterns sorted by frequency (most common first).
 */
export function buildCognitiveInsights(
  progressMap: Record<string, SkillProgress>
): CognitiveErrorInsight[] {
  const patternCounts: Partial<Record<CognitivePattern, number>> = {};

  for (const progress of Object.values(progressMap)) {
    for (const [errorType, count] of Object.entries(progress.errorTypes ?? {})) {
      const pattern = classifyCognitivePattern(errorType);
      patternCounts[pattern] = (patternCounts[pattern] ?? 0) + count;
    }
  }

  return (Object.entries(patternCounts) as [CognitivePattern, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([pattern, count]) => ({
      pattern,
      count,
      ...PATTERN_INFO[pattern],
    }));
}

/**
 * Returns the single most common cognitive pattern, or null if no errors yet.
 */
export function primaryCognitiveInsight(
  progressMap: Record<string, SkillProgress>
): CognitiveErrorInsight | null {
  const insights = buildCognitiveInsights(progressMap);
  return insights.length > 0 ? insights[0] : null;
}

/**
 * One-line parent-facing summary of the top cognitive pattern.
 */
export function cognitiveInsightParentSummary(
  progressMap: Record<string, SkillProgress>
): string {
  const top = primaryCognitiveInsight(progressMap);
  if (!top) return "Sin patrones de error detectados todavía.";
  return `${top.messageEs} ${top.repairStrategyEs}`;
}
