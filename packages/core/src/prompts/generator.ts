import type { BrandInfo, GeneratedPrompt, PromptCategory } from "../types.js";

const TEMPLATES: Record<PromptCategory, (brand: BrandInfo) => string[]> = {
  general: (b) => [
    `What is ${b.name}?`,
    `Tell me about ${b.name}`,
    `What does ${b.name} do?`,
  ],
  comparison: (b) =>
    b.competitors.map(
      (c) => `Compare ${b.name} vs ${c.name}. Which is better?`
    ),
  recommendation: (b) => [
    `What is the best ${b.description ?? "product"} to use?`,
    `Can you recommend a good ${b.description ?? "solution"}?`,
    `What are the top options for ${b.description ?? "this category"}?`,
  ],
  pricing: (b) => [
    `How much does ${b.name} cost?`,
    `What is the pricing for ${b.name}?`,
  ],
  review: (b) => [
    `Is ${b.name} worth it?`,
    `What do people think about ${b.name}?`,
    `Review of ${b.name}`,
  ],
  alternative: (b) => [
    `What are some alternatives to ${b.name}?`,
    `Is there something better than ${b.name}?`,
  ],
  how_to: (b) => [
    `How do I get started with ${b.name}?`,
    `How to use ${b.name}?`,
  ],
};

export function generatePrompts(brand: BrandInfo): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];

  for (const [category, templateFn] of Object.entries(TEMPLATES)) {
    const texts = templateFn(brand);
    for (const text of texts) {
      prompts.push({ text, category: category as PromptCategory });
    }
  }

  return prompts;
}
