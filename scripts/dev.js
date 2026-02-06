/**
 * Cross-platform dev runner: loads env.local / .env.local then runs next dev.
 * Use: npm run dev (or node scripts/dev.js)
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

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

const child = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: repoRoot,
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 0));
