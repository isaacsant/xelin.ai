import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import type { ProviderAdapter } from "./base.js";

export class OpenAIAdapter implements ProviderAdapter {
  readonly name = "openai";
  private provider;

  constructor(apiKey?: string) {
    this.provider = createOpenAI({ apiKey });
  }

  getModel(modelId: string): LanguageModelV1 {
    return this.provider(modelId);
  }
}
