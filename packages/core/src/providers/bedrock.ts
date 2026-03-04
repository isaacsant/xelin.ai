import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
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
 *    Injects Authorization header via custom fetch, bypassing SigV4.
 */
export class BedrockAdapter implements ProviderAdapter {
  readonly name = "bedrock";
  private provider;

  constructor(opts?: {
    region?: string;
    bearerToken?: string;
    baseUrl?: string;
  }) {
    const region = opts?.region ?? process.env.AWS_REGION ?? "us-east-1";
    const token = opts?.bearerToken ?? process.env.AWS_BEARER_TOKEN_BEDROCK;

    if (token) {
      // Bearer token mode: pass dummy IAM creds to satisfy SDK validation,
      // then custom fetch replaces SigV4 auth with bearer token
      this.provider = createAmazonBedrock({
        region,
        accessKeyId: "bearer-token-auth",
        secretAccessKey: "bearer-token-auth",
        baseURL: opts?.baseUrl,
        fetch: async (url, init) => {
          const headers = new Headers(init?.headers);
          // Replace SigV4 Authorization with bearer token
          headers.set("Authorization", `Bearer ${token}`);
          // Remove SigV4-specific headers
          headers.delete("x-amz-date");
          headers.delete("x-amz-security-token");
          headers.delete("x-amz-content-sha256");
          return globalThis.fetch(url, { ...init, headers });
        },
      });
    } else {
      // Standard IAM credentials mode
      this.provider = createAmazonBedrock({ region });
    }
  }

  getModel(modelId: string): LanguageModelV1 {
    return this.provider(modelId);
  }
}
