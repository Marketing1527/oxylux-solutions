// Connects "Email to front desk" to a sending mailbox without the password ever being stored in code.
// Usage (in the project folder): npm run setup-email [-- file1.pdf file2.pdf]
// It asks for the sender and its Google app password (hidden), tests the login, optionally emails the
// given PDFs to the front desk as a test, then saves the settings to Vercel.
import { createInterface } from 'node:readline';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import nodemailer from 'nodemailer';

function ask(q, hidden) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(q); };
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

const DEFAULT_TO = 'frontdesk@oxyluxsolutions.com,liz.lago@oxyluxsolutions.com';
const user = (await ask('Sender email [lazaro@marketingsvc.com]: ')) || 'lazaro@marketingsvc.com';
const fromName = (await ask('Sender name [Essential Marketing]: ')) || 'Essential Marketing';
const pass = (await ask('Google app password for ' + user + ' (hidden): ', true)).replace(/\s+/g, '');
const to = (await ask(`Send forms to [${DEFAULT_TO}]: `)) || DEFAULT_TO;
if (!pass) { console.error('No password entered.'); process.exit(1); }

const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
try { await t.verify(); console.log('Login OK.'); }
catch (e) { console.error('Gmail rejected the login: ' + e.message); process.exit(1); }

const files = process.argv.slice(2);
if (files.length) {
  const attachments = files.map((f) => ({ filename: basename(f), content: readFileSync(f), contentType: 'application/pdf' }));
  await t.sendMail({
    from: { name: fromName, address: user }, to: to.split(',').map((s) => s.trim()),
    subject: `Signed consent forms (${attachments.length})`,
    text: ['Signed consent forms from the OxyLux website, attached:', '', ...attachments.map((a) => '- ' + a.filename), '',
      'Upload them to the patient’s Practice Fusion chart.',
      'This email contains protected health information. Do not forward it outside OxyLux.'].join('\n'),
    attachments,
  });
  console.log(`Sent ${attachments.length} PDF(s) to ${to}.`);
}

const vars = { SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '465', SMTP_USER: user, SMTP_PASS: pass, MAIL_FROM_NAME: fromName, MAIL_TO: to };
for (const [k, v] of Object.entries(vars)) {
  spawnSync('vercel', ['env', 'rm', k, 'production', '--yes'], { stdio: 'ignore' });
  const r = spawnSync('vercel', ['env', 'add', k, 'production', ...(k === 'SMTP_PASS' ? ['--sensitive'] : [])], { input: v, stdio: ['pipe', 'ignore', 'inherit'] });
  if (r.status !== 0) { console.error(`Could not set ${k} in Vercel.`); process.exit(1); }
}
console.log('Email settings saved to Vercel. Redeploy to apply: vercel --prod');
