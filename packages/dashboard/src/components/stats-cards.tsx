interface StatsCardsProps {
  visibility: number;
  sentiment: { average: number; label: "positive" | "neutral" | "negative" };
  accuracy: number;
  hallucinationCount: number;
}

export function StatsCards({
  visibility,
  sentiment,
  accuracy,
  hallucinationCount,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Visibility Score"
        value={`${visibility}%`}
        color={visibility >= 70 ? "green" : visibility >= 40 ? "yellow" : "red"}
      />
      <StatCard
        label="Sentiment"
        value={`${(sentiment.average * 100).toFixed(0)}%`}
        subtitle={sentiment.label}
        color={sentiment.label === "positive" ? "green" : sentiment.label === "negative" ? "red" : "gray"}
      />
      <StatCard
        label="Accuracy"
        value={`${(accuracy * 100).toFixed(0)}%`}
        color={accuracy >= 0.9 ? "green" : accuracy >= 0.7 ? "yellow" : "red"}
      />
      <StatCard
        label="Hallucinations"
        value={hallucinationCount.toString()}
        color={hallucinationCount === 0 ? "green" : hallucinationCount <= 2 ? "yellow" : "red"}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color: "green" | "yellow" | "red" | "gray";
}) {
  const colorClasses = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    gray: "text-gray-400",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1 capitalize">{subtitle}</p>}
    </div>
  );
}
