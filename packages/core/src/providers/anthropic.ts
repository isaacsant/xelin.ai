import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "ai";
import type { ProviderAdapter } from "./base.js";

export class AnthropicAdapter implements ProviderAdapter {
  readonly name = "anthropic";
  private provider;

  constructor(apiKey?: string) {
    this.provider = createAnthropic({ apiKey });
  }

  getModel(modelId: string): LanguageModelV1 {
    return this.provider(modelId);
  }
}
