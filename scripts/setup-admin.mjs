// Sets the /admin login on Vercel without the password ever being stored in code.
// Usage (in the project folder): npm run setup-admin
import { createInterface } from 'node:readline';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { hashPassword } from '../api/_lib/auth.js';

function ask(q, hidden) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(q); };
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

const email = await ask('Admin email: ');
const pw = await ask('Admin password (hidden): ', true);
const pw2 = await ask('Repeat password (hidden): ', true);
if (!email || pw.length < 10 || pw !== pw2) {
  console.error('Passwords must match and be at least 10 characters.'); process.exit(1);
}
const vars = { ADMIN_EMAIL: email, ADMIN_PASSWORD_HASH: hashPassword(pw), SESSION_SECRET: randomBytes(32).toString('base64url') };
for (const env of ['production']) {
  for (const [k, v] of Object.entries(vars)) {
    spawnSync('vercel', ['env', 'rm', k, env, '--yes'], { stdio: 'ignore' });
    const r = spawnSync('vercel', ['env', 'add', k, env], { input: v, stdio: ['pipe', 'ignore', 'inherit'] });
    if (r.status !== 0) { console.error(`Could not set ${k} for ${env}.`); process.exit(1); }
  }
}
console.log('Admin login saved to Vercel. Redeploy to apply: vercel --prod');
