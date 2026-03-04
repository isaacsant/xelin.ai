import { createMiddleware } from "hono/factory";
import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { apiKeys } from "@xelin/db";
import { getDb } from "../db.js";

export type AuthEnv = {
  Variables: {
    userId: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer xel_sk_")) {
    return c.json({ error: "Invalid API key format. Expected: Bearer xel_sk_..." }, 401);
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer "
  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  const db = getDb();
  const [found] = await db
    .select({ userId: apiKeys.userId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!found) {
    return c.json({ error: "Invalid or inactive API key" }, 401);
  }

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.keyHash, keyHash));

  c.set("userId", found.userId);
  await next();
});
