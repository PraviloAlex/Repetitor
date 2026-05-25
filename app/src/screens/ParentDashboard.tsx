import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PrimaryButton from "../components/ui/PrimaryButton";
import { SKILLS_BY_ID } from "../engine/skills";
import { useI18n } from "../i18n/I18nContext";
import {
  buildParentDashboardInsight,
  type ParentStatus,
  type ProgressTrend,
  type RiskLevel,
} from "../lib/parentAnalytics";
import { loadProgress, setParentSettings } from "../storage/localProgress";

function statusClass(status: ParentStatus): string {
  if (status === "stable") return "is-stable";
  if (status === "attention") return "is-attention";
  if (status === "needs_help") return "is-needs-help";
  return "is-empty";
}

function riskClass(risk: RiskLevel): string {
  if (risk === "high") return "risk-high";
  if (risk === "medium") return "risk-medium";
  return "risk-low";
}

function riskLabel(risk: RiskLevel, lang: "ru" | "es"): string {
  if (lang === "ru") {
    if (risk === "high") return "высокий";
    if (risk === "medium") return "средний";
    return "низкий";
  }
  if (risk === "high") return "alto";
  if (risk === "medium") return "medio";
  return "bajo";
}

function trendLabel(trend: ProgressTrend, lang: "ru" | "es"): string {
  if (lang === "ru") {
    if (trend === "improving") return "растет";
    if (trend === "declining") return "снижается";
    if (trend === "stable") return "стабильно";
    return "мало данных";
  }
  if (trend === "improving") return "mejorando";
  if (trend === "declining") return "bajando";
  if (trend === "stable") return "estable";
  return "pocos datos";
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, t } = useI18n();
  const state = loadProgress();
  const [mode, setMode] = useState<"primaria" | "ingreso">(state.parent.mode === "ingreso" ? "ingreso" : "primaria");
  const insight = useMemo(
    () => buildParentDashboardInsight(state, lang),
    [lang, state.sessions.length, Object.keys(state.skillProgress).length]
  );
  const hasLearningData = state.sessions.length > 0;

  if (!state.parent.pinHash) {
    navigate("/parent", { replace: true });
    return null;
  }

  const ui = {
    title: lang === "ru" ? "Кабинет родителя" : "Panel para familias",
    sub:
      lang === "ru"
        ? "Короткий вывод за 10 секунд: как дела сейчас, где риск и что делать дальше."
        : "Lectura en 10 segundos: como va, donde esta el riesgo y que conviene hacer.",
    trust: lang === "ru" ? "Вывод сегодня" : "Resumen de hoy",
    next: lang === "ru" ? "Следующий шаг" : "Proximo paso",
    weak: lang === "ru" ? "Навыки для усиления" : "Habilidades a reforzar",
    trend: lang === "ru" ? "Динамика" : "Tendencia",
    explain: lang === "ru" ? "Как считаем" : "Como calculamos",
    noData:
      lang === "ru"
        ? "Пока мало данных. После 1-2 занятий появятся выводы."
        : "Todavia hay pocos datos. Despues de 1-2 sesiones apareceran conclusiones.",
    metricAccuracy: lang === "ru" ? "Точность" : "Precision",
    metricDays: lang === "ru" ? "Активные дни" : "Dias activos",
    metricTasks: lang === "ru" ? "Решено задач" : "Tareas resueltas",
    metricWeak: lang === "ru" ? "Навыки в риске" : "Habilidades en riesgo",
    weakReason: lang === "ru" ? "Почему" : "Por que",
    weakAction: lang === "ru" ? "Что делать" : "Accion",
    weakPractice: lang === "ru" ? "Исправить сейчас" : "Practicar ahora",
    dashboardHome: lang === "ru" ? "На главную" : "Inicio",
    weakTrend: lang === "ru" ? "Изменение слабого навыка" : "Cambio de la habilidad en riesgo",
    recommendation: lang === "ru" ? "Рекомендация недели" : "Recomendacion de la semana",
    recMaintenance:
      lang === "ru"
        ? "Пока все стабильно. Держите 1 короткую сессию в неделю."
        : "Todo estable por ahora. Manten una sesion corta por semana.",
    weakTrendDelta: lang === "ru" ? "Дельта за 7 дней" : "Delta 7 dias",
    weakTrendNoPoint: lang === "ru" ? "нет данных" : "sin datos",
    noAccuracy: "-",
    noDelta: "-",
    pointsUnit: "pp",
    activeDaysCaption:
      lang === "ru"
        ? "Дни с реальной практикой за последнюю неделю."
        : "Dias con practica real en la ultima semana.",
    explainText:
      lang === "ru"
        ? "Учитываем точность, повторяющиеся ошибки, недавние сессии и статус повторения. Вывод строится на реальных данных прогресса."
        : "Combinamos precision, errores repetidos, sesiones recientes y estado de repaso. La conclusion usa datos reales de progreso.",
  };

  const targetTopic = insight.nextStep.targetSkill
    ? SKILLS_BY_ID.get(insight.nextStep.targetSkill)?.topicId
    : undefined;
  const linkedSkillId = searchParams.get("skill") ?? "";
  const linkedSkill = SKILLS_BY_ID.get(linkedSkillId);
  const effectiveNextStep =
    linkedSkill != null
      ? {
          ...insight.nextStep,
          title: lang === "ru" ? "Следующий шаг из последней сессии" : "Siguiente paso de la ultima sesion",
          description:
            lang === "ru"
              ? `После последнего урока лучше сразу закрепить навык "${linkedSkill.titleEs}" на простом уровне.`
              : `Despues de la ultima sesion conviene reforzar "${linkedSkill.titleEs}" con nivel simple.`,
          actionLabel:
            lang === "ru"
              ? `Начать тренировку: ${linkedSkill.titleEs}`
              : `Practicar ahora: ${linkedSkill.titleEs}`,
          targetSkill: linkedSkill.id,
          difficulty: "easy" as const,
        }
      : insight.nextStep;
  const effectiveTargetSkill = effectiveNextStep.targetSkill;
  const effectiveTargetTopic = effectiveTargetSkill ? SKILLS_BY_ID.get(effectiveTargetSkill)?.topicId : targetTopic;
  const lessonUrl = effectiveTargetTopic
    ? `/lesson/${effectiveTargetTopic}?skill=${encodeURIComponent(effectiveTargetSkill ?? "")}`
    : "/topics";

  const childNick = state.parent.childNick ?? "";
  const n = insight.nextStep.sessionsRecommended;
  const primaryWeakName = insight.weakSkills[0]?.skillName ?? "";
  const recSessionsText =
    n === 1
      ? lang === "ru"
        ? `Рекомендуем 1 сессию на этой неделе по навыку "${primaryWeakName}".`
        : `Recomendamos 1 sesion esta semana para "${primaryWeakName}".`
      : lang === "ru"
        ? `Рекомендуем ${n} сессии на этой неделе по навыку "${primaryWeakName}".`
        : `Recomendamos ${n} sesiones esta semana para "${primaryWeakName}".`;

  return (
    <div className="screen-enter parent-trust-screen">
      <h1 className="screen-title">{ui.title}</h1>
      <p className="screen-sub">{ui.sub}</p>

      <section className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-soft)", marginBottom: 8 }}>{t("pd_mode_title")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={`btn ${mode === "primaria" ? "" : "btn-ghost"}`}
            style={{ minWidth: 130 }}
            onClick={() => {
              setParentSettings({ mode: "primaria", goal: "refuerzo", level: "B" });
              setMode("primaria");
            }}
          >
            {t("pd_mode_primaria")}
          </button>
          <button
            className={`btn ${mode === "ingreso" ? "" : "btn-ghost"}`}
            style={{ minWidth: 130 }}
            onClick={() => {
              setParentSettings({ mode: "ingreso", goal: "ingreso", level: "C" });
              setMode("ingreso");
            }}
          >
            {t("pd_mode_ingreso")}
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-soft)" }}>
          {mode === "primaria" ? t("pd_mode_primaria_note") : t("pd_mode_ingreso_note")}
        </div>
      </section>

      <section className={`parent-trust-summary ${statusClass(insight.status)}`}>
        <div className="parent-trust-summary__head">{ui.trust}</div>
        <h2>{insight.statusTitle}</h2>
        <p>{insight.statusReason}</p>
        <div className="parent-trust-summary__next">
          <strong>{ui.next}:</strong> {effectiveNextStep.description}
        </div>
        {linkedSkill && (
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-soft)" }}>
            {t("pd_source_from_session", { skill: linkedSkill.titleEs })}
          </p>
        )}
        <div className="parent-trust-summary__cta">
          <Link to={lessonUrl}>
            <PrimaryButton>{effectiveNextStep.actionLabel}</PrimaryButton>
          </Link>
        </div>
      </section>

      {!hasLearningData && (
        <section className="parent-trust-card">
          <div className="parent-trust-card__title">{lang === "ru" ? "Пока мало данных" : "Aun hay pocos datos"}</div>
          <p>
            {lang === "ru"
              ? "Чтобы появилась понятная аналитика, сделайте 1 короткую сессию на 8-12 минут. После этого здесь появятся слабые навыки, динамика и следующий шаг."
              : "Para ver analitica clara, hace 1 sesion corta de 8-12 minutos. Despues vas a ver habilidades en riesgo, tendencia y siguiente paso."}
          </p>
        </section>
      )}

      <section className="parent-trust-grid parent-trust-numbers">
        <div className="parent-trust-card">
          <span>{ui.metricAccuracy}</span>
          <strong>{insight.metrics.accuracy == null ? ui.noAccuracy : `${insight.metrics.accuracy}%`}</strong>
          <p>{insight.explainers.accuracy}</p>
        </div>
        <div className="parent-trust-card">
          <span>{ui.metricDays}</span>
          <strong>{insight.metrics.activeDays ?? 0}</strong>
          <p>{ui.activeDaysCaption}</p>
        </div>
        <div className="parent-trust-card">
          <span>{ui.metricTasks}</span>
          <strong>{insight.metrics.completedTasks ?? 0}</strong>
          <p>{insight.explainers.streak}</p>
        </div>
        <div className="parent-trust-card">
          <span>{ui.metricWeak}</span>
          <strong>{insight.metrics.weakSkillsCount}</strong>
          <p>{insight.explainers.weakSkills}</p>
        </div>
      </section>

      <section className="parent-trust-card parent-trust-weak">
        <div className="parent-trust-card__title">{ui.weak}</div>
        {insight.weakSkills.length === 0 ? (
          <p>{ui.noData}</p>
        ) : (
          <div className="parent-trust-weak-list">
            {insight.weakSkills.slice(0, 3).map((skill) => {
              const topicId = SKILLS_BY_ID.get(skill.skillId)?.topicId;
              const weakSkillUrl = topicId
                ? `/lesson/${topicId}?skill=${encodeURIComponent(skill.skillId)}`
                : "/topics";
              return (
                <article key={skill.skillId} className="parent-trust-weak-item">
                  <header>
                    <strong>{skill.skillName}</strong>
                    <span className={`risk-chip ${riskClass(skill.risk)}`}>{riskLabel(skill.risk, lang)}</span>
                  </header>
                  <p>
                    <b>{ui.weakReason}:</b> {skill.reason}
                  </p>
                  <p>
                    <b>{ui.weakAction}:</b> {skill.nextStep}
                  </p>
                  <div className="parent-trust-weak-item__cta">
                    <Link to={weakSkillUrl}>
                      <PrimaryButton variant="ghost">{ui.weakPractice}</PrimaryButton>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="parent-trust-card" style={{ borderLeft: "4px solid var(--brand)", paddingLeft: 14 }}>
        <div className="parent-trust-card__title" style={{ marginBottom: 6 }}>
          {ui.recommendation}
        </div>
        {insight.weakSkills.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14 }}>{ui.recMaintenance}</p>
        ) : (
          <p style={{ margin: 0, fontSize: 14 }}>
            {childNick && <strong>{childNick}: </strong>}
            {recSessionsText}
          </p>
        )}
        <div style={{ marginTop: 10 }}>
          <Link to={lessonUrl}>
            <PrimaryButton variant="ghost" style={{ fontSize: 13 }}>
              {effectiveNextStep.actionLabel}
            </PrimaryButton>
          </Link>
        </div>
      </section>

      <section className="parent-trust-grid">
        <article className="parent-trust-card">
          <div className="parent-trust-card__title">{ui.trend}</div>
          <strong className="parent-trend-label">{trendLabel(insight.trend, lang)}</strong>
          <p>{insight.trendExplanation}</p>
        </article>
        <article className="parent-trust-card">
          <div className="parent-trust-card__title">{ui.explain}</div>
          <p>{ui.explainText}</p>
        </article>
      </section>

      {insight.weakSkillTrend && (
        <section className="parent-trust-card parent-trust-skill-trend">
          <div className="parent-trust-card__title">{ui.weakTrend}</div>
          <div className="parent-trust-skill-trend__head">
            <strong>{insight.weakSkillTrend.skillName}</strong>
            <span>
              {ui.weakTrendDelta}:{" "}
              {insight.weakSkillTrend.delta7d == null
                ? ui.noDelta
                : `${insight.weakSkillTrend.delta7d > 0 ? "+" : ""}${insight.weakSkillTrend.delta7d} ${ui.pointsUnit}`}
            </span>
          </div>
          <div className="parent-trust-sparkline" aria-hidden="true">
            {insight.weakSkillTrend.points.map((point, index) => {
              const height = point.accuracy == null ? 10 : Math.max(10, Math.round(point.accuracy));
              return (
                <span
                  key={point.date + index}
                  className={`parent-trust-sparkline__bar${point.accuracy != null && point.accuracy >= 70 ? " is-up" : ""}`}
                  style={{ height: `${height}%` }}
                  title={point.accuracy == null ? ui.weakTrendNoPoint : `${point.accuracy}%`}
                />
              );
            })}
          </div>
          <p>{insight.weakSkillTrend.explanation}</p>
        </section>
      )}

      <div className="parent-trust-footer">
        <Link to="/">
          <PrimaryButton variant="ghost">{ui.dashboardHome}</PrimaryButton>
        </Link>
      </div>
    </div>
  );
}
