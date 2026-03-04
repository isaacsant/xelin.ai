import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import type { ProviderAdapter } from "./base.js";

export class PerplexityAdapter implements ProviderAdapter {
  readonly name = "perplexity";
  private provider;

  constructor(apiKey?: string) {
    this.provider = createOpenAI({
      apiKey,
      baseURL: "https://api.perplexity.ai",
    });
  }

  getModel(modelId: string): LanguageModelV1 {
    return this.provider(modelId);
  }
}
