import { useNavigate } from "react-router-dom";
import topicsData from "../content/topics.json";
import type { Topic } from "../engine/types";
import { loadProgress } from "../storage/localProgress";
import { useI18n } from "../i18n/I18nContext";
import { FREE_TOPIC_IDS, getAccuracyPct } from "../topicVisuals";
import TopicCard from "../components/TopicCard";

const topics = topicsData as Topic[];

export default function TopicsScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const state = loadProgress();
  const isPremium = state.parent.isPremium ?? false;

  function handleTopicClick(topic: Topic) {
    const isLocked = !isPremium && !FREE_TOPIC_IDS.has(topic.id);
    navigate(isLocked ? "/parent" : "/lesson/" + topic.id);
  }

  return (
    <div className="screen-enter">
      <h1 className="screen-title">{t("nav_topics")}</h1>
      <p className="screen-sub">{t("home_sub")}</p>

      <div className="topic-grid">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isPremium={isPremium}
            progressPct={getAccuracyPct(state.topicAccuracy, topic.id)}
            onClick={() => handleTopicClick(topic)}
          />
        ))}
      </div>
    </div>
  );
}
