import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import topicsData from "../content/topics.json";
import opsQuestions from "../content/questions/operaciones.json";
import divQuestions from "../content/questions/divisibilidad.json";
import fracQuestions from "../content/questions/fracciones.json";
import decQuestions from "../content/questions/decimales.json";
import pctQuestions from "../content/questions/porcentajes.json";
import geoQuestions from "../content/questions/geometria.json";
import type { Question, StudySession, Topic } from "../engine/types";
import { checkAnswer } from "../engine/answerChecker";
import { buildAdaptiveProfile } from "../engine/adaptiveDifficulty";
import { buildDailyMission, buildMissionForSkill, type DailyMissionKind } from "../engine/dailyMission";
import { createSessionSeed, generateForTopicWithOptions, type GeneratorOptions } from "../engine/generator";
import { formatMinutes, useSessionTracker } from "../engine/sessionTracker";
import { loadProgress, recordSession } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";
import type { StringKey } from "../i18n/strings";
import QuestionCard from "../components/QuestionCard";

const LessonIntroSection = lazy(() => import("../components/lesson/LessonIntroSection"));
const LessonQuestionHeader = lazy(() => import("../components/lesson/LessonQuestionHeader"));

const topics = topicsData as Topic[];

const questionsByTopic: Record<string, Question[]> = {
  operaciones: opsQuestions as Question[],
  divisibilidad: divQuestions as Question[],
  fracciones: fracQuestions as Question[],
  decimales: decQuestions as Question[],
  porcentajes: pctQuestions as Question[],
  geometria: geoQuestions as Question[],
};

const SESSION_SIZE = 10;
const GENERATED_QUESTIONS_COUNT = 8;
const TARGET_CORRECT = 7;

