import type { DailyMissionKind } from "../../engine/dailyMission";
import Badge from "../ui/Badge";
import ProgressBar from "../ui/ProgressBar";

const MISSION_KIND_BADGE: Record<DailyMissionKind, "primary" | "warning" | "success" | "review" | "neutral"> = {
  new: "primary",
  repair: "warning",
  consolidate: "success",
  challenge: "review",
  maintenance: "neutral",
  boss: "review",
};

type LessonQuestionHeaderProps = {
  mission?: {
    kind: DailyMissionKind;
    badgeLabel: string;
    title: string;
    progressLabel: string;
    timerLabel: string;
  };
  topicTitle: string;
  stars: string;
  levelTitle: string;
  progressCurrent: number;
  progressTotal: number;
  progressVariant: "success" | "primary";
  questionLabel: string;
  goalLabel: string;
};

export default function LessonQuestionHeader(props: LessonQuestionHeaderProps) {
  const {
    mission,
    topicTitle,
    stars,
    levelTitle,
    progressCurrent,
    progressTotal,
    progressVariant,
    questionLabel,
    goalLabel,
  } = props;

  return (
    <>
      {mission && (
        <div className="lesson-mission-bar">
          <div style={{ minWidth: 0 }}>
            <span style={{ display: "block", marginBottom: 4 }}>
              <Badge variant={MISSION_KIND_BADGE[mission.kind]}>
                {mission.badgeLabel}
              </Badge>
            </span>
            <strong style={{ display: "block", fontSize: 14, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mission.title}
            </strong>
          </div>
          <small style={{ whiteSpace: "nowrap" }}>
            {mission.progressLabel}
            <br />
            {mission.timerLabel}
          </small>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>{topicTitle}</p>
        <span style={{ fontSize: 13, letterSpacing: "0.5px", color: "var(--text-soft)" }} title={levelTitle}>
          {stars}
        </span>
      </div>

      <div style={{ marginBottom: 4 }}>
        <ProgressBar
          value={progressCurrent}
          max={progressTotal}
          size="sm"
          variant={progressVariant}
        />
      </div>
      <p className="muted" style={{ marginTop: 4, marginBottom: 16, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
        <span>{questionLabel}</span>
        <span>{goalLabel}</span>
      </p>
    </>
  );
}
