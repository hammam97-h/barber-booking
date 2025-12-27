import { execSync } from "node:child_process";

// Simple production entrypoint that can (optionally) run DB migrations on boot.
// Useful for Render/Railway/Fly/etc.

const hasDb = Boolean(process.env.DATABASE_URL);
const migrateOnStart = process.env.MIGRATE_ON_START !== "0";

try {
  if (migrateOnStart && hasDb) {
    console.log("[startup] Running database migrations (drizzle-kit)...");
    execSync("pnpm db:push", { stdio: "inherit" });
  } else {
    console.log(
      `[startup] Skipping migrations (MIGRATE_ON_START=${process.env.MIGRATE_ON_START ?? "(unset)"}, DATABASE_URL=${hasDb ? "set" : "missing"})`
    );
  }

  console.log("[startup] Starting server...");
  execSync("node dist/index.js", { stdio: "inherit" });
} catch (err) {
  console.error("[startup] Failed to start:", err);
  process.exit(1);
}
