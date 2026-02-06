/**
 * Load env.local / .env.local then run: node scripts/load-env.js next build | next start
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, 'env.local');
const envPathDot = path.join(repoRoot, '.env.local');
const file = fs.existsSync(envPath) ? envPath : fs.existsSync(envPathDot) ? envPathDot : null;

if (file) {
  const content = fs.readFileSync(file, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) process.env[key] = value;
  });
}

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error('Usage: node scripts/load-env.js <command> [args...]');
  process.exit(1);
}
const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: repoRoot, env: process.env });
process.exit(r.status ?? 0);
