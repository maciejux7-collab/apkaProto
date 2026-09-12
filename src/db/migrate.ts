import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not defined");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function migrate() {
  console.log("Starting manual migration...");
  try {
    // Add columns if they don't exist
    await sql`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;`;
    console.log("Checked/Added technicians.active column");

    await sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS maintenance_interval_months INTEGER DEFAULT 6;`;
    console.log("Checked/Added branches.maintenance_interval_months column");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

migrate();