// Engine
export { XelinEngine } from "./engine.js";

// Types
export type {
  ProviderConfig,
  BrandInfo,
  BrandFact,
  CompetitorInfo,
  CheckResult,
  VisibilityReport,
  VisibilityScore,
  SentimentSummary,
  ShareOfVoice,
  GeneratedPrompt,
  PromptCategory,
  XelinEngineConfig,
  MentionExtraction,
  CitationExtraction,
  HallucinationFinding,
} from "./types.js";

// Zod schemas (for consumers who need validation)
export {
  BrandInfo as BrandInfoSchema,
  BrandFact as BrandFactSchema,
  ProviderConfig as ProviderConfigSchema,
  ProviderName,
  MentionExtractionResult,
  CitationExtractionResult,
  HallucinationResult,
} from "./types.js";

// Sub-modules for advanced usage
export { createAdapter } from "./providers/index.js";
export { generatePrompts } from "./prompts/generator.js";
export { extractMentions } from "./extractors/mention-extractor.js";
export { extractCitations } from "./extractors/citation-extractor.js";
export { detectHallucinations } from "./analyzers/hallucination-detector.js";
export { computeVisibilityReport } from "./analyzers/visibility-scorer.js";
