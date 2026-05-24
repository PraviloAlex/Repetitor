import type { Question } from "./types";

function normalizeNumeric(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/^\+/, "");
}

export function checkAnswer(question: Question, userAnswer: string): boolean {
  if (userAnswer == null) return false;
  const expected = String(question.answer).trim();
  const given = String(userAnswer).trim();

  if (question.type === "numeric_input") {
    const a = normalizeNumeric(expected);
    const b = normalizeNumeric(given);
    if (a === b) return true;
    const an = Number(a);
    const bn = Number(b);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) {
      return Math.abs(an - bn) < 1e-9;
    }
    return false;
  }

  if (question.type === "true_false") {
    return expected.toLowerCase() === given.toLowerCase();
  }

  // multiple_choice — exact match against options
  return expected === given;
}
