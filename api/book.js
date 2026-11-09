// Saves a signed consent form, with or without an appointment slot, then emails it to the front desk.
import { allow, send, readJson, fail } from './_lib/http.js';
import { createRecord } from './_lib/records.js';
import { emailRecord } from './_lib/mail.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  try {
    const body = await readJson(req);
    if (body.website) return send(res, 200, { ok: true }); // honeypot: bots fill hidden fields
    const record = await createRecord({ bookingId: body.bookingId || null, slot: body.bookingId ? null : body.slot || null, service: body.service, screening: body.screening, form: body.form, pdfBase64: body.pdf, meta: { userAgent: req.headers['user-agent'] } });
    // The form is already saved, so a mail problem never fails the booking; the front desk can resend from /admin.
    const emailed = await emailRecord(record).then(() => true, (e) => { console.error('Consent email failed:', e.message); return false; });
    send(res, 201, { ok: true, id: record.id, slot: record.slot, emailed });
  } catch (e) { fail(res, e); }
}
