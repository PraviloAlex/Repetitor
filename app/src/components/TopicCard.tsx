import type { Topic } from "../engine/types";
import { useI18n } from "../i18n/I18nContext";
import { FREE_TOPIC_IDS, getTopicVisual } from "../topicVisuals";
import TopicGlyph from "./TopicGlyph";
import Badge from "./ui/Badge";
import ProgressBar from "./ui/ProgressBar";

type Props = {
  topic: Topic;
  progressPct: number | null;
  isPremium: boolean;
  onClick: () => void;
  compact?: boolean;
};

export default function TopicCard({ topic, progressPct, isPremium, onClick, compact = false }: Props) {
  const { pick, t } = useI18n();
  const visual = getTopicVisual(topic.id);
  const isLocked = !isPremium && !FREE_TOPIC_IDS.has(topic.id);
  const isCompleted = progressPct !== null && progressPct >= 90;
  const pct = progressPct ?? 0;

  return (
    <button
      className={`learning-topic-card ${compact ? "learning-topic-card--compact" : ""}`.trim()}
      onClick={onClick}
      style={{ ["--topic-accent" as string]: visual.accent }}
    >
      <span className="learning-topic-card__top">
        <span className="learning-topic-card__icon" aria-hidden="true">
          <TopicGlyph topicId={topic.id} size={26} />
        </span>
        <span className="learning-topic-card__badges">
          {isCompleted && <Badge variant="success">{t("topic_completed")}</Badge>}
          {isLocked ? (
            <Badge variant="locked">{t("topic_locked")}</Badge>
          ) : FREE_TOPIC_IDS.has(topic.id) && !isPremium ? (
            <Badge variant="primary">{t("premium_free_label")}</Badge>
          ) : null}
        </span>
      </span>

      <span className="learning-topic-card__body">
        <span className="learning-topic-card__title">{pick(topic.title)}</span>
        {!compact && <span className="learning-topic-card__summary">{pick(topic.summary)}</span>}
      </span>

      <span className="learning-topic-card__footer">
        <ProgressBar value={pct} size="sm" color={isLocked ? "var(--locked)" : visual.accent} />
        <span className="learning-topic-card__meta">
          <span>{progressPct === null ? t("pd_no_practice") : `${progressPct}%`}</span>
          <span>{t("topic_time_short")}</span>
        </span>
      </span>
    </button>
  );
}
