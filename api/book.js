// Saves a signed consent form, with or without an appointment slot.
import { allow, send, readJson, fail } from './_lib/http.js';
import { createRecord } from './_lib/records.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  try {
    const body = await readJson(req);
    if (body.website) return send(res, 200, { ok: true }); // honeypot: bots fill hidden fields
    const record = await createRecord({ slot: body.slot || null, service: body.service, screening: body.screening, form: body.form, pdfBase64: body.pdf, meta: { userAgent: req.headers['user-agent'] } });
    send(res, 201, { ok: true, id: record.id, slot: record.slot });
  } catch (e) { fail(res, e); }
}
