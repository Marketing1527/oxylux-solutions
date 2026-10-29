// Storage for bookings and signed consent PDFs.
// One interface, three backends, chosen by STORAGE_BACKEND (or detected from env):
//   gdrive - Google Drive Shared Drive via a service account (production, HIPAA with Google Workspace BAA)
//   blob   - private Vercel Blob store (demo / test data only)
//   local  - files in ./.data (local development)
// Paths look like "bookings/2026-11-03T09-30__ab12cd34.json".
import { createSign } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export class ExistsError extends Error { constructor(p) { super(`Already exists: ${p}`); this.code = 'EXISTS'; } }

export function backendName() {
  const b = process.env.STORAGE_BACKEND;
  if (b) return b;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_DRIVE_FOLDER_ID) return 'gdrive';
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return 'blob';
  return process.env.VERCEL ? 'none' : 'local';
}

let cached;
export function storage() {
  if (cached) return cached;
  const name = backendName();
  if (name === 'gdrive') cached = gdrive();
  else if (name === 'blob') cached = blob();
  else if (name === 'local') cached = local();
  else throw Object.assign(new Error('Online booking storage is not connected yet.'), { status: 503 });
  cached.name = name;
  return cached;
}

/* ---------------- local (dev) ---------------- */
function local() {
  const root = path.resolve(process.env.LOCAL_DATA_DIR || '.data');
  const full = (p) => path.join(root, p);
  return {
    async write(p, data) { await fs.mkdir(path.dirname(full(p)), { recursive: true }); await fs.writeFile(full(p), data); },
    async create(p, data) {
      await fs.mkdir(path.dirname(full(p)), { recursive: true });
      try { await fs.writeFile(full(p), data, { flag: 'wx' }); } catch (e) { if (e.code === 'EEXIST') throw new ExistsError(p); throw e; }
    },
    async read(p) { try { return await fs.readFile(full(p)); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } },
    async list(prefix) {
      const dir = full(prefix.endsWith('/') ? prefix : path.dirname(prefix));
      try { return (await fs.readdir(dir)).map((f) => path.posix.join(prefix.endsWith('/') ? prefix : path.posix.dirname(prefix) + '/', f)); }
      catch (e) { if (e.code === 'ENOENT') return []; throw e; }
    },
    async remove(p) { await fs.rm(full(p), { force: true }); },
  };
}

/* ---------------- Vercel Blob (private) ---------------- */
function blob() {
  let sdk;
  const load = async () => (sdk ||= await import('@vercel/blob'));
  const prefix = (process.env.BLOB_PREFIX || 'oxylux') + '/';
  const opts = (contentType, allowOverwrite) => ({ access: 'private', addRandomSuffix: false, allowOverwrite, contentType });
  return {
    async write(p, data, contentType) { const { put } = await load(); await put(prefix + p, data, opts(contentType, true)); },
    async create(p, data, contentType) {
      const { put } = await load();
      try { await put(prefix + p, data, opts(contentType, false)); }
      catch (e) { if (/exist/i.test(e.message)) throw new ExistsError(p); throw e; }
    },
    async read(p) {
      const { get } = await load();
      const r = await get(prefix + p, { access: 'private', useCache: false });
      if (!r || !r.stream) return null;
      return Buffer.from(await new Response(r.stream).arrayBuffer());
    },
    async list(pre) {
      const { list } = await load();
      const out = [];
      let cursor;
      do {
        const r = await list({ prefix: prefix + pre, cursor, limit: 1000 });
        r.blobs.forEach((b) => out.push(b.pathname.slice(prefix.length)));
        cursor = r.hasMore ? r.cursor : undefined;
      } while (cursor);
      return out;
    },
    async remove(p) { const { del } = await load(); await del(prefix + p); },
  };
}

