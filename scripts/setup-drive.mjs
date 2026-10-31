// Connects Google Drive for bookings and signed consent forms.
// Usage (in the project folder): npm run setup-drive -- <key file> <drive link>
// With no arguments it asks for them.
// Tests a real read and write first, and only then saves the settings to Vercel.
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const ask = (q) => new Promise((resolve) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, (a) => { rl.close(); resolve(a.trim()); });
});

let path = (process.argv[2] || await ask('Path to the service account JSON key file (you can drag the file here): ')).replace(/^['"]|['"]$/g, '').replace(/\\ /g, ' ').replace(/^~/, os.homedir());
const key = JSON.parse(readFileSync(path, 'utf8'));
if (key.type !== 'service_account' || !key.client_email || !key.private_key) { console.error('That file is not a service account key.'); process.exit(1); }
let folder = process.argv[3] || await ask('Shared drive or folder link or ID: ');
folder = (/folders\/([\w-]+)/.exec(folder) || [])[1] || folder;
const impersonate = process.argv[3] ? (process.argv[4] || '') : await ask('Only if you are NOT using a Shared drive, the Workspace email to save as (otherwise press Enter): ');

process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = key.client_email;
process.env.GOOGLE_PRIVATE_KEY = key.private_key;
process.env.GOOGLE_DRIVE_FOLDER_ID = folder;
if (impersonate) process.env.GOOGLE_IMPERSONATE_USER = impersonate;
process.env.STORAGE_BACKEND = 'gdrive';

console.log(`\nTesting access as ${key.client_email} ...`);
const { storage } = await import('../api/_lib/storage.js');
const s = storage();
const p = `setup-test/connection-test-${Date.now()}.txt`;
try {
  await s.write(p, 'OxyLux connection test', 'text/plain');
  const back = await s.read(p);
  if (!back || back.toString() !== 'OxyLux connection test') throw new Error('The test file did not read back correctly.');
  const listed = await s.list('setup-test/');
  if (!listed.includes(p)) throw new Error('The test file did not appear in the folder listing.');
  await s.remove(p);
} catch (e) {
  console.error('\nConnection test failed. Nothing was changed on the website.\n' + e.message);
  process.exit(1);
}
console.log('Connection test passed: wrote, read, listed and removed a test file.\n');

const vars = { GOOGLE_SERVICE_ACCOUNT_EMAIL: key.client_email, GOOGLE_PRIVATE_KEY: key.private_key.replace(/\n/g, '\\n'), GOOGLE_DRIVE_FOLDER_ID: folder };
if (impersonate) vars.GOOGLE_IMPERSONATE_USER = impersonate;
for (const [k, v] of Object.entries(vars)) {
  spawnSync('vercel', ['env', 'rm', k, 'production', '--yes'], { stdio: 'ignore' });
  const r = spawnSync('vercel', ['env', 'add', k, 'production'], { input: v, stdio: ['pipe', 'ignore', 'inherit'] });
  if (r.status !== 0) { console.error(`Could not save ${k}.`); process.exit(1); }
}
console.log('Saved to Vercel. Redeploy to switch over: vercel --prod');
console.log('Then delete the JSON key file from this computer.');
