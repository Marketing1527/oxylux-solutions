// Local server: static files + /api functions + vercel.json rewrites. Usage: npm run dev
import http from 'node:http';
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
process.chdir(root);
if (existsSync('.env.dev')) {
  for (const line of readFileSync('.env.dev', 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
const cfg = JSON.parse(readFileSync('vercel.json', 'utf8'));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
const port = Number(process.env.PORT || 3010);

http.createServer(async (req, res) => {
  let { pathname } = new URL(req.url, 'http://x');
  try {
    if (pathname.startsWith('/api/')) {
      const file = path.join(root, pathname.replace(/\/$/, '') + '.js');
      if (!existsSync(file) || pathname.includes('/_')) { res.statusCode = 404; return res.end('Not found'); }
      const mod = await import(pathToFileURL(file).href + '?t=' + (await fs.stat(file)).mtimeMs);
      return await mod.default(req, res);
    }
    const rw = (cfg.rewrites || []).find((r) => r.source === pathname);
    if (rw) pathname = rw.destination;
    let file = path.join(root, decodeURIComponent(pathname));
    if (!file.startsWith(root) || /\/\.|node_modules|\/scripts\//.test(pathname)) { res.statusCode = 404; return res.end('Not found'); }
    if ((await fs.stat(file).catch(() => null))?.isDirectory()) file = path.join(file, 'index.html');
    const data = await fs.readFile(file).catch(() => null);
    if (!data) { res.statusCode = 404; res.setHeader('Content-Type', types['.html']); return res.end(await fs.readFile(path.join(root, '404.html'))); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (e) {
    console.error(e);
    res.statusCode = 500; res.end('Server error');
  }
}).listen(port, () => console.log(`OxyLux dev server on http://localhost:${port} (storage: ${process.env.STORAGE_BACKEND || 'auto'})`));
