import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { brandRoutes } from "./routes/brands.js";
import { checkRoutes } from "./routes/checks.js";
import { setupRoutes } from "./routes/setup.js";
import { authMiddleware } from "./middleware/auth.js";

export const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Setup routes (no auth required)
app.route("/api/v1/setup", setupRoutes);

// API v1 routes (authenticated)
const api = new Hono();
api.use("*", authMiddleware);
api.route("/brands", brandRoutes);
api.route("/checks", checkRoutes);

app.route("/api/v1", api);
