import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const createBrandSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  description: z.string().optional(),
  facts: z
    .array(
      z.object({
        category: z.enum([
          "pricing",
          "feature",
          "founding",
          "location",
          "product",
          "metric",
          "other",
        ]),
        key: z.string(),
        value: z.string(),
      })
    )
    .default([]),
  competitors: z
    .array(z.object({ name: z.string(), domain: z.string().optional() }))
    .default([]),
});

export const brandRoutes = new Hono();

// Create a brand
brandRoutes.post("/", zValidator("json", createBrandSchema), async (c) => {
  const data = c.req.valid("json");

  // TODO: Insert into database
  const brand = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  return c.json(brand, 201);
});

// Get brand by ID
brandRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  // TODO: Fetch from database
  return c.json({ error: "Not implemented" }, 501);
});

// Get brand visibility history
brandRoutes.get("/:id/visibility", async (c) => {
  const id = c.req.param("id");
  // TODO: Aggregate visibility scores over time
  return c.json({ error: "Not implemented" }, 501);
});

// Get brand hallucinations
brandRoutes.get("/:id/hallucinations", async (c) => {
  const id = c.req.param("id");
  // TODO: Fetch hallucinations from database
  return c.json({ error: "Not implemented" }, 501);
});
