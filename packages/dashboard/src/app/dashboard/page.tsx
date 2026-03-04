import { VisibilityChart } from "@/components/visibility-chart";
import { HallucinationAlerts } from "@/components/hallucination-alerts";
import { ShareOfVoiceChart } from "@/components/share-of-voice-chart";
import { StatsCards } from "@/components/stats-cards";

// Demo data — will be replaced with API calls
const demoData = {
  visibility: {
    overall: 72,
    history: [
      { date: "Mar 1", score: 65 },
      { date: "Mar 5", score: 68 },
      { date: "Mar 10", score: 70 },
      { date: "Mar 15", score: 72 },
      { date: "Mar 20", score: 75 },
      { date: "Mar 25", score: 72 },
    ],
  },
  sentiment: { average: 0.65, label: "positive" as const },
  accuracy: 0.89,
  hallucinations: [
    {
      id: "1",
      severity: "high" as const,
      claim: "Pricing starts at $29/month",
      expected: "$49/month",
      actual: "$29/month",
      provider: "gpt-4o",
      date: "2024-03-20",
    },
    {
      id: "2",
      severity: "medium" as const,
      claim: "Founded in 2018",
      expected: "2020",
      actual: "2018",
      provider: "claude-3.5-sonnet",
      date: "2024-03-19",
    },
    {
      id: "3",
      severity: "low" as const,
      claim: "Headquartered in New York",
      expected: "San Francisco",
      actual: "New York",
      provider: "gemini-pro",
      date: "2024-03-18",
    },
  ],
  shareOfVoice: [
    { brand: "Your Brand", percentage: 35 },
    { brand: "Competitor A", percentage: 28 },
    { brand: "Competitor B", percentage: 22 },
    { brand: "Competitor C", percentage: 15 },
  ],
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">
            <span className="text-indigo-400">xelin</span>
            <span className="text-gray-500">.ai</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-400">Your Brand</span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium">
              Y
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">
            AI visibility overview for Your Brand
          </p>
        </div>

        {/* Stats */}
        <StatsCards
          visibility={demoData.visibility.overall}
          sentiment={demoData.sentiment}
          accuracy={demoData.accuracy}
          hallucinationCount={demoData.hallucinations.length}
        />

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Visibility Over Time</h2>
            <VisibilityChart data={demoData.visibility.history} />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Share of Voice</h2>
            <ShareOfVoiceChart data={demoData.shareOfVoice} />
          </div>
        </div>

        {/* Hallucination Alerts */}
        <div className="mt-6">
          <HallucinationAlerts hallucinations={demoData.hallucinations} />
        </div>
      </main>
    </div>
  );
}
