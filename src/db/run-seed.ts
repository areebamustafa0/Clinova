import "dotenv/config";

/**
 * CLI seeding:  npx tsx src/db/run-seed.ts [--reset]
 * Without --reset the seed only runs when the database is empty.
 */
async function main() {
  const { seedDatabase, ensureSeeded } = await import("./seed");
  const { pool } = await import("./index");
  if (process.argv.includes("--reset")) {
    await seedDatabase({ reset: true });
    console.log("Database reset and seeded.");
  } else {
    const seeded = await ensureSeeded();
    console.log(seeded ? "Database seeded." : "Database already contains data – use --reset to re-seed.");
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
