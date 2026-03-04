import { generateObject, type LanguageModelV1 } from "ai";
import {
  HallucinationResult,
  type BrandFact,
  type HallucinationFinding,
} from "../types.js";
import { HALLUCINATION_DETECTION_PROMPT } from "../extractors/schemas.js";

export async function detectHallucinations(
  model: LanguageModelV1,
  responseText: string,
  brandName: string,
  facts: BrandFact[]
): Promise<{ hallucinations: HallucinationFinding[]; accuracy: number }> {
  if (facts.length === 0) {
    return { hallucinations: [], accuracy: 1 };
  }

  const factsText = facts
    .map((f) => `- [${f.category}] ${f.key}: ${f.value}`)
    .join("\n");

  const { object } = await generateObject({
    model,
    schema: HallucinationResult,
    system: HALLUCINATION_DETECTION_PROMPT,
    prompt: `AI Response to fact-check:
---
${responseText}
---

Brand: ${brandName}

Known facts about this brand:
${factsText}

Identify any factual inaccuracies in the AI's response compared to the known facts above.`,
  });

  return {
    hallucinations: object.hallucinations,
    accuracy: object.overallAccuracy,
  };
}
