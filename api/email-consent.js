// Emails a signed consent PDF to the front desk. Recipients are fixed on the server.
// Patients can send their own form for a short time after signing; the front desk can resend from /admin.
import { allow, send, readJson, fail, httpError } from './_lib/http.js';
import { session } from './_lib/auth.js';
import { getRecord } from './_lib/records.js';
import { storage } from './_lib/storage.js';
import { sendConsents, lineFor, pdfName, recipients } from './_lib/mail.js';

const PATIENT_WINDOW_MS = 2 * 3600_000;
const PATIENT_MAX_SENDS = 2;

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  try {
    const { id } = await readJson(req);
    const found = await getRecord(String(id || ''));
    if (!found || !found.record.pdf) throw httpError(404, 'Signed form not found.');
    const { path, record } = found;
    const admin = session(req);
    const sends = (record.history || []).filter((h) => h.action.startsWith('emailed')).length;
    if (!admin && (Date.now() - Date.parse(record.createdAt) > PATIENT_WINDOW_MS || sends >= PATIENT_MAX_SENDS)) {
      throw httpError(403, 'This form can no longer be emailed from here. OxyLux already has it on file.');
    }
    const pdf = await storage().read(record.pdf);
    if (!pdf) throw httpError(404, 'Signed form file not found.');
    await sendConsents({ patient: record.patient.name, lines: [lineFor(record)], attachments: [{ filename: pdfName(record), content: pdf }] });
    record.history.push({ at: new Date().toISOString(), action: 'emailed to ' + recipients().join(', '), ...(admin ? { by: admin.e } : {}) });
    await storage().write(path, JSON.stringify(record, null, 2), 'application/json');
    send(res, 200, { ok: true, to: recipients(), record: admin ? record : undefined });
  } catch (e) { fail(res, e); }
}
