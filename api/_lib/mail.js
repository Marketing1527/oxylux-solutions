// Emails signed consent PDFs to the front desk over SMTP.
//   SMTP_HOST, SMTP_PORT  default smtp.gmail.com:465
//   SMTP_USER, SMTP_PASS  sender login (Google app password); set with: npm run setup-email
//   MAIL_FROM_NAME        display name of the sender
//   MAIL_TO               comma-separated recipients
import nodemailer from 'nodemailer';
import { httpError } from './http.js';
import { storage } from './storage.js';
import { getRecord } from './records.js';

export const mailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
export const recipients = () => (process.env.MAIL_TO || 'frontdesk@oxyluxsolutions.com,liz.lago@oxyluxsolutions.com')
  .split(',').map((s) => s.trim()).filter(Boolean);

let transport;
function mailer() {
  if (!mailConfigured()) throw httpError(503, 'Email is not set up yet. Please download the PDF instead.');
  const port = Number(process.env.SMTP_PORT || 465);
  return (transport ||= nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }));
}

const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

// One email per patient visit; attachments are [{ filename, content: Buffer }].
export async function sendConsents({ patient, lines, attachments }) {
  const names = [...new Set(lines.map((l) => l.service))].join(' and ');
  const text = [
    `Signed consent form${attachments.length > 1 ? 's' : ''} for ${patient}.`, '',
    ...lines.map((l) => `- ${l.service}${l.when ? ', ' + l.when : ''}`), '',
    'Upload the attached PDF to the patient’s Practice Fusion chart.',
    'This email contains protected health information. Do not forward it outside OxyLux.',
  ].join('\n');
  await mailer().sendMail({
    from: { name: process.env.MAIL_FROM_NAME || 'OxyLux Solutions website', address: process.env.SMTP_USER },
    to: recipients(),
    subject: `Signed consent: ${patient} (${names})`,
    text,
    attachments: attachments.map((a) => ({ ...a, contentType: 'application/pdf' })),
  });
}

export function lineFor(record) {
  const drip = record.form?.drip ? ` (${record.form.drip})` : '';
  return { service: (record.serviceName || 'Consent') + drip, when: record.slot ? `${fmtDate(record.slot.date)} at ${fmtTime(record.slot.time)}` : '' };
}

export function pdfName(record) {
  const name = (record.patient?.name || 'Client').replace(/[^A-Za-z -]/g, '').trim().replace(/\s+/g, '-') || 'Client';
  return `OxyLux-${record.service}-Consent-${name}-${record.createdAt.slice(0, 10)}.pdf`;
}

// Emails a saved record's PDF and notes it in the record's history. Returns the updated record.
export async function emailRecord(record, by) {
  if (!mailConfigured()) throw httpError(503, 'Email is not set up yet. Run npm run setup-email.');
  const pdf = record.pdf ? await storage().read(record.pdf) : null;
  if (!pdf) throw httpError(404, 'Signed form file not found.');
  await sendConsents({ patient: record.patient.name, lines: [lineFor(record)], attachments: [{ filename: pdfName(record), content: pdf }] });
  const found = await getRecord(record.id);
  if (!found) return record;
  found.record.history.push({ at: new Date().toISOString(), action: 'emailed to ' + recipients().join(', '), ...(by ? { by } : {}) });
  await storage().write(found.path, JSON.stringify(found.record, null, 2), 'application/json');
  return found.record;
}
