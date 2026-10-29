import { allow, send, readJson, fail } from '../_lib/http.js';
import { checkLogin, setSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  try {
    const { email, password } = await readJson(req, 10_000);
    if (!checkLogin(email, password)) {
      await new Promise((r) => setTimeout(r, 800)); // slow down guessing
      return send(res, 401, { error: 'That email and password don’t match. Check them and try again.' });
    }
    setSession(res, String(email).trim().toLowerCase());
    send(res, 200, { ok: true });
  } catch (e) { fail(res, e); }
}
