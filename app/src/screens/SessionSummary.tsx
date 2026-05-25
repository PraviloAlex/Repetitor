import { lazy, Suspense, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import topicsData from "../content/topics.json";
import type { Topic } from "../engine/types";
import { getSessionById } from "../storage/localProgress";
import { buildRecommendationKey } from "../engine/recommendationEngine";
import { formatMinutes } from "../engine/sessionTracker";
import { SKILLS_BY_ID } from "../engine/skills";
import { getSkillMastery, buildSkillMastery, type SkillMasteryStatus } from "../engine/skillMastery";
import { getSkillTitleRu, getSkillRepairRu } from "../i18n/skillLabels";
import { loadProgress } from "../storage/localProgress";
import { computeIngressoReadiness } from "../engine/skillProgressTracker";
import { useI18n } from "../i18n/I18nContext";
import type { StringKey } from "../i18n/strings";
import Badge from "../components/ui/Badge";

const SummaryHeroCard = lazy(() => import("../components/summary/SummaryHeroCard"));
const SummaryDetailCards = lazy(() => import("../components/summary/SummaryDetailCards"));

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

export default function SessionSummary() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const { pick, t, lang } = useI18n();
  const session = useMemo(() => getSessionById(sessionId), [sessionId]);
  const topic = useMemo(
    () => topics.find((tp) => tp.id === session?.topicId),
    [session]
  );
  const progressState = useMemo(() => loadProgress(), [sessionId]);

  if (!session || !topic) {
    return (
      <div>
        <p>{t("not_found_session")}</p>
        <button className="btn" onClick={() => navigate("/")}>{t("not_found_back")}</button>
      </div>
    );
  }

  const fmtParts = {
    secondsTpl: t("fmt_seconds"),
    minutesTpl: t("fmt_minutes"),
    minutesSecondsTpl: t("fmt_minutes_seconds")
  };

  const accuracy =
    session.questionsAnswered === 0
      ? 0
      : Math.round((session.correctAnswers / session.questionsAnswered) * 100);

  const recKey = buildRecommendationKey(session, topic);
  const recText = t(("rec_" + recKey) as Parameters<typeof t>[0], { topic: pick(topic.title) });
  const confettiPieces = ["#2563eb", "#16a34a", "#facc15", "#db2777", "#f97316", "#7c3aed"];

  const weakSkills = Array.from(new Set(session.wrongSkillTags))
    .flatMap((skillId) => {
      const skill = SKILLS_BY_ID.get(skillId);
      return skill ? [{ skillId, skill }] : [];
    })
    .slice(0, 3);

  const missionSkill = session.missionSkillId ? SKILLS_BY_ID.get(session.missionSkillId) : null;
  const missionMastery = session.missionSkillId ? getSkillMastery(progressState, session.missionSkillId) : null;
  const missionOk = missionSkill && !session.wrongSkillTags.includes(missionSkill.id) && accuracy >= 70;

  const allMastery = buildSkillMastery(progressState);
  const masteryById = new Map(allMastery.map((m) => [m.skill.id, m]));

  // ── Ingreso narrative ──────────────────────────────────────────────────
  // Find a skill that improved this session (was needs_review, now stable+)
  const improvedSkill = useMemo(() => {
    const practiced = session.practicedSkillTags ?? [];
    for (const sid of practiced) {
      const mastery = masteryById.get(sid);
      if (mastery && (mastery.status === "stable" || mastery.status === "mastered")) {
        if (!session.wrongSkillTags.includes(sid)) return mastery.skill;
      }
    }
    return null;
  }, [session, masteryById]);

  const primaryWeakSkill = weakSkills[0] ?? null;

  const ingressoReadiness = useMemo(
    () => computeIngressoReadiness(progressState.skillProgress),
    [progressState.skillProgress]
  );
  const practicedSkillsInSession = (session.practicedSkillTags ?? [])
    .filter((id) => masteryById.has(id))
    .slice(0, 5)
    .map((id) => ({ id, mastery: masteryById.get(id)! }));

  function skillTitle(titleEs: string, skillId: string): string {
    return lang === "ru" ? getSkillTitleRu(skillId, titleEs) : titleEs;
  }

  function skillHint(skillId: string, repairEs: string | undefined): string {
    return lang === "ru"
      ? getSkillRepairRu(skillId, repairEs)
      : (repairEs ?? "Revisar el procedimiento paso a paso.");
  }

  function shareToWhatsApp() {
    const topicName = pick(topic!.title);
    const text =
      t("sum_share_text_head") + "\n" +
      t("sum_share_topic", { topic: topicName }) + "\n" +
      t("sum_share_correct", { correct: session!.correctAnswers, total: session!.questionsAnswered, accuracy }) + "\n" +
      t("sum_share_focused", { time: formatMinutes(session!.activeSeconds, fmtParts) }) + "\n" +
      t("sum_share_screen", { time: formatMinutes(session!.totalSeconds, fmtParts) }) + "\n" +
      (session!.pauseCount > 0 ? t("sum_share_pauses", { n: session!.pauseCount }) + "\n" : "") +
      "\n" + recText;
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener");
  }

  const achievements = (
    <div className="achievement-grid">
      <div className="achievement-card">{"🔥"} {t("sum_achievement_streak")}</div>
      {session.hintsUsed === 0 && <div className="achievement-card">{"⚡"} {t("sum_achievement_no_hints")}</div>}
      {accuracy === 100 && <div className="achievement-card">{"💯"} {t("sum_achievement_perfect")}</div>}
    </div>
  );

  const timeStats = (
    <div className="card">
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">{t("sum_focused")}</div>
          <div className="stat-value">{formatMinutes(session.activeSeconds, fmtParts)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">{t("sum_on_screen")}</div>
          <div className="stat-value">{formatMinutes(session.totalSeconds, fmtParts)}</div>
        </div>
      </div>
      {(session.pauseCount > 0 || session.focusLossCount > 0) && (
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {session.pauseCount > 0 && t("sum_pauses_label", { n: session.pauseCount }) + " "}
          {session.focusLossCount > 0 && t("sum_background_label", { n: session.focusLossCount })}
        </p>
      )}
    </div>
  );

  const familyRecommendation = (
    <div className="card">
      <strong>{t("sum_for_family")}</strong>
      <p style={{ marginTop: 8 }}>{recText}</p>
      {primaryWeakSkill && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 10 }}
          onClick={() => navigate(`/parent/dashboard?skill=${encodeURIComponent(primaryWeakSkill.skillId)}&from=${encodeURIComponent(session.id)}`)}
        >
          {t("sum_parent_next_step")}
        </button>
      )}
    </div>
  );

  const missionResult = missionSkill ? (
    <div className="card">
      <strong>{missionOk ? t("sum_mission_done") : t("sum_mission_in_progress")}</strong>
      <p style={{ margin: "8px 0 0" }}>
        {skillTitle(missionSkill.titleEs, missionSkill.id)}
        {missionMastery?.accuracy != null
          ? ` · ${t("sum_mastery_pct", { pct: String(missionMastery.accuracy) })}`
          : ""}
      </p>
      <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
        {missionOk
          ? t("sum_mission_ok_hint")
          : skillHint(missionSkill.id, missionSkill.repairExplanationEs)}
      </p>
    </div>
  ) : undefined;

  const practicedSkills = practicedSkillsInSession.length > 0 ? (
    <div className="card">
      <strong>{t("sum_skills_section")}</strong>
      {practicedSkillsInSession.map(({ id, mastery }) => (
        <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{skillTitle(mastery.skill.titleEs, id)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {mastery.accuracy !== null && (
              <span style={{ fontSize: 12, color: "var(--text-soft)" }}>{mastery.accuracy}%</span>
            )}
            <Badge variant={STATUS_BADGE[mastery.status]}>{t(STATUS_KEY[mastery.status])}</Badge>
          </div>
        </div>
      ))}
    </div>
  ) : undefined;

  const weakSkillsCard = weakSkills.length > 0 ? (
    <div className="card">
      <strong>{t("sum_repeat_tomorrow")}</strong>
      {weakSkills.map(({ skillId, skill }) => (
        <div key={skillId} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700 }}>{skillTitle(skill.titleEs, skillId)}</div>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
            {skillHint(skillId, skill.repairExplanationEs)}
          </p>
        </div>
      ))}
    </div>
  ) : undefined;

  return (
    <div className="screen-enter">
      {accuracy >= 80 && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 71) % 100}%`,
                background: confettiPieces[i % confettiPieces.length],
                animationDelay: `${(i % 4) * 40}ms`,
              }}
            />
          ))}
        </div>
      )}

      <Suspense fallback={<div className="card">Cargando...</div>}>
        <SummaryHeroCard
          accuracy={accuracy}
          correctAnswers={session.correctAnswers}
          questionsAnswered={session.questionsAnswered}
          title={t("sum_title")}
          subtitle={t("sum_sub", { topic: pick(topic.title) })}
        />
      </Suspense>

      {/* ── Ingreso Narrative Card ─────────────────────────────────────── */}
      <div className="card" style={{ borderLeft: "4px solid var(--brand)", paddingLeft: 16 }}>
        {/* Hero line */}
        <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
          {improvedSkill
            ? t("sum_ingreso_improved", { skill: skillTitle(improvedSkill.titleEs, improvedSkill.id) })
            : primaryWeakSkill === null
              ? t("sum_ingreso_session_good")
              : t("sum_ingreso_session_good")}
        </p>

        {/* Weakness line */}
        {primaryWeakSkill ? (
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-soft)" }}>
            {t("sum_ingreso_weakness", { skill: skillTitle(primaryWeakSkill.skill.titleEs, primaryWeakSkill.skillId) })}
          </p>
        ) : (
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--success)" }}>
            {t("sum_ingreso_no_weakness")}
          </p>
        )}

        {/* Repair line — what's coming back tomorrow */}
        {primaryWeakSkill && (
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--brand)" }}>
            {t("sum_ingreso_tomorrow")}
          </p>
        )}

        {/* XP + readiness */}
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          {session.xpEarned != null && session.xpEarned > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)" }}>
              {t("sum_ingreso_xp_earned", { xp: String(session.xpEarned) })}
            </span>
          )}
          {ingressoReadiness > 0 && (
            <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
              {t("sum_ingreso_readiness", { pct: String(ingressoReadiness) })}
            </span>
          )}
        </div>
      </div>

      <Suspense fallback={<div className="card">Cargando...</div>}>
        <SummaryDetailCards
          achievements={achievements}
          timeStats={timeStats}
          familyRecommendation={familyRecommendation}
          missionResult={missionResult}
          practicedSkills={practicedSkills}
          weakSkills={weakSkillsCard}
        />
      </Suspense>

      <button className="btn" onClick={() => navigate("/lesson/" + topic.id)}>
        {t("btn_practice")}
      </button>
      <div style={{ height: 12 }} />
      <button className="btn btn-soft" onClick={() => navigate("/")}>
        {t("sum_home")}
      </button>
      <div style={{ height: 12 }} />
      <button className="btn btn-ghost" onClick={shareToWhatsApp}>
        {t("sum_share_whatsapp")}
      </button>
    </div>
  );
}
