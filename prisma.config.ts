import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7+ config - database URL and migration settings live here.
 * For Neon: use DIRECT_URL for migrations (Prisma CLI), DATABASE_URL for the app.
 * See docs/NEON-TROUBLESHOOTING.md if you get P1001 with Neon.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Set DIRECT_URL (direct connection, no -pooler) for migrate; DATABASE_URL for app
    url: env('DIRECT_URL') || env('DATABASE_URL'),
  },
});
