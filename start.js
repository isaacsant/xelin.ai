// Railway start script — picks which service to run based on RAILWAY_SERVICE_NAME
import { execSync } from "child_process";

const service = process.env.RAILWAY_SERVICE_NAME;

if (service === "dashboard") {
  execSync("pnpm --filter @xelin/dashboard start", { stdio: "inherit" });
} else {
  execSync("node packages/api/dist/index.js", { stdio: "inherit" });
}
