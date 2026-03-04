import type { LanguageModelV1 } from "ai";

export interface ProviderAdapter {
  readonly name: string;
  getModel(modelId: string): LanguageModelV1;
}
