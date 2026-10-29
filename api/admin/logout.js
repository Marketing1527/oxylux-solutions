import { allow, send } from '../_lib/http.js';
import { clearSession } from '../_lib/auth.js';

export default function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  clearSession(res);
  send(res, 200, { ok: true });
}