/* ---------------- Google Drive (Shared Drive + service account) ---------------- */
function gdrive() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const API = 'https://www.googleapis.com/drive/v3';
  const UP = 'https://www.googleapis.com/upload/drive/v3';
  const ALL = 'supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives';
  let token, tokenExp = 0;
  const folders = {};

  async function auth() {
    if (token && Date.now() < tokenExp - 60_000) return token;
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: email, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
    const sig = createSign('RSA-SHA256').update(unsigned).sign(key).toString('base64url');
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }),
    });
    if (!r.ok) throw new Error('Google auth failed: ' + (await r.text()));
    const j = await r.json();
    token = j.access_token; tokenExp = Date.now() + j.expires_in * 1000;
    return token;
  }
  async function api(url, init = {}) {
    const r = await fetch(url, { ...init, headers: { Authorization: 'Bearer ' + (await auth()), ...(init.headers || {}) } });
    if (!r.ok) throw new Error(`Google Drive ${init.method || 'GET'} failed (${r.status}): ${await r.text()}`);
    return r;
  }
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  async function findAll(parent, name) {
    const q = encodeURIComponent(`'${parent}' in parents and trashed = false` + (name ? ` and name = '${esc(name)}'` : ''));
    const out = [];
    let pageToken = '';
    do {
      const r = await (await api(`${API}/files?q=${q}&fields=nextPageToken,files(id,name,createdTime,mimeType)&pageSize=1000&orderBy=createdTime&${ALL}${pageToken ? '&pageToken=' + pageToken : ''}`)).json();
      out.push(...r.files);
      pageToken = r.nextPageToken;
    } while (pageToken);
    return out;
  }
  async function folder(name) {
    if (folders[name]) return folders[name];
    const found = (await findAll(rootId, name)).find((f) => f.mimeType === 'application/vnd.google-apps.folder');
    if (found) return (folders[name] = found.id);
    const r = await (await api(`${API}/files?supportsAllDrives=true&fields=id`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] }),
    })).json();
    return (folders[name] = r.id);
  }
  const split = (p) => { const i = p.indexOf('/'); return [p.slice(0, i), p.slice(i + 1)]; };
  async function upload(parent, name, data, contentType) {
    const boundary = 'oxl' + Math.random().toString(36).slice(2);
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [parent] })}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
      Buffer.isBuffer(data) ? data : Buffer.from(data),
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    return (await api(`${UP}/files?uploadType=multipart&supportsAllDrives=true&fields=id,createdTime`, {
      method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
    })).json();
  }
  const trash = (id) => api(`${API}/files/${id}?supportsAllDrives=true`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });

  return {
    async write(p, data, contentType = 'application/octet-stream') {
      const [dir, name] = split(p); const parent = await folder(dir);
      const existing = await findAll(parent, name);
      if (existing[0]) {
        await api(`${UP}/files/${existing[0].id}?uploadType=media&supportsAllDrives=true`, { method: 'PATCH', headers: { 'Content-Type': contentType }, body: data });
      } else await upload(parent, name, data, contentType);
    },
    async create(p, data, contentType = 'application/octet-stream') {
      const [dir, name] = split(p); const parent = await folder(dir);
      if ((await findAll(parent, name)).length) throw new ExistsError(p);
      const mine = await upload(parent, name, data, contentType);
      // Drive allows duplicate names, so re-check and let the earliest file win a race.
      const all = await findAll(parent, name);
      if (all.length > 1 && all[0].id !== mine.id) { await trash(mine.id); throw new ExistsError(p); }
    },
    async read(p) {
      const [dir, name] = split(p); const parent = await folder(dir);
      const f = (await findAll(parent, name))[0];
      if (!f) return null;
      return Buffer.from(await (await api(`${API}/files/${f.id}?alt=media&supportsAllDrives=true`)).arrayBuffer());
    },
    async list(prefix) {
      const [dir, pre] = split(prefix); const parent = await folder(dir);
      return (await findAll(parent)).filter((f) => f.name.startsWith(pre)).map((f) => `${dir}/${f.name}`);
    },
    async remove(p) {
      const [dir, name] = split(p); const parent = await folder(dir);
      for (const f of await findAll(parent, name)) await trash(f.id);
    },
  };
}
