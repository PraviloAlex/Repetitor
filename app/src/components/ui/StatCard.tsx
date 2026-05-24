type Props = {
  label: string;
  value: string;
  pulse?: boolean;
};

export default function StatCard({ label, value, pulse = false }: Props) {
  return (
    <div className={`stat-card ${pulse ? "streak-pulse" : ""}`.trim()}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
    </div>
  );
}
