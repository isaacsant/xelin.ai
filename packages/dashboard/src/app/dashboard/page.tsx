import { VisibilityChart } from "@/components/visibility-chart";
import { HallucinationAlerts } from "@/components/hallucination-alerts";
import { ShareOfVoiceChart } from "@/components/share-of-voice-chart";
import { StatsCards } from "@/components/stats-cards";
import { BrandSelector } from "@/components/brand-selector";
import {
  getBrands,
  getVisibility,
  getHallucinations,
  getChecks,
  type Brand,
} from "@/lib/api";

interface Props {
  searchParams: Promise<{ brand?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  let brands: Brand[] = [];
  let error: string | null = null;

  try {
    brands = await getBrands();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch brands";
  }

  // Select current brand
  const selectedBrandId = params.brand ?? brands[0]?.id;
  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? brands[0];

  if (error || !selectedBrand) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <DashboardHeader brandName={null} />
        <main className="max-w-7xl mx-auto px-8 py-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No brands found</h2>
            <p className="text-gray-400 text-sm mb-4">
              {error ?? "Create a brand via the API to get started."}
            </p>
            <code className="block bg-gray-800 rounded-lg p-4 text-indigo-300 font-mono text-xs text-left max-w-lg mx-auto">
              curl -X POST $API_URL/api/v1/brands \{"\n"}
              {"  "}-H &quot;Authorization: Bearer $API_KEY&quot; \{"\n"}
              {"  "}-H &quot;Content-Type: application/json&quot; \{"\n"}
              {"  "}-d &apos;{`{"name":"YourBrand","domain":"example.com"}`}&apos;
            </code>
          </div>
        </main>
      </div>
    );
  }

  // Fetch data in parallel
  const [visibility, hallucinationData, checks] = await Promise.all([
    getVisibility(selectedBrand.id).catch(() => null),
    getHallucinations(selectedBrand.id).catch(() => null),
    getChecks(selectedBrand.id).catch(() => []),
  ]);

  // Compute stats from real data
  const visibilityScore = visibility?.visibilityScore ?? 0;
  const totalChecks = visibility?.totalChecks ?? 0;

  // Compute sentiment from checks
  const allMentions = checks.flatMap((c) => c.mentions);
  const brandMentions = allMentions.filter(
    (m) =>
      m.brandName.toLowerCase() === selectedBrand.name.toLowerCase() &&
      m.sentimentScore != null
  );
  const avgSentiment =
    brandMentions.length > 0
      ? brandMentions.reduce((sum, m) => sum + m.sentimentScore!, 0) /
        brandMentions.length
      : 0;
  const sentimentLabel: "positive" | "neutral" | "negative" =
    avgSentiment > 0.2 ? "positive" : avgSentiment < -0.2 ? "negative" : "neutral";

  // Compute accuracy from checks
  const checksWithHallucinations = checks.filter(
    (c) => c.hallucinations.length > 0
  ).length;
  const accuracy =
    totalChecks > 0 ? 1 - checksWithHallucinations / totalChecks : 1;

  // Build visibility history — group checks by date
  const historyMap = new Map<string, { mentioned: number; total: number }>();
  for (const entry of visibility?.history ?? []) {
    const date = new Date(entry.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const existing = historyMap.get(date) ?? { mentioned: 0, total: 0 };
    existing.total++;
    if (entry.isMentioned) existing.mentioned++;
    historyMap.set(date, existing);
  }
  const visibilityHistory = Array.from(historyMap.entries()).map(
    ([date, { mentioned, total }]) => ({
      date,
      score: total > 0 ? (mentioned / total) * 100 : 0,
    })
  );

  // Build share of voice from mentions
  const allBrandNames = [
    selectedBrand.name,
    ...selectedBrand.competitors.map((c) => c.name),
  ];
  const mentionCounts: Record<string, number> = {};
  for (const name of allBrandNames) mentionCounts[name] = 0;
  for (const m of allMentions) {
    if (m.isMentioned && m.brandName in mentionCounts) {
      mentionCounts[m.brandName]++;
    }
  }
  const totalMentionCount = Object.values(mentionCounts).reduce(
    (a, b) => a + b,
    0
  );
  const shareOfVoice = allBrandNames.map((name) => ({
    brand: name,
    percentage:
      totalMentionCount > 0
        ? (mentionCounts[name] / totalMentionCount) * 100
        : 0,
  }));

  // Map hallucinations for the alerts component
  const hallucinations = (hallucinationData?.hallucinations ?? []).map((h) => ({
    id: h.id,
    severity: h.severity,
    claim: h.claim,
    expected: h.expectedValue ?? "-",
    actual: h.actualValue ?? "-",
    provider: `${h.provider}/${h.model}`,
    date: new Date(h.checkDate).toLocaleDateString("en-CA"),
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardHeader brandName={selectedBrand.name} />

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-gray-400 text-sm">
              AI visibility overview for {selectedBrand.name}
              {selectedBrand.domain && (
                <span className="text-gray-600"> ({selectedBrand.domain})</span>
              )}
            </p>
          </div>
          {brands.length > 1 && (
            <BrandSelector
              brands={brands.map((b) => ({ id: b.id, name: b.name }))}
              selectedId={selectedBrand.id}
            />
          )}
        </div>

        {totalChecks === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No checks yet</h2>
            <p className="text-gray-400 text-sm mb-4">
              Run a visibility check to see data here.
            </p>
            <code className="block bg-gray-800 rounded-lg p-4 text-indigo-300 font-mono text-xs text-left max-w-lg mx-auto whitespace-pre">
{`curl -X POST $API_URL/api/v1/checks \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"brandId":"${selectedBrand.id}",
       "providers":[{"provider":"bedrock",
         "model":"us.anthropic.claude-3-5-haiku-20241022-v1:0"}]}'`}
            </code>
          </div>
        ) : (
          <>
            <StatsCards
              visibility={visibilityScore}
              sentiment={{ average: avgSentiment, label: sentimentLabel }}
              accuracy={accuracy}
              hallucinationCount={hallucinationData?.total ?? 0}
            />

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Visibility Over Time
                </h2>
                {visibilityHistory.length > 0 ? (
                  <VisibilityChart data={visibilityHistory} />
                ) : (
                  <p className="text-gray-500 text-sm">
                    Run more checks to see trends.
                  </p>
                )}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Share of Voice</h2>
                <ShareOfVoiceChart data={shareOfVoice} />
              </div>
            </div>

            <div className="mt-6">
              <HallucinationAlerts hallucinations={hallucinations} />
            </div>

            {/* Recent checks detail */}
            <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                Recent Checks ({checks.length})
              </h2>
              <div className="space-y-3">
                {checks.slice(0, 10).map((check) => (
                  <div
                    key={check.id}
                    className="border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                          {check.provider}/{check.model}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            check.status === "completed"
                              ? "bg-green-900/50 text-green-400"
                              : "bg-yellow-900/50 text-yellow-400"
                          }`}
                        >
                          {check.status}
                        </span>
                        {check.latencyMs && (
                          <span className="text-xs text-gray-500">
                            {check.latencyMs}ms
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(check.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {check.prompt.text}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        {check.mentions.filter((m) => m.isMentioned).length} mentions
                      </span>
                      <span>{check.citations.length} citations</span>
                      <span
                        className={
                          check.hallucinations.length > 0
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {check.hallucinations.length} hallucinations
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DashboardHeader({ brandName }: { brandName: string | null }) {
  return (
    <header className="border-b border-gray-800 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">
          <span className="text-indigo-400">xelin</span>
          <span className="text-gray-500">.ai</span>
        </div>
        {brandName && (
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-400">{brandName}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium">
              {brandName[0].toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
