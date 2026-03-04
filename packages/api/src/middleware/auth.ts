import { createMiddleware } from "hono/factory";
import { createHash } from "crypto";

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

  // TODO: Look up key in database, verify it's active, get userId
  // For now, pass through with a placeholder
  c.set("userId", "placeholder");

  await next();
});
