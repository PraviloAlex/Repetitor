import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setParentSettings } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";

type Mode = "primaria" | "ingreso";
type Time = 10 | 15 | 20;

function OptionCard({
  selected,
  onClick,
  emoji,
  title,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        width: "100%",
        background: selected ? "var(--primary-soft)" : "var(--surface)",
        border: `2px solid ${selected ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "16px 18px",
        marginBottom: 12,
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: selected ? "var(--primary)" : "var(--text)" }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 3 }}>{sub}</div>
      </div>
      {selected && (
        <span style={{ marginLeft: "auto", color: "var(--primary)", fontSize: 20, flexShrink: 0 }}>✓</span>
      )}
    </button>
  );
}

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode | null>(null);
  const [time, setTime] = useState<Time | null>(null);

  const TOTAL_STEPS = 2;

  function handleFinish() {
    if (!mode || !time) return;
    const goal = mode === "ingreso" ? "ingreso" : "refuerzo";
    const level = mode === "ingreso" ? "C" : "B";
    setParentSettings({
      mode,
      goal,
      level,
      dailyGoalMinutes: time,
      onboardingDone: true,
    });
    navigate("/", { replace: true });
  }

  return (
    <div>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, justifyContent: "center" }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            style={{
              width: i < step ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i < step ? "var(--primary)" : "var(--border)",
              transition: "width 0.25s ease, background 0.25s ease",
            }}
          />
        ))}
      </div>

      {/* Step 1: Mode selection */}
      {step === 1 && (
        <>
          <h1 className="screen-title">{t("ob_mode_title")}</h1>
          <p className="screen-sub">{t("ob_mode_sub")}</p>

          <OptionCard
            selected={mode === "primaria"}
            onClick={() => setMode("primaria")}
            emoji="🎒"
            title={t("ob_mode_primaria")}
            sub={t("ob_mode_primaria_sub")}
          />
          <OptionCard
            selected={mode === "ingreso"}
            onClick={() => setMode("ingreso")}
            emoji="🏆"
            title={t("ob_mode_ingreso")}
            sub={t("ob_mode_ingreso_sub")}
          />

          {mode === "ingreso" && (
            <div
              style={{
                background: "var(--ok-soft)",
                border: "1px solid #2da44e",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#1a4b2a",
              }}
            >
              ⭐⭐⭐ Preguntas con más complejidad: problemas con texto, trampas, varios pasos.
              Ideal para prepararse para el examen de ingreso.
            </div>
          )}

          <button
            className="btn"
            disabled={!mode}
            onClick={() => setStep(2)}
          >
            {t("ob_btn_next")}
          </button>
        </>
      )}

      {/* Step 2: Daily time */}
      {step === 2 && (
        <>
          <h1 className="screen-title">{t("ob_step3_title")}</h1>
          <p className="screen-sub">{t("ob_step3_sub")}</p>

          <OptionCard
            selected={time === 10}
            onClick={() => setTime(10)}
            emoji="⚡"
            title={t("ob_time_10")}
            sub={t("ob_time_10_sub")}
          />
          <OptionCard
            selected={time === 15}
            onClick={() => setTime(15)}
            emoji="🎯"
            title={t("ob_time_15")}
            sub={t("ob_time_15_sub")}
          />
          <OptionCard
            selected={time === 20}
            onClick={() => setTime(20)}
            emoji="💪"
            title={t("ob_time_20")}
            sub={t("ob_time_20_sub")}
          />

          <button className="btn" disabled={!time} onClick={handleFinish} style={{ marginBottom: 12 }}>
            {t("ob_btn_start")}
          </button>
          <button className="btn btn-ghost" onClick={() => setStep(1)}>
            {t("ob_btn_back")}
          </button>
        </>
      )}
    </div>
  );
}