function hashText(raw: string): number {
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectStaticQuestions(all: Question[], mode: "primaria" | "ingreso", count: number): Question[] {
  if (mode === "primaria") {
    return shuffle(all.filter((q) => (q.difficulty ?? 2) <= 3)).slice(0, count);
  }

  return [2, 3, 4, 5]
    .flatMap((difficulty) => shuffle(all.filter((q) => (q.difficulty ?? 2) === difficulty)))
    .slice(0, count);
}

function buildSessionQuestions(
  topicId: string,
  all: Question[],
  mode: "primaria" | "ingreso",
  seed: number,
  generatorOptions: GeneratorOptions
): Question[] {
  const generated = generateForTopicWithOptions(topicId, GENERATED_QUESTIONS_COUNT, seed, generatorOptions);
  const staticQuestions = selectStaticQuestions(all, mode, SESSION_SIZE - generated.length);

  return [...staticQuestions, ...generated]
    .sort((a, b) => (a.difficulty ?? 2) - (b.difficulty ?? 2))
    .slice(0, SESSION_SIZE);
}

function difficultyStars(d: number): string {
  if (d <= 1) return "★";
  if (d === 2) return "★★";
  return "★★★";
}

const MISSION_KIND_KEY: Record<DailyMissionKind, StringKey> = {
  new: "lesson_mission_kind_new",
  repair: "lesson_mission_kind_repair",
  consolidate: "lesson_mission_kind_consolidate",
  challenge: "lesson_mission_kind_challenge",
  maintenance: "lesson_mission_kind_maintenance",
  boss: "lesson_mission_kind_boss",
};

type Phase = "lesson" | "questions";

export default function LessonScreen() {
  const { topicId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pick, t } = useI18n();
  const topic = useMemo(() => topics.find((tp) => tp.id === topicId), [topicId]);
  const metrics = useSessionTracker();
  const progressState = loadProgress();

  const mode: "primaria" | "ingreso" =
    progressState.parent.goal === "ingreso" || progressState.parent.level === "C"
      ? "ingreso"
      : "primaria";

  const sessionSeed = createSessionSeed(topicId, progressState.sessions.length);
  const adaptiveProfile = useMemo(() => buildAdaptiveProfile(topicId, progressState), [topicId]);
  const requestedSkillId = searchParams.get("skill") ?? "";
  const dailyMission = useMemo(
    () => buildMissionForSkill(requestedSkillId, progressState) ?? buildDailyMission(topicId, progressState),
    [requestedSkillId, topicId, progressState.sessions.length]
  );
  const generatorOptions = useMemo<GeneratorOptions>(() => {
    const focusSkillTags = dailyMission?.focusSkillId
      ? Array.from(new Set([dailyMission.focusSkillId, ...(adaptiveProfile.focusSkillTags ?? [])]))
      : adaptiveProfile.focusSkillTags;
    const missionShift = dailyMission?.kind === "repair" ? -1 : dailyMission?.kind === "challenge" ? 1 : adaptiveProfile.difficultyShift;
    return {
      difficultyShift: missionShift,
      focusSkillTags,
    };
  }, [adaptiveProfile, dailyMission]);
  const questions = useMemo(() => {
    const all = questionsByTopic[topicId] ?? [];
    return buildSessionQuestions(topicId, all, mode, sessionSeed, generatorOptions);
  }, [topicId, mode, sessionSeed, generatorOptions]);

  const [phase, setPhase] = useState<Phase>("lesson");
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongTags, setWrongTags] = useState<string[]>([]);
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([]);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [skillOutcomeMap, setSkillOutcomeMap] = useState<Record<string, { attempts: number; correct: number; wrong: number }>>({});
  const [skillWrongStreakMap, setSkillWrongStreakMap] = useState<Record<string, number>>({});
  const [repairInsertedBySkill, setRepairInsertedBySkill] = useState<Record<string, number>>({});
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(questions);

  const fmtParts = {
    secondsTpl: t("fmt_seconds"),
    minutesTpl: t("fmt_minutes"),
    minutesSecondsTpl: t("fmt_minutes_seconds"),
  };

  if (!topic) {
    return (
      <div>
        <p>{t("lesson_topic_not_found")}</p>
        <button className="btn" onClick={() => navigate("/")}>{t("lesson_back")}</button>
      </div>
    );
  }

  if (sessionQuestions.length === 0) {
    return (
      <div>
        <p>{t("lesson_no_questions")}</p>
        <button className="btn" onClick={() => navigate("/")}>{t("lesson_back")}</button>
      </div>
    );
  }

  function handleQuestionAnswered(question: Question, userAnswer: string, usedHint: boolean) {
    const ok = checkAnswer(question, userAnswer);
    const skillTags = question.skillTags.length > 0 ? question.skillTags : [];

    if (skillTags.length > 0) {
      setSkillOutcomeMap((prev) => {
        const next = { ...prev };
        for (const tag of skillTags) {
          const current = next[tag] ?? { attempts: 0, correct: 0, wrong: 0 };
          next[tag] = {
            attempts: current.attempts + 1,
            correct: ok ? current.correct + 1 : current.correct,
            wrong: ok ? current.wrong : current.wrong + 1,
          };
        }
        return next;
      });
    }

    if (ok) {
      setCorrectCount((c) => c + 1);
      setWrongStreak(0);
      if (skillTags.length > 0) {
        setSkillWrongStreakMap((prev) => {
          const next = { ...prev };
          for (const tag of skillTags) next[tag] = 0;
          return next;
        });
      }
    } else {
      setWrongTags((tags) => Array.from(new Set([...tags, ...question.skillTags])));
      setWrongQuestionIds((ids) => Array.from(new Set([...ids, question.id])));
      setWrongStreak((s) => s + 1);

      if (skillTags.length > 0) {
        const primarySkill = skillTags[0];
        const nextSkillStreak = (skillWrongStreakMap[primarySkill] ?? 0) + 1;
        setSkillWrongStreakMap((prev) => ({ ...prev, [primarySkill]: nextSkillStreak }));

        const insertedCount = repairInsertedBySkill[primarySkill] ?? 0;
        if (nextSkillStreak >= 2 && insertedCount < 2) {
          const repair = generateForTopicWithOptions(question.topicId, 1, hashText(question.id + primarySkill + nextSkillStreak), {
            difficultyShift: -1,
            focusSkillTags: skillTags,
          })[0];
          if (repair) {
            setSessionQuestions((current) => {
              if (current.some((item) => item.id === repair.id) || current.length >= SESSION_SIZE + 4) return current;
              const next = [...current];
              next.splice(Math.min(index + 1, next.length), 0, repair);
              return next;
            });
            setRepairInsertedBySkill((prev) => ({ ...prev, [primarySkill]: insertedCount + 1 }));
          }
        }
      }
    }
    if (usedHint) setHintsUsed((h) => h + 1);
  }

  function handleNext() {
    if (index + 1 < sessionQuestions.length) {
      setIndex(index + 1);
    } else {
      finishSession();
    }
  }

  function finishSession() {
    const wrongSet = new Set(wrongQuestionIds);
    const xpEarned = sessionQuestions
      .filter((q) => !wrongSet.has(q.id))
      .reduce((sum, q) => sum + (q.xp ?? 10), 0);
    const session: StudySession = {
      id: "sess_" + Date.now(),
      topicId: topic!.id,
      startedAt: new Date(Date.now() - metrics.totalSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      totalSeconds: metrics.totalSeconds,
      activeSeconds: metrics.activeSeconds,
      blurSeconds: metrics.blurSeconds,
      idleSeconds: metrics.idleSeconds,
      focusLossCount: metrics.focusLossCount,
      pauseCount: metrics.pauseCount,
      questionsAnswered: sessionQuestions.length,
      correctAnswers: correctCount,
      hintsUsed,
      wrongSkillTags: wrongTags,
      wrongQuestionIds,
      practicedSkillTags: Array.from(new Set(sessionQuestions.flatMap((question) => question.skillTags))),
      skillOutcomes: skillOutcomeMap,
      missionSkillId: dailyMission?.focusSkillId,
      missionKind: dailyMission?.kind,
      xpEarned,
    };
    recordSession(session);
    navigate("/summary/" + session.id, { replace: true });
  }

  if (phase === "lesson") {
    const focusedLine = `${t("lesson_focused")}: ${formatMinutes(metrics.activeSeconds, fmtParts)} · ${t("lesson_on_screen")}: ${formatMinutes(metrics.totalSeconds, fmtParts)}`;
    const mission = dailyMission
      ? {
          kind: dailyMission.kind,
          eyebrow: t("lesson_mission_today"),
          title: pick(dailyMission.title),
          outcome: pick(dailyMission.outcome),
          mastery: dailyMission.masteryPct === null ? t("lesson_mission_mastery_new") : `${dailyMission.masteryPct}%`,
          goal: `${t(`skill_status_${dailyMission.status}` as any)} · ${t("lesson_mission_goal", { correct: String(TARGET_CORRECT), total: String(SESSION_SIZE) })}`,
          reason: pick(dailyMission.reason),
        }
      : undefined;

    return (
      <Suspense fallback={<div className="card">Cargando...</div>}>
        <LessonIntroSection
          levelLabel={`${t("lesson_level")} ${topic.level}`}
          ingresoLabel={mode === "ingreso" ? "Ingreso" : undefined}
          title={pick(topic.title)}
          subtitle={t("lesson_sub")}
          mission={mission}
          lessonParagraphs={pick(topic.lessonText).split("\n\n")}
          startLabel={t("lesson_mission_start")}
          focusedLine={focusedLine}
          onStart={() => setPhase("questions")}
        />
      </Suspense>
    );
  }

  const q = sessionQuestions[index];
  const stars = difficultyStars(q.difficulty ?? 2);
  const progressPct = Math.round(((index + 1) / sessionQuestions.length) * 100);
  const correctPct = Math.round((correctCount / TARGET_CORRECT) * 100);

  return (
    <div>
      <Suspense fallback={<div className="card">Cargando...</div>}>
        <LessonQuestionHeader
          mission={
            dailyMission
              ? {
                  kind: dailyMission.kind,
                  badgeLabel: t(MISSION_KIND_KEY[dailyMission.kind]),
                  title: pick(dailyMission.title),
                  progressLabel: t("lesson_mission_progress", { done: String(correctCount), target: String(TARGET_CORRECT) }),
                  timerLabel: formatMinutes(metrics.activeSeconds, fmtParts),
                }
              : undefined
          }
          topicTitle={pick(topic.title)}
          stars={stars}
          levelTitle={`${t("lesson_level")} ${q.difficulty ?? 2}`}
          progressCurrent={index + 1}
          progressTotal={sessionQuestions.length}
          progressVariant={correctPct >= 100 ? "success" : "primary"}
          questionLabel={`${t("lesson_question_of", { n: String(index + 1), total: String(sessionQuestions.length) })} (${progressPct}%)`}
          goalLabel={t("lesson_mission_goal", { correct: String(TARGET_CORRECT), total: String(SESSION_SIZE) })}
        />
      </Suspense>

      <QuestionCard
        key={q.id}
        question={q}
        onAnswered={(ans, usedHint) => handleQuestionAnswered(q, ans, usedHint)}
        onNext={handleNext}
        isLast={index + 1 === sessionQuestions.length}
        consecutiveWrong={wrongStreak}
      />

      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>
        {t("lesson_focused")}: {formatMinutes(metrics.activeSeconds, fmtParts)}
      </p>
    </div>
  );
}
