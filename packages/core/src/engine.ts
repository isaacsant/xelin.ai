import { generateText, type LanguageModelV1 } from "ai";
import {
  BrandInfo,
  type XelinEngineConfig,
  type CheckResult,
  type VisibilityReport,
  type GeneratedPrompt,
  type ProviderConfig,
  type ProviderName,
} from "./types.js";
import { createAdapter, type ProviderAdapter } from "./providers/index.js";
import { extractMentions } from "./extractors/mention-extractor.js";
import { extractCitations } from "./extractors/citation-extractor.js";
import { detectHallucinations } from "./analyzers/hallucination-detector.js";
import { computeVisibilityReport } from "./analyzers/visibility-scorer.js";
import { generatePrompts } from "./prompts/generator.js";

/**
 * Cheap/fast models for structured extraction, keyed by provider.
 * These are used for parsing mentions, citations, and hallucinations
 * from raw LLM responses — they don't need to be powerful, just fast.
 */
const ANALYSIS_MODEL_DEFAULTS: Record<ProviderName, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  bedrock: "anthropic.claude-3-haiku-20240307-v1:0",
  google: "gemini-2.0-flash",
  perplexity: "sonar",
};

export class XelinEngine {
  private adapters: Map<string, ProviderAdapter> = new Map();
  private config: XelinEngineConfig;
  private analysisModel: LanguageModelV1 | null = null;
  private useSameModelForAnalysis: boolean;

  constructor(config: XelinEngineConfig) {
    this.config = config;
    this.useSameModelForAnalysis = config.analysisModel === "same";

    // Initialize provider adapters
    for (const pc of config.providers) {
      if (!this.adapters.has(pc.provider)) {
        this.adapters.set(pc.provider, createAdapter(pc));
      }
    }

    // Resolve analysis model (unless "same" mode)
    if (!this.useSameModelForAnalysis) {
      this.analysisModel = this.resolveAnalysisModel(config);
    }
  }

  /**
   * Resolves the analysis model with this priority:
   * 1. Explicit `analysisModel` config
   * 2. Auto-pick cheap model from the first configured provider
   */
  private resolveAnalysisModel(config: XelinEngineConfig): LanguageModelV1 {
    if (config.analysisModel && config.analysisModel !== "same") {
      // Explicit config
      const ac = config.analysisModel;
      if (!this.adapters.has(ac.provider)) {
        this.adapters.set(ac.provider, createAdapter(ac));
      }
      return this.adapters.get(ac.provider)!.getModel(ac.model);
    }

    // Auto-resolve: use the cheapest model from the first configured provider
    const firstProvider = config.providers[0];
    const cheapModel = ANALYSIS_MODEL_DEFAULTS[firstProvider.provider];
    return this.adapters.get(firstProvider.provider)!.getModel(cheapModel);
  }

  async runCheck(brand: BrandInfo): Promise<VisibilityReport> {
    const brandInfo = BrandInfo.parse(brand);

    // Generate or use custom prompts
    const prompts: GeneratedPrompt[] =
      this.config.prompts && this.config.prompts.length > 0
        ? this.config.prompts
        : generatePrompts(brandInfo);

    // Build all tasks: each prompt × each provider
    const tasks: Array<{
      prompt: GeneratedPrompt;
      providerConfig: ProviderConfig;
    }> = [];
    for (const prompt of prompts) {
      for (const providerConfig of this.config.providers) {
        tasks.push({ prompt, providerConfig });
      }
    }

    // Run with concurrency control
    const concurrency = this.config.concurrency ?? 3;
    const results = await this.runWithConcurrency(
      tasks,
      (task) => this.executeCheck(brandInfo, task.prompt, task.providerConfig),
      concurrency
    );

    return computeVisibilityReport(brandInfo, results);
  }

  private getAnalysisModel(providerConfig: ProviderConfig): LanguageModelV1 {
    if (this.useSameModelForAnalysis) {
      // Use the same model that generated the response
      return this.adapters.get(providerConfig.provider)!.getModel(providerConfig.model);
    }
    return this.analysisModel!;
  }

  private async executeCheck(
    brand: BrandInfo,
    prompt: GeneratedPrompt,
    providerConfig: ProviderConfig
  ): Promise<CheckResult> {
    const adapter = this.adapters.get(providerConfig.provider)!;
    const model = adapter.getModel(providerConfig.model);

    // Query the LLM
    const start = Date.now();
    const { text: responseText } = await generateText({
      model,
      prompt: prompt.text,
    });
    const latencyMs = Date.now() - start;

    // Collect all brand names to look for
    const brandNames = [brand.name, ...brand.competitors.map((c) => c.name)];

    // Resolve analysis model for this check
    const analysisModel = this.getAnalysisModel(providerConfig);

    // Run extraction and analysis in parallel
    const [mentionResult, citationResult, hallucinationResult] =
      await Promise.all([
        extractMentions(analysisModel, responseText, brandNames),
        extractCitations(analysisModel, responseText, brand.domain),
        detectHallucinations(
          analysisModel,
          responseText,
          brand.name,
          brand.facts
        ),
      ]);

    return {
      provider: providerConfig.provider,
      model: providerConfig.model,
      prompt: prompt.text,
      promptCategory: prompt.category,
      responseText,
      latencyMs,
      mentions: mentionResult.mentions,
      citations: citationResult.citations,
      hallucinations: hallucinationResult.hallucinations,
      accuracy: hallucinationResult.accuracy,
    };
  }

  private async runWithConcurrency<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number
  ): Promise<R[]> {
    const results: R[] = [];
    let index = 0;

    async function next(): Promise<void> {
      while (index < items.length) {
        const currentIndex = index++;
        try {
          results[currentIndex] = await fn(items[currentIndex]);
        } catch (error) {
          console.error(`Check failed for item ${currentIndex}:`, error);
          throw error;
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(concurrency, items.length) },
      () => next()
    );
    await Promise.all(workers);
    return results;
  }
}
