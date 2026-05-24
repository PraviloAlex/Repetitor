import type { Topic } from "../engine/types";
import { useI18n } from "../i18n/I18nContext";
import { getTopicVisual } from "../topicVisuals";
import TopicGlyph from "./TopicGlyph";
import Badge from "./ui/Badge";
import PrimaryButton from "./ui/PrimaryButton";
import ProgressBar from "./ui/ProgressBar";

type Props = {
  topic: Topic;
  progressPct: number | null;
  onStart: () => void;
};

export default function RecommendedTopicCard({ topic, progressPct, onStart }: Props) {
  const { pick, t } = useI18n();
  const visual = getTopicVisual(topic.id);
  const pct = progressPct ?? 0;
  const mastered = Math.round((pct / 100) * 32);

  return (
    <section
      className="mission-card mission-card--vivid"
      style={{
        background: visual.gradient,
        ["--topic-color" as string]: visual.text,
      }}
    >
      <div className="mission-card__content">
        <Badge variant="primary">{t("home_recommended_today")}</Badge>
        <h2 className="mission-card__title">{pick(topic.title)}</h2>
        <p className="mission-card__outcome">{pick(topic.summary)}</p>

        <div className="mission-card__meta">
          <span>{progressPct === null ? t("mission_no_progress") : t("mission_mastery", { pct: String(pct) })}</span>
          <span>{t("mission_skills", { done: String(mastered), total: "32" })}</span>
          <span>{t("mission_time")}</span>
        </div>

        <ProgressBar
          value={pct}
          size="mission"
          variant="topic"
          color={visual.accent}
          label={t("mission_mastery", { pct: String(pct) })}
        />

        <PrimaryButton onClick={onStart}>{t("mission_continue")}</PrimaryButton>
      </div>

      <div className="mission-card__icon" aria-hidden="true">
        <TopicGlyph topicId={topic.id} size={38} />
      </div>
    </section>
  );
}
