/** Runs once when the Next.js server boots: seeds demo data if the database is empty. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureSeeded } = await import("@/db/seed");
    await ensureSeeded();
  } catch (error) {
    console.error("[seed] Skipped – database not ready or schema missing:", error instanceof Error ? error.message : error);
  }
}
