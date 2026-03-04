import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModelV1 } from "ai";
import type { ProviderAdapter } from "./base.js";

export class GoogleAdapter implements ProviderAdapter {
  readonly name = "google";
  private provider;

  constructor(apiKey?: string) {
    this.provider = createGoogleGenerativeAI({ apiKey });
  }

  getModel(modelId: string): LanguageModelV1 {
    return this.provider(modelId);
  }
}
