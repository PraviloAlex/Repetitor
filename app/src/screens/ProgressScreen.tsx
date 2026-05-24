import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { loadProgress } from "../storage/localProgress";
import { buildSkillMastery } from "../engine/skillMastery";
import { getWeakSkills } from "../engine/skillAnalytics";
import { getSkillTitleRu } from "../i18n/skillLabels";
import topicsData from "../content/topics.json";
import type { Topic } from "../engine/types";

const topics = topicsData as Topic[];

const TOPIC_COLORS: Record<string, string> = {
  operaciones: "#2563eb",
  divisibilidad: "#7c3aed",
  fracciones: "#db2777",
  decimales: "#ea580c",
  porcentajes: "#16a34a",
  geometria: "#0891b2",
};

/** Returns the last N calendar days as YYYY-MM-DD strings, today last. */
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Short weekday label for a YYYY-MM-DD date, in given locale. */
function dayLabel(isoDate: string, lang: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const locale = lang === "ru" ? "ru-RU" : "es-AR";
  return d.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");
}

export default function ProgressScreen() {
  const { t, lang, pick } = useI18n();
  const navigate = useNavigate();
  const state = loadProgress();
  const mastery = buildSkillMastery(state);
  const weakSkills = getWeakSkills(state, 3);

  // ── Top stats ──────────────────────────────────────────────────────────────
  const totalXp = state.sessions.reduce(
    (sum, s) => sum + (s.xpEarned ?? s.correctAnswers * 10),
    0
  );
  const totalCorrect = state.sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const streak = state.streak.count;

  // ── Activity chart (last 7 days) ───────────────────────────────────────────
  const days = useMemo(() => lastNDays(7), []);
  const todayIso = days[days.length - 1];

  const activityByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of state.sessions) {
      const day = s.startedAt.slice(0, 10);
      if (days.includes(day)) {
        map.set(day, (map.get(day) ?? 0) + s.questionsAnswered);
      }
    }
    return map;
  }, [state.sessions, days]);

  const maxQuestions = Math.max(1, ...Array.from(activityByDay.values()));

  // ── Topic mastery ──────────────────────────────────────────────────────────
  const topicStats = useMemo(() =>
    topics.map((topic) => {
      const skills = mastery.filter((m) => m.skill.topicId === topic.id);
      const done = skills.filter(
        (m) => m.status === "mastered" || m.status === "stable"
      ).length;
      return { topic, done, total: skills.length };
    }),
    [mastery]
  );

  const hasAnyActivity = state.sessions.length > 0;

  return (
    <div className="screen-enter">
      <h1 className="screen-title">{t("progress_title")}</h1>
      <p className="screen-sub">{t("progress_sub")}</p>

      {/* ── Stats row ── */}
      <div className="progress-stats-row">
        <div className="progress-stat-card progress-stat-card--streak">
          <span className="progress-stat-card__value">{streak}</span>
          <span className="progress-stat-card__label">{t("progress_stat_streak")}</span>
        </div>
        <div className="progress-stat-card progress-stat-card--xp">
          <span className="progress-stat-card__value">{totalXp}</span>
          <span className="progress-stat-card__label">{t("progress_stat_xp")}</span>
        </div>
        <div className="progress-stat-card progress-stat-card--correct">
          <span className="progress-stat-card__value">{totalCorrect}</span>
          <span className="progress-stat-card__label">{t("progress_stat_correct")}</span>
        </div>
      </div>

      {/* ── Activity chart ── */}
      <div className="card">
        <p className="section-title" style={{ margin: "0 0 12px" }}>
          {t("progress_activity_heading")}
        </p>
        {!hasAnyActivity ? (
          <p style={{ color: "var(--text-soft)", fontSize: 14 }}>{t("progress_no_activity")}</p>
        ) : (
          <div className="progress-chart">
            {days.map((day) => {
              const count = activityByDay.get(day) ?? 0;
              const heightPct = count === 0 ? 4 : Math.max(8, Math.round((count / maxQuestions) * 100));
              const isToday = day === todayIso;
              return (
                <div key={day} className="progress-chart__col">
                  <div className="progress-chart__bar-wrap">
                    <div
                      className={`progress-chart__bar${isToday ? " progress-chart__bar--today" : ""}`}
                      style={{ height: heightPct + "%" }}
                      title={String(count)}
                    />
                  </div>
                  <span className={`progress-chart__label${isToday ? " progress-chart__label--today" : ""}`}>
                    {dayLabel(day, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {hasAnyActivity && (
          <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 8, marginBottom: 0 }}>
            {t("progress_sessions", { n: String(state.sessions.length) })}
          </p>
        )}
      </div>

      {/* ── Topic mastery ── */}
      <div className="card">
        <p className="section-title" style={{ margin: "0 0 12px" }}>
          {t("progress_topics_heading")}
        </p>
        <div className="progress-topic-list">
          {topicStats.map(({ topic, done, total }) => {
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            const color = TOPIC_COLORS[topic.id] ?? "var(--primary)";
            return (
              <button
                key={topic.id}
                className="progress-topic-row"
                onClick={() => navigate("/lesson/" + topic.id)}
              >
                <div className="progress-topic-row__header">
                  <span className="progress-topic-row__name">{pick(topic.title)}</span>
                  <span className="progress-topic-row__pct" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className="progress-topic-row__track">
                  <div
                    className="progress-topic-row__fill"
                    style={{ width: pct + "%", background: color }}
                  />
                </div>
                <span className="progress-topic-row__sub">
                  {t("progress_skills_done", { done: String(done), total: String(total) })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Weak skills ── */}
      {weakSkills.length > 0 && (
        <div className="card">
          <p className="section-title" style={{ margin: "0 0 12px" }}>
            {t("progress_weak_heading")}
          </p>
          <div className="progress-weak-list">
            {weakSkills.map((item) => {
              const name = lang === "ru"
                ? getSkillTitleRu(item.skillId, item.titleEs)
                : item.titleEs;
              return (
                <div key={item.skillId} className="progress-weak-row">
                  <span className="progress-weak-row__name">{name}</span>
                  <span className="progress-weak-row__count">
                    {t("progress_weak_mistakes", { n: String(item.mistakes) })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
