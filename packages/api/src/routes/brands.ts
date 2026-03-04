import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import {
  brands,
  brandFacts,
  competitors,
  checks,
  mentions,
  hallucinations,
} from "@xelin/db";
import { getDb } from "../db.js";
import type { AuthEnv } from "../middleware/auth.js";

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

export const brandRoutes = new Hono<AuthEnv>();

// Create a brand
brandRoutes.post("/", zValidator("json", createBrandSchema), async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("userId");
  const db = getDb();

  const [brand] = await db
    .insert(brands)
    .values({
      userId,
      name: data.name,
      domain: data.domain,
      description: data.description,
    })
    .returning();

  // Insert facts
  if (data.facts.length > 0) {
    await db.insert(brandFacts).values(
      data.facts.map((f) => ({
        brandId: brand.id,
        category: f.category,
        key: f.key,
        value: f.value,
      }))
    );
  }

  // Insert competitors
  if (data.competitors.length > 0) {
    await db.insert(competitors).values(
      data.competitors.map((comp) => ({
        brandId: brand.id,
        name: comp.name,
        domain: comp.domain,
      }))
    );
  }

  // Fetch the full brand with relations
  const full = await db.query.brands.findFirst({
    where: eq(brands.id, brand.id),
    with: { facts: true, competitors: true },
  });

  return c.json(full, 201);
});

// List brands for authenticated user
brandRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const results = await db.query.brands.findMany({
    where: eq(brands.userId, userId),
    with: { facts: true, competitors: true },
    orderBy: [desc(brands.createdAt)],
  });

  return c.json(results);
});

// Get brand by ID
brandRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const db = getDb();

  const brand = await db.query.brands.findFirst({
    where: and(eq(brands.id, id), eq(brands.userId, userId)),
    with: { facts: true, competitors: true },
  });

  if (!brand) return c.json({ error: "Brand not found" }, 404);
  return c.json(brand);
});

// Get brand visibility history
brandRoutes.get("/:id/visibility", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const db = getDb();

  // Verify ownership
  const brand = await db.query.brands.findFirst({
    where: and(eq(brands.id, id), eq(brands.userId, userId)),
  });
  if (!brand) return c.json({ error: "Brand not found" }, 404);

  // Get all completed checks with mentions
  const completedChecks = await db.query.checks.findMany({
    where: and(eq(checks.brandId, id), eq(checks.status, "completed")),
    with: { mentions: true },
    orderBy: [desc(checks.createdAt)],
  });

  // Calculate visibility per check
  const history = completedChecks.map((check) => {
    const brandMention = check.mentions.find(
      (m) => m.brandName.toLowerCase() === brand.name.toLowerCase()
    );
    return {
      date: check.createdAt,
      provider: check.provider,
      model: check.model,
      isMentioned: brandMention?.isMentioned ?? false,
      position: brandMention?.position ?? null,
      sentiment: brandMention?.sentimentScore ?? null,
    };
  });

  const totalChecks = history.length;
  const mentionedCount = history.filter((h) => h.isMentioned).length;
  const visibilityScore = totalChecks > 0 ? (mentionedCount / totalChecks) * 100 : 0;

  return c.json({
    brandId: id,
    brandName: brand.name,
    visibilityScore,
    totalChecks,
    mentionedCount,
    history,
  });
});

// Get brand hallucinations
brandRoutes.get("/:id/hallucinations", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const db = getDb();

  // Verify ownership
  const brand = await db.query.brands.findFirst({
    where: and(eq(brands.id, id), eq(brands.userId, userId)),
  });
  if (!brand) return c.json({ error: "Brand not found" }, 404);

  // Get checks for this brand, then their hallucinations
  const brandChecks = await db.query.checks.findMany({
    where: eq(checks.brandId, id),
    with: { hallucinations: true },
    orderBy: [desc(checks.createdAt)],
  });

  const allHallucinations = brandChecks.flatMap((check) =>
    check.hallucinations.map((h) => ({
      ...h,
      provider: check.provider,
      model: check.model,
      checkDate: check.createdAt,
    }))
  );

  return c.json({
    brandId: id,
    brandName: brand.name,
    total: allHallucinations.length,
    hallucinations: allHallucinations,
  });
});
