// Small helpers so handlers work both on Vercel and in scripts/dev-server.mjs.
export async function readJson(req, limit = 4_000_000) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error('Request too large'), { status: 413 });
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export function allow(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  send(res, 405, { error: 'Method not allowed' });
  return false;
}

export function query(req) {
  return Object.fromEntries(new URL(req.url, 'http://x').searchParams);
}

export function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function fail(res, err) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  send(res, status, { error: status >= 500 ? 'Something went wrong on our side. Please try again or call (305) 205-2738.' : err.message });
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
