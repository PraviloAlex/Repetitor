type Props = {
  value: number;
  max?: number;
  variant?: "primary" | "success" | "review" | "topic";
  size?: "sm" | "md" | "mission";
  color?: string;
  label?: string;
};

export default function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  color,
  label,
}: Props) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className={`progress-bar progress-bar--${size}`} aria-label={label}>
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill progress-bar__fill--${variant}`}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
