import { generateText, type LanguageModelV1 } from "ai";
import {
  BrandInfo,
  type XelinEngineConfig,
  type CheckResult,
  type VisibilityReport,
  type GeneratedPrompt,
  type ProviderConfig,
} from "./types.js";
import { createAdapter, type ProviderAdapter } from "./providers/index.js";
import { extractMentions } from "./extractors/mention-extractor.js";
import { extractCitations } from "./extractors/citation-extractor.js";
import { detectHallucinations } from "./analyzers/hallucination-detector.js";
import { computeVisibilityReport } from "./analyzers/visibility-scorer.js";
import { generatePrompts } from "./prompts/generator.js";

export class XelinEngine {
  private adapters: Map<string, ProviderAdapter> = new Map();
  private config: XelinEngineConfig;
  private analysisModel: LanguageModelV1;

  constructor(config: XelinEngineConfig) {
    this.config = config;

    // Initialize provider adapters
    for (const pc of config.providers) {
      const key = `${pc.provider}:${pc.model}`;
      if (!this.adapters.has(pc.provider)) {
        this.adapters.set(pc.provider, createAdapter(pc));
      }
    }

    // Setup analysis model (defaults to OpenAI gpt-4o-mini)
    const analysisConfig = config.analysisModel ?? {
      provider: "openai" as const,
      model: "gpt-4o-mini",
    };
    if (!this.adapters.has(analysisConfig.provider)) {
      this.adapters.set(analysisConfig.provider, createAdapter(analysisConfig));
    }
    this.analysisModel = this.adapters
      .get(analysisConfig.provider)!
      .getModel(analysisConfig.model);
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
    const brandNames = [
      brand.name,
      ...brand.competitors.map((c) => c.name),
    ];

    // Run extraction and analysis in parallel
    const [mentionResult, citationResult, hallucinationResult] =
      await Promise.all([
        extractMentions(this.analysisModel, responseText, brandNames),
        extractCitations(this.analysisModel, responseText, brand.domain),
        detectHallucinations(
          this.analysisModel,
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
          console.error(
            `Check failed for item ${currentIndex}:`,
            error
          );
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
