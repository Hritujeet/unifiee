import { config } from "dotenv"
config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/node-postgres"
import { sql } from "drizzle-orm"

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error("No DATABASE_URL in .env.local")
  console.log("Resetting:", new URL(url).host)   // check this is your dev DB

  const db = drizzle(url)
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`)
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`)
  await db.execute(sql`CREATE SCHEMA public`)
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`)
  console.log("Done")
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })