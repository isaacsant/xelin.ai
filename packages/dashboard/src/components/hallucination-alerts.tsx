interface Hallucination {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  claim: string;
  expected: string;
  actual: string;
  provider: string;
  date: string;
}

interface HallucinationAlertsProps {
  hallucinations: Hallucination[];
}

export function HallucinationAlerts({ hallucinations }: HallucinationAlertsProps) {
  const severityStyles = {
    critical: "bg-red-950 border-red-800 text-red-300",
    high: "bg-red-950/50 border-red-900 text-red-400",
    medium: "bg-yellow-950/50 border-yellow-900 text-yellow-400",
    low: "bg-gray-800/50 border-gray-700 text-gray-400",
  };

  const severityBadge = {
    critical: "bg-red-600 text-white",
    high: "bg-red-800 text-red-200",
    medium: "bg-yellow-800 text-yellow-200",
    low: "bg-gray-700 text-gray-300",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Hallucination Alerts</h2>
        {hallucinations.length > 0 && (
          <span className="text-sm text-red-400">
            {hallucinations.length} issue{hallucinations.length !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {hallucinations.length === 0 ? (
        <p className="text-gray-500 text-sm">No hallucinations detected. All facts are accurate.</p>
      ) : (
        <div className="space-y-3">
          {hallucinations.map((h) => (
            <div
              key={h.id}
              className={`border rounded-lg p-4 ${severityStyles[h.severity]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${severityBadge[h.severity]}`}
                    >
                      {h.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{h.provider}</span>
                    <span className="text-xs text-gray-600">{h.date}</span>
                  </div>
                  <p className="text-sm font-medium mb-2">
                    &quot;{h.claim}&quot;
                  </p>
                  <div className="flex gap-6 text-xs">
                    <div>
                      <span className="text-gray-500">Expected: </span>
                      <span className="text-green-400">{h.expected}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">AI said: </span>
                      <span className="text-red-400">{h.actual}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
