import type {
  CheckResult,
  BrandInfo,
  VisibilityReport,
  VisibilityScore,
  SentimentSummary,
  ShareOfVoice,
} from "../types.js";

export function computeVisibilityReport(
  brand: BrandInfo,
  checks: CheckResult[]
): VisibilityReport {
  const visibility = computeVisibilityScore(brand.name, checks);
  const sentiment = computeSentiment(brand.name, checks);
  const shareOfVoice = computeShareOfVoice(brand, checks);

  const allHallucinations = checks.flatMap((c) => c.hallucinations);
  const checksWithHallucinations = checks.filter(
    (c) => c.hallucinations.length > 0
  ).length;
  const hallucinationRate =
    checks.length > 0 ? checksWithHallucinations / checks.length : 0;

  const accuracyScores = checks.map((c) => c.accuracy);
  const avgAccuracy =
    accuracyScores.length > 0
      ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length
      : 1;

  return {
    brand,
    timestamp: new Date(),
    visibility,
    sentiment,
    shareOfVoice,
    hallucinations: allHallucinations,
    hallucinationRate,
    accuracy: avgAccuracy,
    totalChecks: checks.length,
    checks,
  };
}

function computeVisibilityScore(
  brandName: string,
  checks: CheckResult[]
): VisibilityScore {
  if (checks.length === 0) {
    return { overall: 0, byProvider: {}, byCategory: {} };
  }

  const brandLower = brandName.toLowerCase();

  // Per-check visibility: 1 if mentioned, 0 if not
  const scores: number[] = checks.map((c) => {
    const mention = c.mentions.find(
      (m) => m.brandName.toLowerCase() === brandLower
    );
    return mention?.isMentioned ? 1 : 0;
  });

  const overall =
    (scores.reduce((a, b) => a + b, 0) / scores.length) * 100;

  // By provider
  const byProvider: Record<string, number> = {};
  const providerGroups = groupBy(checks, (c) => c.provider);
  for (const [provider, provChecks] of Object.entries(providerGroups)) {
    const provScores: number[] = provChecks.map((c) => {
      const m = c.mentions.find(
        (m) => m.brandName.toLowerCase() === brandLower
      );
      return m?.isMentioned ? 1 : 0;
    });
    byProvider[provider] =
      (provScores.reduce((a, b) => a + b, 0) / provScores.length) * 100;
  }

  // By category
  const byCategory: Record<string, number> = {};
  const categoryGroups = groupBy(checks, (c) => c.promptCategory);
  for (const [cat, catChecks] of Object.entries(categoryGroups)) {
    const catScores: number[] = catChecks.map((c) => {
      const m = c.mentions.find(
        (m) => m.brandName.toLowerCase() === brandLower
      );
      return m?.isMentioned ? 1 : 0;
    });
    byCategory[cat] =
      (catScores.reduce((a, b) => a + b, 0) / catScores.length) * 100;
  }

  return { overall, byProvider, byCategory };
}

function computeSentiment(
  brandName: string,
  checks: CheckResult[]
): SentimentSummary {
  const brandLower = brandName.toLowerCase();
  const sentimentScores = checks
    .flatMap((c) => c.mentions)
    .filter(
      (m) => m.brandName.toLowerCase() === brandLower && m.sentimentScore != null
    )
    .map((m) => m.sentimentScore!);

  const average =
    sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;

  const label: SentimentSummary["label"] =
    average > 0.2 ? "positive" : average < -0.2 ? "negative" : "neutral";

  // By provider
  const byProvider: Record<string, number> = {};
  const providerGroups = groupBy(checks, (c) => c.provider);
  for (const [provider, provChecks] of Object.entries(providerGroups)) {
    const scores = provChecks
      .flatMap((c) => c.mentions)
      .filter(
        (m) =>
          m.brandName.toLowerCase() === brandLower && m.sentimentScore != null
      )
      .map((m) => m.sentimentScore!);
    byProvider[provider] =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
  }

  return { average, label, byProvider };
}

function computeShareOfVoice(
  brand: BrandInfo,
  checks: CheckResult[]
): ShareOfVoice[] {
  const allBrands = [
    brand.name,
    ...brand.competitors.map((c) => c.name),
  ];

  const mentionCounts: Record<string, number> = {};
  for (const name of allBrands) {
    mentionCounts[name] = 0;
  }

  for (const check of checks) {
    for (const mention of check.mentions) {
      if (mention.isMentioned && mention.brandName in mentionCounts) {
        mentionCounts[mention.brandName]++;
      }
    }
  }

  const totalMentions = Object.values(mentionCounts).reduce(
    (a, b) => a + b,
    0
  );

  return allBrands.map((name) => ({
    brand: name,
    mentionCount: mentionCounts[name] ?? 0,
    percentage:
      totalMentions > 0
        ? ((mentionCounts[name] ?? 0) / totalMentions) * 100
        : 0,
  }));
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const key = fn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}
