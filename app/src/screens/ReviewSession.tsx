import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { loadProgress, removeFromReviewQueue, getOverdueReviewIds } from "../storage/localProgress";
import { checkAnswer } from "../engine/answerChecker";
import { generateForTopicWithOptions, tryReconstructGenerated } from "../engine/generator";
import QuestionCard from "../components/QuestionCard";
import type { Question } from "../engine/types";

// Import all question banks
import opsQuestions from "../content/questions/operaciones.json";
import divQuestions from "../content/questions/divisibilidad.json";
import fracQuestions from "../content/questions/fracciones.json";
import decQuestions from "../content/questions/decimales.json";
import pctQuestions from "../content/questions/porcentajes.json";
import geoQuestions from "../content/questions/geometria.json";

const ALL_QUESTIONS: Question[] = [
  ...(opsQuestions as Question[]),
  ...(divQuestions as Question[]),
  ...(fracQuestions as Question[]),
  ...(decQuestions as Question[]),
  ...(pctQuestions as Question[]),
  ...(geoQuestions as Question[]),
];

const MAX_PER_REVIEW = 10;

function hashText(raw: string): number {
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export default function ReviewSession() {
  const { t } = useI18n();
  const navigate = useNavigate();

  // Pick only overdue questions (spaced-repetition scheduled), capped at MAX_PER_REVIEW
  const initialQuestions = useMemo(() => {
    const progress = loadProgress();
    const overdueIds = getOverdueReviewIds(progress);
    const qMap = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
    return overdueIds
      .map((id) => qMap.get(id) ?? tryReconstructGenerated(id))
      .filter((q): q is Question => q != null)
      .slice(0, MAX_PER_REVIEW);
  }, []);

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="screen" style={{ padding: "32px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--text-soft)" }}>{t("rev_done_sub")}</p>
        <button className="btn" onClick={() => navigate("/")}>
          {t("rev_home")}
        </button>
      </div>
    );
  }

  function handleAnswered(question: Question, userAnswer: string, _usedHint: boolean) {
    const ok = checkAnswer(question, userAnswer);
    if (ok) {
      setCorrectCount((c) => c + 1);
      setMasteredIds((ids) => [...ids, question.id]);
      setWrongStreak(0);
    } else {
      const nextWrongStreak = wrongStreak + 1;
      setWrongStreak(nextWrongStreak);
      if (nextWrongStreak >= 2 && question.skillTags.length > 0) {
        const repair = generateForTopicWithOptions(question.topicId, 1, hashText(question.id + nextWrongStreak), {
          difficultyShift: -1,
          focusSkillTags: question.skillTags,
        })[0];
        if (repair) {
          setQuestions((current) => {
            if (current.some((item) => item.id === repair.id) || current.length >= MAX_PER_REVIEW + 2) return current;
            const next = [...current];
            next.splice(Math.min(index + 1, next.length), 0, repair);
            return next;
          });
        }
      }
    }
  }

  function handleNext() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      // Remove mastered IDs from the review queue
      if (masteredIds.length > 0) {
        removeFromReviewQueue(masteredIds);
      }
      setDone(true);
    }
  }

  if (done) {
    const accuracy = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
    return (
      <div className="screen" style={{ padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
          <h2 style={{ margin: "0 0 6px", fontSize: 22 }}>{t("rev_done_title")}</h2>
          <p style={{ color: "var(--text-soft)", margin: 0 }}>{t("rev_done_sub")}</p>
        </div>

        <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 4 }}>
            {t("rev_done_correct")}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)" }}>
            {correctCount}/{questions.length}
          </div>
          <div style={{ fontSize: 15, color: "var(--text-soft)", marginTop: 4 }}>
            {accuracy}%
          </div>
        </div>

        <button className="btn" style={{ width: "100%" }} onClick={() => navigate("/")}>
          {t("rev_home")}
        </button>
      </div>
    );
  }

  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="screen" style={{ padding: "16px 20px", maxWidth: 480, margin: "0 auto" }}>
      <p className="muted" style={{ margin: "0 0 6px" }}>{t("rev_title")}</p>
      <div className="progress">
        <div className="progress-fill" style={{ width: progress + "%" }} />
      </div>
      <p className="muted" style={{ marginTop: 4, marginBottom: 12, fontSize: 13 }}>
        {t("rev_question_of", { n: String(index + 1), total: String(questions.length) })}
      </p>

      <QuestionCard
        key={q.id}
        question={q}
        onAnswered={(ans, usedHint) => handleAnswered(q, ans, usedHint)}
        onNext={handleNext}
        isLast={index + 1 === questions.length}
        consecutiveWrong={wrongStreak}
      />
    </div>
  );
}
