import { useNavigate } from "react-router-dom";
import topicsData from "../content/topics.json";
import type { Topic } from "../engine/types";
import { loadProgress, getOverdueReviewIds } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";
import type { StringKey } from "../i18n/strings";
import { FREE_TOPIC_IDS, getAccuracyPct } from "../topicVisuals";
import RecommendedTopicCard from "../components/RecommendedTopicCard";
import ReviewCard from "../components/ReviewCard";
import StatCard from "../components/ui/StatCard";
import TopicCard from "../components/TopicCard";
import { evaluateSquad, countUnlocked } from "../engine/squad";
import { getKaizenSummary } from "../engine/kaizenProgress";
import { getTodaysMission } from "../engine/missionComposer";
import { computeIngressoReadiness } from "../engine/skillProgressTracker";

const topics = topicsData as Topic[];

function streakMilestoneKey(streak: number): StringKey | null {
  if (streak >= 14) return "home_streak_14";
  if (streak >= 7) return "home_streak_7";
  if (streak >= 3) return "home_streak_3";
  return null;
}

export default function ChildHome() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const state = loadProgress();
  const isPremium = state.parent.isPremium ?? false;
  const streak = state.streak.count;
  const sessionsToday = state.sessions.filter((s) => {
    if (!s.endedAt) return false;
    return new Date(s.endedAt).toDateString() === new Date().toDateString();
  });

  const recommended = pickRecommendedTopic(state.topicAccuracy, isPremium);
  const sessionCount = sessionsToday.length;
  const sessionWord = sessionCount === 1 ? t("home_sessions_one") : t("home_sessions_many");

  const milestoneKey = streakMilestoneKey(streak);
  const reviewCount = getOverdueReviewIds(state).length;

  const squad = evaluateSquad(state.topicAccuracy, state.sessions.length);
  const squadUnlocked = countUnlocked(squad);
  const squadTotal = squad.length;

  const streakLabel = streak === 1 ? t("home_streak_days_one") : t("home_streak_days_many");

  const readiness = computeIngressoReadiness(state.skillProgress);
  const kaizenSummary = getKaizenSummary();
  const kaizenDelta = kaizenSummary.delta;
  const hasPractice = Object.keys(state.skillProgress).length > 0;
  const todaysMission = hasPractice ? getTodaysMission(state.skillProgress) : null;

  function handleTopicClick(topic: Topic) {
    const isLocked = !isPremium && !FREE_TOPIC_IDS.has(topic.id);
    navigate(isLocked ? "/parent" : "/lesson/" + topic.id);
  }

  return (
    <div className="screen-enter home-screen">
      <div className="home-screen__intro">
        <h1 className="screen-title">{t("home_title")}</h1>
        <p className="screen-sub">{t("home_sub")}</p>
      </div>

      <section className={`home-top-zone${reviewCount > 0 ? " has-review" : ""}`}>
        <div className="home-stats">
          <div className={`streak-hero-card ${Boolean(milestoneKey) ? "streak-pulse" : ""}`.trim()}>
            <span className="streak-hero-card__flame">🔥</span>
            <span className="streak-hero-card__num">{streak}</span>
            <span className="streak-hero-card__label">{streakLabel}</span>
          </div>
          <StatCard label={t("home_today")} value={`${sessionCount} ${sessionWord}`} />
        </div>
        {reviewCount > 0 && (
          <div className="home-review-slot">
            <ReviewCard count={reviewCount} />
          </div>
        )}
      </section>

      {milestoneKey && <div className="milestone-note streak-pulse">{t(milestoneKey)}</div>}

      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--text-soft)", marginBottom: 2 }}>{t("kaizen_readiness_label")}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--brand)" }}>{readiness}%</div>
          {kaizenDelta !== 0 && (
            <div
              style={{
                fontSize: 12,
                color: kaizenDelta > 0 ? "var(--success)" : "var(--warning)",
                marginTop: 2,
              }}
            >
              {kaizenDelta > 0
                ? t("kaizen_delta_up", { delta: String(kaizenDelta) })
                : t("kaizen_delta_down", { delta: String(kaizenDelta) })}
            </div>
          )}
        </div>
        <button
          className="btn btn-soft"
          style={{ flexShrink: 0, fontSize: 13, padding: "8px 14px" }}
          onClick={() => navigate("/simulacro/mini")}
        >
          📊 {t("sim_btn_mini")}
        </button>
      </div>

      {todaysMission && todaysMission.blocks.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid var(--brand)", paddingLeft: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{t("mission_today_title")}</div>
          <div style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>
            {t("mission_today_blocks", {
              n: String(todaysMission.blocks.length),
              min: String(todaysMission.estimatedMinutes),
            })}
          </div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {todaysMission.blocks.slice(0, 3).map((block, i) => (
              <div key={i} style={{ fontSize: 13 }}>
                <span style={{ color: "var(--brand)", fontWeight: 600 }}>
                  {block.type === "confidence_win"
                    ? "✅"
                    : block.type === "repair"
                      ? "🔧"
                      : block.type === "challenge"
                        ? "🏆"
                        : "📚"}
                </span>{" "}
                {block.skillTitleEs}
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="academy-teaser" onClick={() => navigate("/academy")}>
        <span className="academy-teaser__emoji" aria-hidden>
          ⚽
        </span>
        <span className="academy-teaser__body">
          <span className="academy-teaser__title">{t("home_academy_title")}</span>
          <span className="academy-teaser__sub">{t("home_academy_sub")}</span>
        </span>
        <span className="academy-teaser__count">
          {squadUnlocked}/{squadTotal}
        </span>
      </button>

      <RecommendedTopicCard
        topic={recommended}
        progressPct={getAccuracyPct(state.topicAccuracy, recommended.id)}
        onStart={() => handleTopicClick(recommended)}
      />

      <h2 className="section-heading">{t("home_other_topics")}</h2>
      <div className="home-topic-rail">
        {topics
          .filter((topic) => topic.id !== recommended.id)
          .map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isPremium={isPremium}
              progressPct={getAccuracyPct(state.topicAccuracy, topic.id)}
              onClick={() => handleTopicClick(topic)}
              compact
            />
          ))}
      </div>
    </div>
  );
}

function pickRecommendedTopic(
  accuracy: Record<string, { correct: number; total: number }>,
  isPremium: boolean
): Topic {
  const available = isPremium ? topics : topics.filter((t) => FREE_TOPIC_IDS.has(t.id));
  let worst: { id: string; ratio: number } | null = null;
  for (const topic of available) {
    const a = accuracy[topic.id];
    if (!a || a.total === 0) continue;
    const ratio = a.correct / a.total;
    if (worst === null || ratio < worst.ratio) worst = { id: topic.id, ratio };
  }
  if (worst) return available.find((topic) => topic.id === worst.id) ?? available[0];
  return available[0];
}
