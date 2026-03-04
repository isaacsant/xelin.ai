import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const createCheckSchema = z.object({
  brandId: z.string().uuid(),
  providers: z
    .array(
      z.object({
        provider: z.enum([
          "openai",
          "anthropic",
          "google",
          "perplexity",
          "bedrock",
        ]),
        model: z.string(),
      })
    )
    .min(1),
  prompts: z
    .array(
      z.object({
        text: z.string(),
        category: z.enum([
          "general",
          "comparison",
          "recommendation",
          "pricing",
          "review",
          "alternative",
          "how_to",
        ]),
      })
    )
    .optional(),
});

export const checkRoutes = new Hono();

// Enqueue a check
checkRoutes.post("/", zValidator("json", createCheckSchema), async (c) => {
  const data = c.req.valid("json");

  // TODO: Enqueue BullMQ job
  const checkId = crypto.randomUUID();

  return c.json(
    {
      id: checkId,
      status: "pending",
      message: "Check enqueued",
    },
    202
  );
});

// Get check status/results
checkRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  // TODO: Fetch from database
  return c.json({ error: "Not implemented" }, 501);
});
