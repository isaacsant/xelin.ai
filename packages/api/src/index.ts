import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = parseInt(process.env.PORT ?? process.env.API_PORT ?? "3001");

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Xelin API running on http://localhost:${info.port}`);
});
