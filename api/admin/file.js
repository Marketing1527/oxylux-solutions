// Streams a signed consent PDF to a signed-in admin.
import { allow, send, query, fail } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { getRecord } from '../_lib/records.js';
import { storage } from '../_lib/storage.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  if (!requireAdmin(req, res)) return;
  try {
    const found = await getRecord(String(query(req).id || ''));
    if (!found) return send(res, 404, { error: 'Consent form not found.' });
    const pdf = found.record.pdf ? await storage().read(found.record.pdf) : null;
    if (!pdf) return send(res, 404, { error: 'Consent form file not found.' });
    const name = found.record.patient.name.replace(/[^A-Za-z -]/g, '').trim().replace(/\s+/g, '-') || 'Client';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', `${query(req).inline ? 'inline' : 'attachment'}; filename="OxyLux-Consent-${name}-${found.record.createdAt.slice(0, 10)}.pdf"`);
    res.end(pdf);
  } catch (e) { fail(res, e); }
}
