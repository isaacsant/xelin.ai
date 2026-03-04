import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import type { ProviderAdapter } from "./base.js";

/**
 * Bedrock adapter supporting two auth modes:
 *
 * 1. **IAM credentials** (default) — uses AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *    from env or explicit config. Standard SigV4 auth.
 *
 * 2. **Bearer token** (API Key) — uses AWS Bedrock API Key auth.
 *    Set via `bearerToken` config or `AWS_BEARER_TOKEN_BEDROCK` env var.
 *    Routes through Bedrock's OpenAI-compatible endpoint.
 */
export class BedrockAdapter implements ProviderAdapter {
  readonly name = "bedrock";
  private provider;
  private useBearer: boolean;
  private bearerProvider?: ReturnType<typeof createOpenAI>;

  constructor(opts?: { region?: string; bearerToken?: string; baseUrl?: string }) {
    const region = opts?.region ?? process.env.AWS_REGION ?? "us-east-1";
    const token = opts?.bearerToken ?? process.env.AWS_BEARER_TOKEN_BEDROCK;

    this.useBearer = !!token;

    if (token) {
      // Bearer token mode: use OpenAI-compatible endpoint
      const baseURL =
        opts?.baseUrl ??
        `https://bedrock-runtime.${region}.amazonaws.com/v1`;

      this.bearerProvider = createOpenAI({
        apiKey: token,
        baseURL,
      });
      // Still create standard provider as fallback
      this.provider = createAmazonBedrock({ region });
    } else {
      // Standard IAM credentials mode
      this.provider = createAmazonBedrock({ region });
    }
  }

  getModel(modelId: string): LanguageModelV1 {
    if (this.useBearer && this.bearerProvider) {
      return this.bearerProvider(modelId);
    }
    return this.provider(modelId);
  }
}
