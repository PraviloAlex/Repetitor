type SummaryHeroCardProps = {
  accuracy: number;
  correctAnswers: number;
  questionsAnswered: number;
  title: string;
  subtitle: string;
};

export default function SummaryHeroCard(props: SummaryHeroCardProps) {
  const { accuracy, correctAnswers, questionsAnswered, title, subtitle } = props;
  const scoreColor = accuracy >= 80 ? "var(--ok)" : accuracy >= 50 ? "var(--warn)" : "var(--error)";
  const circumference = 2 * Math.PI * 78;
  const dashOffset = circumference * (1 - accuracy / 100);

  return (
    <div className="card summary-hero">
      <div className="score-circle" style={{ color: scoreColor }}>
        <svg viewBox="0 0 184 184" aria-hidden="true">
          <circle cx="92" cy="92" r="78" fill="none" stroke="var(--border)" strokeWidth="14" />
          <circle
            cx="92" cy="92" r="78" fill="none"
            stroke="currentColor" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
          />
        </svg>
        <div>
          <div className="score-circle__value">{correctAnswers} / {questionsAnswered}</div>
          <div className="score-circle__label">{accuracy}%</div>
        </div>
      </div>
      <h1 className="screen-title">{title}</h1>
      <p className="screen-sub" style={{ marginBottom: 0 }}>{subtitle}</p>
    </div>
  );
}
