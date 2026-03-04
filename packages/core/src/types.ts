import { z } from "zod";

// ─── Provider Types ──────────────────────────────────────────────────

export const ProviderName = z.enum([
  "openai",
  "anthropic",
  "google",
  "perplexity",
  "bedrock",
]);
export type ProviderName = z.infer<typeof ProviderName>;

export const ProviderConfig = z.object({
  provider: ProviderName,
  model: z.string(),
  apiKey: z.string().optional(),
  /** AWS region for Bedrock */
  region: z.string().optional(),
});
export type ProviderConfig = z.infer<typeof ProviderConfig>;

// ─── Brand Types ─────────────────────────────────────────────────────

export const BrandFact = z.object({
  category: z.enum([
    "pricing",
    "feature",
    "founding",
    "location",
    "product",
    "metric",
    "other",
  ]),
  key: z.string(),
  value: z.string(),
});
export type BrandFact = z.infer<typeof BrandFact>;

export const CompetitorInfo = z.object({
  name: z.string(),
  domain: z.string().optional(),
});
export type CompetitorInfo = z.infer<typeof CompetitorInfo>;

export const BrandInfo = z.object({
  name: z.string(),
  domain: z.string().optional(),
  description: z.string().optional(),
  facts: z.array(BrandFact).default([]),
  competitors: z.array(CompetitorInfo).default([]),
});
export type BrandInfo = z.infer<typeof BrandInfo>;

// ─── Extraction Schemas (used with AI SDK Output.object()) ──────────

export const MentionExtraction = z.object({
  brandName: z.string().describe("The name of the brand mentioned"),
  isMentioned: z
    .boolean()
    .describe("Whether this brand is actually mentioned in the response"),
  position: z
    .number()
    .nullable()
    .describe(
      "1-indexed position/rank where this brand appears (null if not mentioned)"
    ),
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .nullable()
    .describe("Sentiment score from -1 (negative) to 1 (positive)"),
  sentimentLabel: z
    .enum(["positive", "neutral", "negative"])
    .nullable()
    .describe("Overall sentiment label"),
  context: z
    .string()
    .nullable()
    .describe("Short excerpt of the surrounding text where brand is mentioned"),
});
export type MentionExtraction = z.infer<typeof MentionExtraction>;

export const MentionExtractionResult = z.object({
  mentions: z.array(MentionExtraction),
});
export type MentionExtractionResult = z.infer<typeof MentionExtractionResult>;

export const CitationExtraction = z.object({
  url: z.string().describe("The full URL cited"),
  domain: z.string().describe("The domain of the URL"),
  isBrandUrl: z
    .boolean()
    .describe("Whether this URL belongs to the target brand's domain"),
});
export type CitationExtraction = z.infer<typeof CitationExtraction>;

export const CitationExtractionResult = z.object({
  citations: z.array(CitationExtraction),
});
export type CitationExtractionResult = z.infer<typeof CitationExtractionResult>;

// ─── Hallucination Types ─────────────────────────────────────────────

export const HallucinationFinding = z.object({
  claim: z
    .string()
    .describe("The specific claim made by the AI about the brand"),
  expectedValue: z
    .string()
    .nullable()
    .describe("The correct/expected value from brand facts"),
  actualValue: z
    .string()
    .nullable()
    .describe("What the AI actually stated"),
  severity: z
    .enum(["low", "medium", "high", "critical"])
    .describe("How severe this hallucination is"),
  description: z
    .string()
    .describe("Human-readable description of the hallucination"),
  factKey: z.string().nullable().describe("The brand fact key this relates to"),
});
export type HallucinationFinding = z.infer<typeof HallucinationFinding>;

export const HallucinationResult = z.object({
  hallucinations: z.array(HallucinationFinding),
  overallAccuracy: z
    .number()
    .min(0)
    .max(1)
    .describe("Overall accuracy score from 0 to 1"),
});
export type HallucinationResult = z.infer<typeof HallucinationResult>;

// ─── Check Result Types ──────────────────────────────────────────────

export interface CheckResult {
  provider: string;
  model: string;
  prompt: string;
  promptCategory: string;
  responseText: string;
  latencyMs: number;
  mentions: MentionExtraction[];
  citations: CitationExtraction[];
  hallucinations: HallucinationFinding[];
  accuracy: number;
}

// ─── Visibility Report ──────────────────────────────────────────────

export interface VisibilityScore {
  overall: number; // 0-100
  byProvider: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface SentimentSummary {
  average: number; // -1 to 1
  label: "positive" | "neutral" | "negative";
  byProvider: Record<string, number>;
}

export interface ShareOfVoice {
  brand: string;
  percentage: number;
  mentionCount: number;
}

export interface VisibilityReport {
  brand: BrandInfo;
  timestamp: Date;
  visibility: VisibilityScore;
  sentiment: SentimentSummary;
  shareOfVoice: ShareOfVoice[];
  hallucinations: HallucinationFinding[];
  hallucinationRate: number; // 0-1
  accuracy: number; // 0-1
  totalChecks: number;
  checks: CheckResult[];
}

// ─── Prompt Types ────────────────────────────────────────────────────

export type PromptCategory =
  | "general"
  | "comparison"
  | "recommendation"
  | "pricing"
  | "review"
  | "alternative"
  | "how_to";

export interface GeneratedPrompt {
  text: string;
  category: PromptCategory;
}

// ─── Engine Config ───────────────────────────────────────────────────

export interface XelinEngineConfig {
  providers: ProviderConfig[];
  /** Model used for extraction/analysis (defaults to gpt-4o-mini) */
  analysisModel?: ProviderConfig;
  /** Max concurrent LLM calls */
  concurrency?: number;
  /** Custom prompts (overrides auto-generation) */
  prompts?: GeneratedPrompt[];
}
