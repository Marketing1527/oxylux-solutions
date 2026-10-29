import { allow, send, readJson, fail } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { listRecords, updateRecord } from '../_lib/records.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['GET', 'POST'])) return;
  const s = requireAdmin(req, res);
  if (!s) return;
  try {
    if (req.method === 'GET') return send(res, 200, { records: await listRecords() });
    const { id, action } = await readJson(req, 10_000);
    send(res, 200, { record: await updateRecord(String(id), String(action), s.e) });
  } catch (e) { fail(res, e); }
}
