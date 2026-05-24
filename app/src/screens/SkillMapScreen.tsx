import { useState } from "react";
import { useNavigate } from "react-router-dom";
import topicsData from "../content/topics.json";
import type { Topic } from "../engine/types";
import { buildSkillMastery, type SkillMasteryStatus } from "../engine/skillMastery";
import { buildDailyMission } from "../engine/dailyMission";
import { SKILLS_BY_ID } from "../engine/skills";
import { formatMinutes } from "../engine/sessionTracker";
import { loadProgress } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";
import type { StringKey } from "../i18n/strings";
import { getSkillTitleRu, getSkillRepairRu } from "../i18n/skillLabels";
import Badge from "../components/ui/Badge";

const topics = topicsData as Topic[];

const STATUS_BADGE: Record<SkillMasteryStatus, "neutral" | "primary" | "success" | "warning" | "review"> = {
  new: "neutral",
  learning: "primary",
  stable: "success",
  mastered: "success",
  needs_review: "warning",
  challenge_ready: "review",
  blocked: "neutral",
};

const STATUS_KEY: Record<SkillMasteryStatus, StringKey> = {
  new: "skill_status_new",
  learning: "skill_status_learning",
  stable: "skill_status_stable",
  mastered: "skill_status_mastered",
  needs_review: "skill_status_needs_review",
  challenge_ready: "skill_status_challenge_ready",
  blocked: "skill_status_blocked",
};

function formatLastPracticed(
  isoDate: string | undefined,
  t: (key: StringKey, vars?: Record<string, string>) => string
): string {
  if (!isoDate) return t("skill_map_last_practiced_never");
  const then = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t("skill_map_last_practiced_today");
  if (diffDays === 1) return t("skill_map_last_practiced_yesterday");
  return t("skill_map_last_practiced_days", { n: String(diffDays) });
}

function buildSkillTrend(state: ReturnType<typeof loadProgress>, skillId: string): Array<0 | 40 | 100> {
  const sessions = state.sessions
    .filter((session) => (session.practicedSkillTags ?? []).includes(skillId) || session.wrongSkillTags.includes(skillId))
    .slice(-5);
  const points = sessions.map((session) => (session.wrongSkillTags.includes(skillId) ? 40 : 100)) as Array<0 | 40 | 100>;
  while (points.length < 5) points.unshift(0);
  return points;
}

function buildMissionHistory(state: ReturnType<typeof loadProgress>) {
  return state.sessions
    .filter((session) => !!session.missionSkillId)
    .slice(-5)
    .reverse()
    .map((session) => {
      const answered = Math.max(session.questionsAnswered, 1);
      const accuracy = Math.round((session.correctAnswers / answered) * 100);
      const missionSkillId = session.missionSkillId ?? "";
      const done = !session.wrongSkillTags.includes(missionSkillId) && accuracy >= 70;
      const mission = missionSkillId ? SKILLS_BY_ID.get(missionSkillId) : null;
      return {
        id: session.id,
        done,
        title: mission?.titleEs ?? missionSkillId,
        kind: session.missionKind ?? "consolidate",
        accuracy,
        endedAt: session.endedAt,
        activeSeconds: session.activeSeconds,
      };
    });
}

