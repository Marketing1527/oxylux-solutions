// Admin login: one account from env vars, session in a signed HttpOnly cookie.
//   ADMIN_EMAIL          login email
//   ADMIN_PASSWORD_HASH  "scrypt$<saltB64>$<hashB64>" (create with: npm run setup-admin)
//   SESSION_SECRET       random string used to sign sessions
import { scryptSync, timingSafeEqual, createHmac, randomBytes } from 'node:crypto';
import { cookies, send } from './http.js';

const COOKIE = 'oxl_admin';
const HOURS = 10;

export function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('base64')}$${scryptSync(password, salt, 64).toString('base64')}`;
}

function configured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET);
}

export function checkLogin(email, password) {
  if (!configured()) throw Object.assign(new Error('Admin login is not set up yet. Ask Essential Marketing to finish setup.'), { status: 503 });
  const okEmail = String(email || '').trim().toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase();
  const [, salt, hash] = process.env.ADMIN_PASSWORD_HASH.split('$');
  const expected = Buffer.from(hash || '', 'base64');
  const actual = scryptSync(String(password || ''), Buffer.from(salt || '', 'base64'), 64);
  return okEmail && expected.length === actual.length && timingSafeEqual(expected, actual);
}

const sign = (data) => createHmac('sha256', process.env.SESSION_SECRET).update(data).digest('base64url');

export function setSession(res, email) {
  const payload = Buffer.from(JSON.stringify({ e: email, exp: Date.now() + HOURS * 3600_000 })).toString('base64url');
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${HOURS * 3600}${secure}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

export function session(req) {
  if (!configured()) return null;
  const raw = cookies(req)[COOKIE];
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  const good = sign(payload);
  if (!sig || sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return s.exp > Date.now() ? s : null;
  } catch { return null; }
}

// Returns the session, or sends 401 and returns null.
export function requireAdmin(req, res) {
  const s = session(req);
  if (!s) send(res, 401, { error: 'Please sign in.' });
  return s;
}
