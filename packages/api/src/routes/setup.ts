import { Hono } from "hono";
import { createHash, randomBytes } from "crypto";
import { users, apiKeys } from "@xelin/db";
import { getDb } from "../db.js";

export const setupRoutes = new Hono();

// One-time setup: create a test user and API key
setupRoutes.post("/init", async (c) => {
  const db = getDb();

  // Check if any user exists
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    return c.json(
      { error: "Already initialized. Use your existing API key." },
      409
    );
  }

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: "admin@xelin.ai",
      name: "Admin",
    })
    .returning();

  // Generate API key
  const rawKey = `xel_sk_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 15);

  await db.insert(apiKeys).values({
    userId: user.id,
    keyHash,
    keyPrefix,
    label: "Default API Key",
  });

  return c.json({
    message: "Setup complete! Save your API key — it won't be shown again.",
    userId: user.id,
    apiKey: rawKey,
    keyPrefix,
  });
});
