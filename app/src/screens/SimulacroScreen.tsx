/**
 * SimulacroScreen.tsx
 *
 * Mini-exam (simulacro) flow:
 *   1. Intro card (type, count, no hints)
 *   2. One question at a time — no hints shown
 *   3. Results screen with accuracy, strongest/weakest skills, readiness
 *
 * Routed via /simulacro/:type  (type = "mini" | "weekly")
 */

import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSimulacroSession,
  finishSimulacroSession,
  saveSimulacroSession,
  saveSimulacroResult,
  type SimulacroType,
  type SimulacroSession,
  type SimulacroResult,
} from "../engine/simulacroEngine";
import { calculateCalibration, appendCalibrationResult } from "../engine/calibrationEngine";
import { recordSimulacroKaizen } from "../engine/kaizenProgress";
import { computeIngressoReadiness } from "../engine/skillProgressTracker";
import { loadProgress } from "../storage/localProgress";
import { SKILLS_BY_ID } from "../engine/skills";
import { useI18n } from "../i18n/I18nContext";

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidType(s: string | undefined): s is SimulacroType {
  return s === "mini" || s === "weekly" || s === "full";
}

function skillLabel(skillId: string): string {
  return SKILLS_BY_ID.get(skillId)?.titleEs ?? skillId;
}

// ── Component ──────────────────────────────────────────────────────────────

type Phase = "intro" | "exam" | "result";

