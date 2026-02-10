import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7+ config - database URL and migration settings live here.
 * For Neon: use DIRECT_URL for migrations (Prisma CLI), DATABASE_URL for the app.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    // Folder for migration SQL files; Prisma creates it on first successful "migrate dev"
    path: 'prisma/migrations',
    seed: 'npx ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
