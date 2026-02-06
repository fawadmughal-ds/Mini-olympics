/**
 * Windows-friendly DB init: loads env.local and runs full-init.sql.
 * Once you have Fawad's .env, copy it to env.local then run: node scripts/run-db-init.js
 * Requires: psql in PATH (from Postgres install or Git for Windows), OR run from Git Bash: ./scripts/db.sh init
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
  const envPath = path.join(repoRoot, 'env.local');
  const altPath = path.join(repoRoot, '.env.local');
  const file = fs.existsSync(envPath) ? envPath : fs.existsSync(altPath) ? altPath : null;
  if (!file) {
    console.error('No env.local or .env.local found. Copy env.example to env.local and set DATABASE_URL.');
    process.exit(1);
  }
  const content = fs.readFileSync(file, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) process.env[key] = value;
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.includes('user:password@host') || databaseUrl.includes('placeholder')) {
  console.error('Set a real DATABASE_URL in env.local (e.g. from Fawad\'s .env).');
  process.exit(1);
}

const sqlFile = path.join(__dirname, 'full-init.sql');
if (!fs.existsSync(sqlFile)) {
  console.error('full-init.sql not found');
  process.exit(1);
}

console.log('Running DB init (full-init.sql)...');
try {
  execSync(`psql "${databaseUrl}" -X -v ON_ERROR_STOP=1 -f "${sqlFile}"`, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
  });
  console.log('DB init done.');
} catch (e) {
  if (e.status === 127 || e.message && e.message.includes('psql')) {
    console.error('psql not found. Either:');
    console.error('  1. Install PostgreSQL client and add it to PATH, or');
    console.error('  2. Open Git Bash in this repo and run: ./scripts/db.sh init');
  }
  process.exit(e.status || 1);
}