export default function SimulacroScreen() {
  const { type: typeParam } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const simType: SimulacroType = isValidType(typeParam) ? typeParam : "mini";

  const progressState = useMemo(() => loadProgress(), []);
  const [phase, setPhase] = useState<Phase>("intro");
  const [session, setSession] = useState<SimulacroSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<SimulacroResult | null>(null);
  const [readinessBefore] = useState(() => computeIngressoReadiness(progressState.skillProgress));

  // ── Intro → Exam ───────────────────────────────────────────────────────

  function handleStart() {
    const newSession = createSimulacroSession(simType, progressState.skillProgress);
    if (newSession.questions.length === 0) {
      // No questions generated — show fallback
      setPhase("result");
      setResult(null);
      return;
    }
    saveSimulacroSession(newSession);
    setSession(newSession);
    setCurrentIndex(0);
    setAnswers({});
    setInputValue("");
    setPhase("exam");
  }

  // ── Exam: answer a question ────────────────────────────────────────────

  function handleAnswer() {
    if (!session) return;
    const q = session.questions[currentIndex];
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newAnswers = { ...answers, [q.id]: trimmed };
    setAnswers(newAnswers);
    setInputValue("");

    if (currentIndex + 1 < session.questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question answered — finish
      handleFinish(newAnswers);
    }
  }

  function handleFinish(finalAnswers: Record<string, string>) {
    if (!session) return;

    const simResult = finishSimulacroSession(
      session,
      finalAnswers,
      progressState.skillProgress
    );

    // Calibration
    const calibration = calculateCalibration(readinessBefore, simResult.accuracy);
    appendCalibrationResult(calibration);

    // Kaizen
    recordSimulacroKaizen(simResult.readinessAfterExam, simResult.accuracy);

    // Persist result
    saveSimulacroResult(simResult);

    setResult(simResult);
    setPhase("result");
  }

  // ── INTRO ──────────────────────────────────────────────────────────────

  if (phase === "intro") {
    const countMap: Record<SimulacroType, number> = { mini: 5, weekly: 15, full: 25 };
    const count = countMap[simType];
    const titleKey =
      simType === "mini"
        ? "sim_title_mini"
        : simType === "weekly"
        ? "sim_title_weekly"
        : "sim_title_full";

    return (
      <div className="screen-enter">
        <h1 className="screen-title">{t(titleKey)}</h1>
        <p className="screen-sub">{t("sim_sub", { count: String(count) })}</p>

        <div className="card" style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>
            ⚠️ {t("sim_no_hints")}
          </p>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-soft)" }}>
            {simType === "mini"
              ? "5 preguntas para medir tu preparación real."
              : "15 preguntas del programa de ingreso."}
          </p>
        </div>

        <div style={{ height: 16 }} />
        <button className="btn" onClick={handleStart}>
          Empezar
        </button>
        <div style={{ height: 12 }} />
        <button className="btn btn-soft" onClick={() => navigate("/")}>
          Cancelar
        </button>
      </div>
    );
  }

  // ── EXAM ───────────────────────────────────────────────────────────────

  if (phase === "exam" && session) {
    const q = session.questions[currentIndex];
    const isLast = currentIndex === session.questions.length - 1;
    const isMultipleChoice = q.type === "multiple_choice" && q.options;
    const isTrueFalse = q.type === "true_false";

    return (
      <div className="screen-enter">
        <p className="screen-sub" style={{ marginBottom: 4 }}>
          {t("sim_question_of", {
            n: String(currentIndex + 1),
            total: String(session.questions.length),
          })}
        </p>

        {/* Progress bar */}
        <div
          style={{
            height: 4,
            background: "var(--border)",
            borderRadius: 2,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round(((currentIndex) / session.questions.length) * 100)}%`,
              background: "var(--brand)",
              transition: "width 0.3s",
            }}
          />
        </div>

        <div className="card">
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {typeof q.prompt === "object" ? q.prompt.es : String(q.prompt)}
          </p>
        </div>

        <div style={{ height: 12 }} />

        {/* Answer input */}
        {isMultipleChoice && q.options ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map((opt, i) => {
              const optText = typeof opt === "object" ? opt.es : String(opt);
              const isSelected = inputValue === optText;
              return (
                <button
                  key={i}
                  className={`btn ${isSelected ? "" : "btn-soft"}`}
                  onClick={() => setInputValue(optText)}
                >
                  {optText}
                </button>
              );
            })}
          </div>
        ) : isTrueFalse ? (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className={`btn ${inputValue === "verdadero" ? "" : "btn-soft"}`}
              style={{ flex: 1 }}
              onClick={() => setInputValue("verdadero")}
            >
              Verdadero
            </button>
            <button
              className={`btn ${inputValue === "falso" ? "" : "btn-soft"}`}
              style={{ flex: 1 }}
              onClick={() => setInputValue("falso")}
            >
              Falso
            </button>
          </div>
        ) : (
          <input
            className="answer-input"
            type="text"
            inputMode="decimal"
            placeholder={t("q_your_answer")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && inputValue.trim() && handleAnswer()}
            autoFocus
          />
        )}

        <div style={{ height: 16 }} />
        <button
          className="btn"
          disabled={!inputValue.trim()}
          onClick={handleAnswer}
        >
          {isLast ? t("sim_finish") : t("sim_submit_answer")}
        </button>

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--text-soft)",
            textAlign: "center",
          }}
        >
          ⚠️ {t("sim_no_hints")}
        </p>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────

  if (phase === "result") {
    if (!result) {
      return (
        <div className="screen-enter">
          <p>{t("sim_no_questions")}</p>
          <button className="btn" onClick={() => navigate("/")}>
            {t("sim_result_back")}
          </button>
        </div>
      );
    }

    const confetti = result.accuracy >= 80;
    const confettiColors = ["#2563eb", "#16a34a", "#facc15", "#db2777", "#f97316"];
    const strong0 = result.strongestSkills[0];
    const weak0 = result.weakestSkills[0];

    return (
      <div className="screen-enter">
        {confetti && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 71) % 100}%`,
                  background: confettiColors[i % confettiColors.length],
                  animationDelay: `${(i % 4) * 40}ms`,
                }}
              />
            ))}
          </div>
        )}

        <h1 className="screen-title">{t("sim_result_title")}</h1>

        {/* Score card */}
        <div className="card" style={{ borderLeft: "4px solid var(--brand)", paddingLeft: 16 }}>
          <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            {result.correctAnswers}/{result.totalQuestions}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-soft)" }}>
            {t("sim_result_accuracy", { pct: String(result.accuracy) })}
          </p>
        </div>

        {/* Skills breakdown */}
        {(strong0 || weak0) && (
          <div className="card">
            {strong0 && (
              <p style={{ margin: 0, fontSize: 14, color: "var(--success)", fontWeight: 600 }}>
                {t("sim_result_strong", { skill: skillLabel(strong0) })}
              </p>
            )}
            {weak0 && (
              <p style={{ margin: strong0 ? "8px 0 0" : 0, fontSize: 14, color: "var(--warning)" }}>
                {t("sim_result_weak", { skill: skillLabel(weak0) })}
              </p>
            )}
          </div>
        )}

        {/* Readiness */}
        <div className="card">
          <p style={{ margin: 0, fontSize: 13, color: "var(--brand)", fontWeight: 600 }}>
            {t("sim_result_readiness", { pct: String(result.readinessAfterExam) })}
          </p>
          {readinessBefore !== result.readinessAfterExam && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-soft)" }}>
              {readinessBefore}% → {result.readinessAfterExam}%
            </p>
          )}
          {weak0 && (
            <p style={{ margin: "8px 0 0", fontSize: 13 }}>
              {t("sim_result_repair_hint")}
            </p>
          )}
        </div>

        {/* Parent message (collapsible) */}
        <details style={{ marginTop: 12 }}>
          <summary
            style={{
              fontSize: 13,
              color: "var(--text-soft)",
              cursor: "pointer",
              padding: "8px 12px",
              background: "var(--surface)",
              borderRadius: 8,
            }}
          >
            Para la familia →
          </summary>
          <div className="card" style={{ marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 13 }}>{result.parentMessageEs}</p>
          </div>
        </details>

        <div style={{ height: 16 }} />
        <button className="btn" onClick={() => navigate("/")}>
          {t("sim_result_back")}
        </button>
      </div>
    );
  }

  return null;
}
