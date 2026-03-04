import { generateObject, type LanguageModelV1 } from "ai";
import { CitationExtractionResult } from "../types.js";
import { CITATION_EXTRACTION_PROMPT } from "./schemas.js";

export async function extractCitations(
  model: LanguageModelV1,
  responseText: string,
  brandDomain?: string
): Promise<CitationExtractionResult> {
  const { object } = await generateObject({
    model,
    schema: CitationExtractionResult,
    system: CITATION_EXTRACTION_PROMPT,
    prompt: `AI Response to analyze:
---
${responseText}
---

Target brand domain: ${brandDomain ?? "N/A"}

Extract all URLs and citations from this response.`,
  });

  return object;
}
