import { generateObject, type LanguageModelV1 } from "ai";
import { MentionExtractionResult } from "../types.js";
import { MENTION_EXTRACTION_PROMPT } from "./schemas.js";

export async function extractMentions(
  model: LanguageModelV1,
  responseText: string,
  brandNames: string[]
): Promise<MentionExtractionResult> {
  const { object } = await generateObject({
    model,
    schema: MentionExtractionResult,
    system: MENTION_EXTRACTION_PROMPT,
    prompt: `AI Response to analyze:
---
${responseText}
---

Brands to look for: ${brandNames.join(", ")}

Extract mention data for each brand listed above.`,
  });

  return object;
}
