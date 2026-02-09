/**
 * Test Postgres connection using DIRECT_URL (or DATABASE_URL) from .env.
 * Run: pnpm test:db   or   node scripts/test-connection.js
 * Shows the real error (timeout, refused, SSL, etc.) to help fix P1001.
 */
require('dotenv').config();
const { Client } = require('pg');

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('No DIRECT_URL or DATABASE_URL in .env');
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  connectionTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: true },
});

console.log('Connecting to:', url.replace(/:[^:@]+@/, ':****@'));
client
  .connect()
  .then(() => client.query('SELECT 1'))
  .then(() => {
    console.log('OK – connection and query succeeded.');
    return client.end();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Connection failed:');
    console.error('  code:', err.code);
    console.error('  message:', err.message);
    if (err.code === 'ETIMEDOUT') console.error('  → Try: Restore project in Neon/Supabase, or add &connect_timeout=30 to DIRECT_URL');
    if (err.code === 'ECONNREFUSED') console.error('  → Check: Project active? Different network/firewall?');
    process.exit(1);
  });
