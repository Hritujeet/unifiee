import { config } from 'dotenv';
config({ path: '.env.local' });
import { defineConfig } from 'drizzle-kit';
import { normalizeDatabaseConnectionString } from './src/lib/db/connection-string';

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured.');

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: normalizeDatabaseConnectionString(databaseUrl),
  },
});
