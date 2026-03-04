import type { ProviderAdapter } from "./base.js";
import type { ProviderConfig } from "../types.js";
import { OpenAIAdapter } from "./openai.js";
import { AnthropicAdapter } from "./anthropic.js";
import { GoogleAdapter } from "./google.js";
import { PerplexityAdapter } from "./perplexity.js";
import { BedrockAdapter } from "./bedrock.js";

export type { ProviderAdapter };

export function createAdapter(config: ProviderConfig): ProviderAdapter {
  switch (config.provider) {
    case "openai":
      return new OpenAIAdapter(config.apiKey);
    case "anthropic":
      return new AnthropicAdapter(config.apiKey);
    case "google":
      return new GoogleAdapter(config.apiKey);
    case "perplexity":
      return new PerplexityAdapter(config.apiKey);
    case "bedrock":
      return new BedrockAdapter({
        region: config.region,
        bearerToken: config.bearerToken,
        baseUrl: config.baseUrl,
      });
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
