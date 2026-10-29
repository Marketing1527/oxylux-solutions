import { send } from '../_lib/http.js';
import { session } from '../_lib/auth.js';
import { backendName } from '../_lib/storage.js';

export default function handler(req, res) {
  const s = session(req);
  if (!s) return send(res, 401, { error: 'Please sign in.' });
  send(res, 200, { email: s.e, storage: backendName() });
}
