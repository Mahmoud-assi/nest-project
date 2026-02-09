/**
 * Show which database URL Prisma migrate will use (masked).
 * Run: node scripts/check-prisma-url.js
 * If you see "pooler" and get P1001, add DIRECT_URL with the direct host (e.g. db.xxx.supabase.co, or for Neon: host without -pooler).
 */
require('dotenv').config();

const direct = process.env.DIRECT_URL;
const database = process.env.DATABASE_URL;
const url = direct || database;

if (!url) {
  console.error('No DIRECT_URL or DATABASE_URL in .env');
  process.exit(1);
}

const host = (url.match(/@([^/]+)/) || [])[1] || '?';
const isPooler = host.includes('pooler');
const usedVar = direct ? 'DIRECT_URL' : 'DATABASE_URL';

console.log('Prisma migrate will use:', usedVar);
console.log('Host:', host);
if (isPooler) {
  console.log('');
  console.log('This is a POOLER URL. Migrations often fail with P1001 on poolers.');
  console.log('Add DIRECT_URL in .env with the direct host (e.g. db.xxx.supabase.co for Supabase, or for Neon use host WITHOUT -pooler).');
  process.exit(1);
} else {
  console.log('This is a direct connection (good for migrations).');
}
