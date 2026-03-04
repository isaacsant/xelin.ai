import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tight">
          <span className="text-indigo-400">xelin</span>
          <span className="text-gray-500">.ai</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-sm">
          Open Source AI Visibility Tracker
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Know how AI <br />
          <span className="text-indigo-400">talks about</span> your brand
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Track your brand&apos;s visibility across ChatGPT, Claude, Gemini, and Perplexity.
          Detect hallucinations before your customers do.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg font-medium text-lg transition"
          >
            Start Tracking
          </Link>
          <a
            href="https://github.com/xelin-ai/xelin"
            className="border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition text-gray-300"
          >
            View on GitHub
          </a>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 py-20 grid md:grid-cols-3 gap-8">
        <FeatureCard
          title="Visibility Scoring"
          description="See how often AI models mention your brand vs competitors across different prompt categories."
        />
        <FeatureCard
          title="Hallucination Detection"
          description="Automatically catch when AI makes false claims about your pricing, features, or company facts."
        />
        <FeatureCard
          title="Multi-Model Tracking"
          description="Monitor ChatGPT, Claude, Gemini, Perplexity, and AWS Bedrock models all in one place."
        />
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">API-first. Self-serve. Open source.</h2>
        <p className="text-gray-400 mb-8">
          Install via npm, use the CLI, or deploy the full stack. Your data, your infrastructure.
        </p>
        <code className="block bg-gray-800 rounded-lg p-4 text-indigo-300 font-mono text-sm mb-8">
          npx @xelin/cli check &quot;YourBrand&quot; --competitors &quot;Rival1,Rival2&quot;
        </code>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-indigo-800 transition">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
