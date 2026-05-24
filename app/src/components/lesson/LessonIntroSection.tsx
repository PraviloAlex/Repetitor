type LessonIntroMission = {
  kind: string;
  eyebrow: string;
  title: string;
  outcome: string;
  mastery: string;
  goal: string;
  reason: string;
};

type LessonIntroSectionProps = {
  levelLabel: string;
  ingresoLabel?: string;
  title: string;
  subtitle: string;
  mission?: LessonIntroMission;
  lessonParagraphs: string[];
  startLabel: string;
  focusedLine: string;
  onStart: () => void;
};

export default function LessonIntroSection(props: LessonIntroSectionProps) {
  const {
    levelLabel,
    ingresoLabel,
    title,
    subtitle,
    mission,
    lessonParagraphs,
    startLabel,
    focusedLine,
    onStart,
  } = props;

  return (
    <div>
      <span className="tag">{levelLabel}</span>
      {ingresoLabel && (
        <span className="tag" style={{ marginLeft: 6, background: "#fff3e0", color: "#b85c00" }}>
          {ingresoLabel}
        </span>
      )}
      <h1 className="screen-title" style={{ marginTop: 8 }}>{title}</h1>
      <p className="screen-sub">{subtitle}</p>

      {mission && (
        <div className={`daily-mission daily-mission--${mission.kind}`}>
          <div>
            <span className="daily-mission__eyebrow">{mission.eyebrow}</span>
            <h2>{mission.title}</h2>
            <p>{mission.outcome}</p>
          </div>
          <div className="daily-mission__meta">
            <span>{mission.mastery}</span>
            <small>{mission.goal}</small>
            <small>{mission.reason}</small>
          </div>
        </div>
      )}

      <div className="card">
        <div className="lesson-text">
          {lessonParagraphs.map((p, i) => (
            <p key={i} style={{ margin: "0 0 12px" }}>{p}</p>
          ))}
        </div>
        <button className="btn" onClick={onStart}>
          {startLabel}
        </button>
      </div>

      <p className="muted" style={{ fontSize: 13 }}>
        {focusedLine}
      </p>
    </div>
  );
}
