import { useState } from "react";
import type { Question } from "../engine/types";
import { checkAnswer } from "../engine/answerChecker";
import { getSkillRepairExplanation } from "../engine/skills";
import { getSkillRepairRu } from "../i18n/skillLabels";
import { useI18n } from "../i18n/I18nContext";
import {
  RARITY_VISUALS,
  CARD_TYPE_VISUALS,
  deriveRarity,
  deriveCardType,
} from "../cardVisuals";

type Props = {
  question: Question;
  onAnswered: (userAnswer: string, usedHint: boolean) => void;
  onNext: () => void;
  isLast: boolean;
  consecutiveWrong: number;
};

export default function QuestionCard({ question, onAnswered, onNext, isLast, consecutiveWrong }: Props) {
  const { pick, t, lang } = useI18n();
  const [selected, setSelected] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [numeric, setNumeric] = useState("");

  const userAnswer = question.type === "numeric_input" ? numeric : selected;
  const isCorrect = submitted ? checkAnswer(question, userAnswer) : false;
  const cardStateClass = submitted ? (isCorrect ? " is-correct" : " is-wrong") : "";
  const primarySkillTag = question.skillTags[0] ?? "";
  const repairExplanationEs = primarySkillTag ? getSkillRepairExplanation(primarySkillTag) : "";
  const repairExplanationRu = primarySkillTag ? getSkillRepairRu(primarySkillTag, repairExplanationEs) : "";
  const repairExplanation = lang === "ru" ? repairExplanationRu : repairExplanationEs;

  function submit(answer = userAnswer) {
    if (!answer || submitted) return;
    setSubmitted(true);
    onAnswered(answer, hintShown);
  }

  function chooseAnswer(answer: string) {
    if (submitted) return;
    setSelected(answer);
    submit(answer);
  }

  const rarity = deriveRarity(question);
  const rarityVisual = RARITY_VISUALS[rarity];
  const cardType = deriveCardType(question);
  const typeVisual = CARD_TYPE_VISUALS[cardType];

  return (
    <div
      className={`card question-card${cardStateClass}`}
      style={{ borderColor: rarityVisual.border, borderWidth: 2 }}
    >
      <div className="card-meta-row">
        <span
          className="card-rarity-chip"
          style={{
            background: rarityVisual.soft,
            color: rarityVisual.text,
            borderColor: rarityVisual.border,
          }}
        >
          {pick(rarityVisual.label)}
        </span>
        <span className="card-type-chip" title={pick(typeVisual.label)}>
          <span aria-hidden>{typeVisual.icon}</span> {pick(typeVisual.label)}
        </span>
      </div>

      <p style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.35 }}>
        {pick(question.prompt)}
      </p>

      {question.type === "multiple_choice" && question.options && (
        <div>
          {question.options.map((opt) => {
            const optValue = opt.es;
            const isSelected = optValue === selected;
            let cls = "option";
            if (submitted) {
              if (optValue === String(question.answer)) cls += " correct";
              else if (isSelected) cls += " wrong";
            } else if (isSelected) {
              cls += " selected";
            }
            return (
              <button
                key={optValue}
                className={cls}
                disabled={submitted}
                onClick={() => chooseAnswer(optValue)}
              >
                {pick(opt)}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "true_false" && (
        <div>
          {[
            { label: t("q_true"), value: "true" },
            { label: t("q_false"), value: "false" }
          ].map((opt) => {
            const isSelected = opt.value === selected;
            let cls = "option";
            if (submitted) {
              if (opt.value === String(question.answer)) cls += " correct";
              else if (isSelected) cls += " wrong";
            } else if (isSelected) {
              cls += " selected";
            }
            return (
              <button
                key={opt.value}
                className={cls}
                disabled={submitted}
                onClick={() => chooseAnswer(opt.value)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "numeric_input" && (
        <input
          type="text"
          inputMode="decimal"
          className={"numeric-input" + (submitted ? (isCorrect ? " numeric-input--correct" : " numeric-input--wrong") : "")}
          placeholder={t("q_your_answer")}
          value={numeric}
          disabled={submitted}
          onChange={(e) => setNumeric(e.target.value)}
        />
      )}

      {!submitted && question.hint && !hintShown && (
        <button
          className="btn btn-ghost"
          onClick={() => setHintShown(true)}
          style={{ marginTop: 8 }}
        >
          {t("q_show_hint")}
        </button>
      )}

      {!submitted && hintShown && question.hint && (
        <div className="error-note" style={{ marginTop: 8 }}>
          <strong>{t("q_hint_label")}</strong> {pick(question.hint)}
        </div>
      )}

      {!submitted && question.type === "numeric_input" && (
        <button
          className="btn"
          disabled={!userAnswer}
          onClick={() => submit()}
          style={{ marginTop: 12 }}
        >
          {t("q_submit")}
        </button>
      )}

      {submitted && (
        <>
          {/* ======= CORRECT ======= */}
          {isCorrect && (
            <div
              className="feedback-block feedback-block--correct"
              style={{ marginTop: 12 }}
            >
              <div className="feedback-block__header">
                <span className="feedback-mark" style={{ background: "var(--ok)" }}>&#10003;</span>
                <strong>{t("q_correct")}</strong>
              </div>
              <p className="feedback-block__explanation">{pick(question.explanation)}</p>
            </div>
          )}

          {/* ======= WRONG ======= */}
          {!isCorrect && (
            <>
              {/* Wrong header */}
              <div className="feedback-block feedback-block--wrong" style={{ marginTop: 12 }}>
                <div className="feedback-block__header">
                  <span className="feedback-mark" style={{ background: "var(--error, #ef4444)" }}>&#10007;</span>
                  <strong>{t("q_almost")}</strong>
                </div>

                {/* Correct answer callout — always show for wrong */}
                <div className="feedback-block__correct-answer">
                  {t("q_correct_answer", { answer: String(question.answer) })}
                </div>

                {/* Explanation */}
                <p className="feedback-block__explanation">{pick(question.explanation)}</p>
              </div>

              {/* Common mistake */}
              {question.commonMistake && (
                <div className="feedback-block feedback-block--mistake" style={{ marginTop: 6 }}>
                  <strong>{t("q_common_mistake_label")}</strong>{" "}
                  {pick(question.commonMistake)}
                </div>
              )}

              {/* Skill repair hint after consecutive wrong */}
              {repairExplanation && (
                <div className="feedback-block feedback-block--tip" style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("q_repair_label")}</span>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>{repairExplanation}</p>
                </div>
              )}
            </>
          )}

          <button className="btn" onClick={onNext} style={{ marginTop: 12 }}>
            {isLast ? t("q_finish") : t("q_next")}
          </button>
        </>
      )}
    </div>
  );
}
