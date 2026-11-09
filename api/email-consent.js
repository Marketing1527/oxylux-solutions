// Resends a signed consent PDF to the front desk from /admin. Recipients are fixed on the server.
// Forms are emailed automatically when they are signed (api/book.js).
import { allow, send, readJson, fail, httpError } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { getRecord } from './_lib/records.js';
import { emailRecord, recipients } from './_lib/mail.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const { id } = await readJson(req);
    const found = await getRecord(String(id || ''));
    if (!found || !found.record.pdf) throw httpError(404, 'Signed form not found.');
    const record = await emailRecord(found.record, admin.e);
    send(res, 200, { ok: true, to: recipients(), record });
  } catch (e) { fail(res, e); }
}