export default function SkillMapScreen() {
  const navigate = useNavigate();
  const { pick, t, lang } = useI18n();
  const state = loadProgress();
  const mastery = buildSkillMastery(state);
  const missionHistory = buildMissionHistory(state);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const fmtParts = {
    secondsTpl: t("fmt_seconds"),
    minutesTpl: t("fmt_minutes"),
    minutesSecondsTpl: t("fmt_minutes_seconds"),
  };

  const masteryById = new Map(mastery.map((m) => [m.skill.id, m]));

  const dailyMissionByTopic = new Map<string, string>();
  for (const topic of topics) {
    const mission = buildDailyMission(topic.id, state);
    if (mission) dailyMissionByTopic.set(topic.id, mission.focusSkillId);
  }

  function formatMissionDate(isoDate: string | undefined): string {
    if (!isoDate) return lang === "ru" ? "без даты" : "sin fecha";
    return new Date(isoDate).toLocaleDateString(lang === "ru" ? "ru-RU" : "es-AR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  function missionKindLabel(kind: string): string {
    const key = `lesson_mission_kind_${kind}` as StringKey;
    return t(key);
  }

  function trendTooltip(value: 0 | 40 | 100): string {
    if (value === 100) return lang === "ru" ? "успех" : "exito";
    if (value === 40) return lang === "ru" ? "ошибка" : "error";
    return lang === "ru" ? "без практики" : "sin practica";
  }

  function handleNodeClick(skillId: string, topicId: string) {
    if (expandedSkillId === skillId) {
      navigate(`/lesson/${topicId}?skill=${encodeURIComponent(skillId)}`);
    } else {
      setExpandedSkillId(skillId);
    }
  }

  return (
    <div className="screen-enter">
      <h1 className="screen-title">{t("skill_map_title")}</h1>
      <p className="screen-sub">{t("skill_map_sub")}</p>

      <section className="mission-history-card">
        <div className="mission-history-card__head">
          <strong>{lang === "ru" ? "История миссий" : "Historial de misiones"}</strong>
          <span>{missionHistory.length}/5</span>
        </div>
        {missionHistory.length === 0 ? (
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {lang === "ru" ? "Пока нет выполненных миссий." : "Todavia no hay misiones registradas."}
          </p>
        ) : (
          <div className="mission-history-list">
            {missionHistory.map((entry) => (
              <div key={entry.id} className="mission-history-item">
                <span className={`mission-history-item__state ${entry.done ? "is-done" : "is-open"}`}>
                  {entry.done ? (lang === "ru" ? "сделано" : "hecha") : (lang === "ru" ? "в процессе" : "pendiente")}
                </span>
                <strong>{entry.title}</strong>
                <small>
                  {missionKindLabel(entry.kind)} &middot; {entry.accuracy}%
                </small>
                <small className="mission-history-item__meta">
                  {formatMissionDate(entry.endedAt)} &middot; {formatMinutes(entry.activeSeconds, fmtParts)}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="skill-map">
        {topics.map((topic) => {
          const topicSkills = mastery.filter((item) => item.skill.topicId === topic.id);
          if (topicSkills.length === 0) return null;
          const missionSkillId = dailyMissionByTopic.get(topic.id);

          return (
            <section key={topic.id} className="skill-map__section">
              <div className="skill-map__topic">
                <strong>{pick(topic.title)}</strong>
                <span>
                  {topicSkills.filter((item) => item.status === "mastered" || item.status === "stable").length}
                  /{topicSkills.length}
                </span>
              </div>

              <div className="skill-map__grid">
                {topicSkills.map((item) => {
                  const skillTitle =
                    lang === "ru"
                      ? getSkillTitleRu(item.skill.id, item.skill.titleEs)
                      : item.skill.titleEs;
                  const skillHint =
                    lang === "ru"
                      ? getSkillRepairRu(item.skill.id, item.skill.repairExplanationEs)
                      : (item.skill.repairExplanationEs ??
                          item.skill.typicalMistakes[0] ??
                          t("skill_map_default_hint"));
                  const isToday = item.skill.id === missionSkillId;
                  const isExpanded = expandedSkillId === item.skill.id;
                  const isBlocked = item.status === "blocked";
                  const lastPracticedLabel = formatLastPracticed(item.lastPracticedAt, t);

                  const blockingPrereq = isBlocked
                    ? item.skill.prerequisiteSkillIds
                        .map((id) => masteryById.get(id))
                        .find((m) => m && (m.status === "new" || m.status === "needs_review"))
                    : undefined;
                  const blockingPrereqName = blockingPrereq
                    ? lang === "ru"
                      ? getSkillTitleRu(blockingPrereq.skill.id, blockingPrereq.skill.titleEs)
                      : blockingPrereq.skill.titleEs
                    : undefined;

                  const nodeClass = [
                    "skill-node",
                    "skill-node--" + item.status.replace(/_/g, "-"),
                    isExpanded ? "skill-node--expanded" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={item.skill.id}
                      className={nodeClass}
                      onClick={() => handleNodeClick(item.skill.id, item.skill.topicId)}
                    >
                      <div className="skill-node__top">
                        <Badge variant={STATUS_BADGE[item.status]}>
                          {t(STATUS_KEY[item.status])}
                        </Badge>
                        <span>{item.accuracy === null ? "--" : item.accuracy + "%"}</span>
                      </div>

                      <strong>{skillTitle}</strong>

                      {isToday && !isExpanded && (
                        <span className="skill-node__today-badge">
                          {t("skill_map_mission_today")}
                        </span>
                      )}

                      {isBlocked && blockingPrereqName && !isExpanded && (
                        <p className="skill-node__prereq-label">
                          {t("skill_blocked_until", { skill: blockingPrereqName })}
                        </p>
                      )}

                      {isExpanded ? (
                        <div className="skill-node__detail">
                          <div className="skill-node__trend" aria-hidden="true">
                            {buildSkillTrend(state, item.skill.id).map((value, trendIndex) => (
                              <span
                                key={trendIndex}
                                className={`skill-node__trend-bar${value === 100 ? " is-strong" : value === 40 ? " is-weak" : ""}`}
                                style={{ height: `${Math.max(value, 12)}%` }}
                                title={trendTooltip(value)}
                              />
                            ))}
                          </div>
                          {isBlocked && blockingPrereqName ? (
                            <p className="skill-node__hint">
                              {t("skill_blocked_until", { skill: blockingPrereqName })}
                            </p>
                          ) : (
                            <p className="skill-node__hint">{skillHint}</p>
                          )}
                          <p className="skill-node__last-practiced">
                            {lastPracticedLabel}
                            {item.practiced > 0 && (
                              <span> &middot; {t("skill_map_practiced_count", { n: String(item.practiced) })}</span>
                            )}
                          </p>
                          <span className="skill-node__cta">
                            {t("skill_map_start_practice")} &rarr;
                          </span>
                        </div>
                      ) : (
                        !isBlocked && <p>{skillHint}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
