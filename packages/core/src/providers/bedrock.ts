import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import type { LanguageModelV1 } from "ai";
import type { ProviderAdapter } from "./base.js";

export class BedrockAdapter implements ProviderAdapter {
  readonly name = "bedrock";
  private provider;

  constructor(region?: string) {
    this.provider = createAmazonBedrock({
      region: region ?? process.env.AWS_REGION ?? "us-east-1",
    });
  }

  getModel(modelId: string): LanguageModelV1 {
    return this.provider(modelId);
  }
}
