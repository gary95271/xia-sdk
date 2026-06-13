#!/usr/bin/env node
// xia-serve.mjs — run a XIA Sandbox over your LAN from one machine.
//
// WHAT IT DOES (the public local demo)
//   1. Serves a built dist (loader + workers + packs + pyodide) over HTTP on the
//      LAN, with the right MIME + cache headers. Any device on the network opens
//      http://<this-pc>:<port>/ , and after load it has the sandbox + an Ubuntu
//      userland (busybox / bash / python3 / sqlite3) running 100% in its browser.
//   2. Provides the guest's network egress: the `/__net` endpoint is the SDK's
//      documented host netProxy chokepoint — the in-browser guest's HTTP/HTTPS
//      goes through THIS machine (and only when you turn egress on).
//   3. A control surface: a web panel (/__control) + a JSON API to see the LAN
//      URLs, flip egress on/off (+ host allowlist), and stop the server.
//
// SECURITY DEFAULTS (important — this binds to the LAN)
//   - Egress is OFF until you enable it (so the box is never an open relay).
//   - When ON, the proxy blocks private / loopback / link-local targets (SSRF
//     guard) unless --allow-private, enforces a size + time cap, and can be
//     restricted to a host allowlist.
//
// USAGE
//   node xia-serve.mjs [--dist DIR] [--port 8088] [--host 0.0.0.0]
//                      [--egress] [--allow a.com,b.com] [--allow-private]
//                      [--max-bytes 16777216] [--timeout 20000] [--no-open]
//   (a true double-click .exe is produced in the packaging flow; see README.)
'use strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dns from 'node:dns/promises';
import net from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const E = process.env;
function arg(name, def) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : def; }
function flag(name, envName) { return process.argv.includes(name) || /^(1|true|on|yes)$/i.test(envName ? (E[envName] || '') : ''); }

// Config precedence: CLI flag > env var > default. Everything is host-side
// operator config — no secrets are baked into the SDK. Copy .env.example and
// edit, or pass flags. See README.
const CFG = {
  dist: path.resolve(arg('--dist', E.XIA_DIST || path.join(HERE, '..', 'dist-demo'))),
  port: parseInt(arg('--port', E.XIA_PORT || '8088'), 10),
  host: arg('--host', E.XIA_HOST || '0.0.0.0'),
  egress: flag('--egress', 'XIA_EGRESS'),
  allow: new Set((arg('--allow', E.XIA_ALLOW || '') || '').split(',').map((s) => s.trim()).filter(Boolean)),
  allowPrivate: flag('--allow-private', 'XIA_ALLOW_PRIVATE'),
  maxBytes: parseInt(arg('--max-bytes', E.XIA_MAX_BYTES || String(16 * 1024 * 1024)), 10),
  timeoutMs: parseInt(arg('--timeout', E.XIA_TIMEOUT || '20000'), 10),
  tlsCaFile: arg('--tls-ca', E.XIA_TLS_CA || ''),
  open: !flag('--no-open', 'XIA_NO_OPEN'),
};

// External, operator-supplied TLS CA ({ caPem, caKeyPem }) for host-side HTTPS
// termination, so the guest's curl/wget HTTPS works. This replaces the old baked
// tls-ca.json secret: the SDK ships NO private key — you point XIA_TLS_CA at your
// own CA file (generate one per .env.example). Absent => no host TLS termination
// (HTTP egress still works; python's HTTPS still works via its own path).
let TLS_CA = null;
if (CFG.tlsCaFile) {
  try {
    TLS_CA = JSON.parse(fs.readFileSync(CFG.tlsCaFile, 'utf8'));
    if (!TLS_CA.caPem || !TLS_CA.caKeyPem) { console.error('! --tls-ca file missing caPem/caKeyPem'); TLS_CA = null; }
  } catch (e) { console.error(`! could not read --tls-ca ${CFG.tlsCaFile}: ${e.message}`); }
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm', '.css': 'text/css; charset=utf-8',
  '.map': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8', '.pack': 'application/octet-stream',
  '.snap': 'application/octet-stream', '.elf': 'application/octet-stream',
  '.zip': 'application/octet-stream', '.whl': 'application/octet-stream',
};
const HASHED = /\.[0-9a-f]{6,}\.[a-z0-9]+$/i;   // content-hashed asset filename

function lanUrls(port) {
  const out = [];
  for (const [, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs) {
      if (a.family === 'IPv4' && !a.internal) out.push(`http://${a.address}:${port}/`);
    }
  }
  return out;
}

// ---- SSRF guard: is a resolved IP private / loopback / link-local? ----
function ipIsPrivate(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10) return true;
    if (p[0] === 127) return true;
    if (p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 0 || p[0] >= 224) return true; // 0.0.0.0/8, multicast/reserved
    return false;
  }
  const v = ip.toLowerCase();
  return v === '::1' || v.startsWith('fc') || v.startsWith('fd') ||
    v.startsWith('fe80') || v === '::' ;
}

async function egressAllowed(host) {
  if (CFG.allow.size && !CFG.allow.has(host)) return { ok: false, why: 'not_in_allowlist' };
  if (CFG.allowPrivate) return { ok: true };
  // resolve and reject private targets
  if (net.isIP(host)) { if (ipIsPrivate(host)) return { ok: false, why: 'private_ip' }; return { ok: true }; }
  let addrs;
  try { addrs = await dns.lookup(host, { all: true }); }
  catch { return { ok: false, why: 'dns_fail' }; }
  if (!addrs.length) return { ok: false, why: 'dns_empty' };
  if (addrs.some((a) => ipIsPrivate(a.address))) return { ok: false, why: 'resolves_private' };
  return { ok: true };
}

function readBody(req, cap) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > cap) { reject(new Error('body_too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function sendJson(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': b.length });
  res.end(b);
}

// ---- the netProxy endpoint (SDK browserFetchSync wire contract) ----
//   in : { url, method, headers, bodyB64 }
//   out: { status, statusText, contentType, bodyB64 } | { error }
async function handleEgress(req, res) {
  if (!CFG.egress) return sendJson(res, 200, { error: 'egress_disabled' });
  let body;
  try { body = await readBody(req, 4 * 1024 * 1024); } catch { return sendJson(res, 200, { error: 'request_too_large' }); }
  let j;
  try { j = JSON.parse(body.toString('utf8')); } catch { return sendJson(res, 200, { error: 'bad_json' }); }
  const method = String(j.method || 'GET').toUpperCase();
  if (!/^(GET|POST|PUT|DELETE|HEAD|PATCH|OPTIONS)$/.test(method)) return sendJson(res, 200, { error: 'bad_method' });
  let u;
  try { u = new URL(j.url); } catch { return sendJson(res, 200, { error: 'bad_url' }); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return sendJson(res, 200, { error: 'bad_scheme' });
  const gate = await egressAllowed(u.hostname);
  if (!gate.ok) return sendJson(res, 200, { error: 'blocked:' + gate.why });

  const headers = {};
  for (const [k, v] of Object.entries(j.headers || {})) {
    const lk = k.toLowerCase();
    if (['host', 'content-length', 'connection'].includes(lk)) continue;
    headers[k] = v;
  }
  const reqBody = j.bodyB64 ? Buffer.from(j.bodyB64, 'base64') : undefined;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), CFG.timeoutMs);
  try {
    const r = await fetch(u, { method, headers, body: reqBody, redirect: 'follow', signal: ac.signal });
    const ab = await r.arrayBuffer();
    if (ab.byteLength > CFG.maxBytes) return sendJson(res, 200, { error: 'response_too_large' });
    const buf = Buffer.from(ab);
    log(`egress ${method} ${u.host} -> ${r.status} (${buf.length}B)`);
    return sendJson(res, 200, {
      status: r.status, statusText: r.statusText || 'OK',
      contentType: r.headers.get('content-type') || 'application/octet-stream',
      bodyB64: buf.toString('base64'),
    });
  } catch (e) {
    return sendJson(res, 200, { error: 'fetch:' + (e && e.name === 'AbortError' ? 'timeout' : String(e && e.message || e)) });
  } finally { clearTimeout(timer); }
}

// ---- control API ----
function handleApi(req, res, urlPath) {
  if (urlPath === '/__api/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true, port: CFG.port, host: CFG.host, dist: CFG.dist,
      egress: CFG.egress, allow: [...CFG.allow], allowPrivate: CFG.allowPrivate,
      maxBytes: CFG.maxBytes, timeoutMs: CFG.timeoutMs, tlsCa: !!TLS_CA,
      lanUrls: lanUrls(CFG.port),
    });
  }
  if (urlPath === '/__api/egress' && req.method === 'POST') {
    return readBody(req, 1 << 16).then((b) => {
      let j = {}; try { j = JSON.parse(b.toString() || '{}'); } catch {}
      if (typeof j.enabled === 'boolean') CFG.egress = j.enabled;
      if (Array.isArray(j.allow)) CFG.allow = new Set(j.allow.map(String).map((s) => s.trim()).filter(Boolean));
      if (typeof j.allowPrivate === 'boolean') CFG.allowPrivate = j.allowPrivate;
      log(`egress ${CFG.egress ? 'ON' : 'OFF'}${CFG.allow.size ? ' allow=[' + [...CFG.allow].join(',') + ']' : ''}${CFG.allowPrivate ? ' +private' : ''}`);
      return sendJson(res, 200, { ok: true, egress: CFG.egress, allow: [...CFG.allow], allowPrivate: CFG.allowPrivate });
    });
  }
  if (urlPath === '/__api/stop' && req.method === 'POST') {
    sendJson(res, 200, { ok: true, stopping: true });
    log('stop requested via control panel'); setTimeout(() => process.exit(0), 200);
    return;
  }
  return sendJson(res, 404, { error: 'no_such_api' });
}

// ---- static files ----
function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/demo.html';
  const full = path.join(CFG.dist, rel);
  if (!full.startsWith(CFG.dist)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('404'); }
    const ext = path.extname(full).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const headers = { 'content-type': mime, 'content-length': st.size };
    if (HASHED.test(path.basename(full))) headers['cache-control'] = 'public, max-age=31536000, immutable';
    else if (ext === '.mjs' || ext === '.html') headers['cache-control'] = 'no-store';
    // demo.html: auto-wire egress when it's on (the page reads ?netproxy=)
    if (rel === '/demo.html' && CFG.egress) {
      let html = fs.readFileSync(full, 'utf8');
      const inject = `<script>{const p=new URLSearchParams(location.search);if(!p.has('netproxy')){p.set('netproxy','/__net');location.search=p.toString();}}</script>`;
      html = html.replace(/<head[^>]*>/i, (m) => m + inject);
      const b = Buffer.from(html);
      res.writeHead(200, { 'content-type': MIME['.html'], 'content-length': b.length, 'cache-control': 'no-store' });
      return res.end(b);
    }
    res.writeHead(200, headers);
    fs.createReadStream(full).pipe(res);
  });
}

// Serve a host-side panel (control.html / console.html) shipped next to this file.
function servePanel(res, name) {
  const p = path.join(HERE, name);
  if (!fs.existsSync(p)) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end(name + ' missing'); }
  const b = fs.readFileSync(p);
  res.writeHead(200, { 'content-type': MIME['.html'], 'content-length': b.length, 'cache-control': 'no-store' });
  res.end(b);
}
// Serve the operator-supplied TLS CA (if configured). Never cached. When none is
// configured the SDK ships no CA secret — the console falls back to no host TLS
// termination. 404 here is the normal "no CA configured" signal.
function serveTlsCa(res) {
  if (!TLS_CA) return sendJson(res, 404, { error: 'no_tls_ca_configured' });
  const b = Buffer.from(JSON.stringify(TLS_CA));
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': b.length, 'cache-control': 'no-store' });
  res.end(b);
}

let server;
function log(msg) { const t = new Date().toISOString().slice(11, 19); process.stdout.write(`[${t}] ${msg}\n`); }

function start() {
  if (!fs.existsSync(path.join(CFG.dist, 'demo.html'))) {
    console.error(`! no demo.html in dist: ${CFG.dist}\n  pass --dist <built-dist-dir>`); process.exit(2);
  }
  server = http.createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0];
    if (urlPath === '/__net') return void handleEgress(req, res);
    if (urlPath.startsWith('/__api/')) return void handleApi(req, res, urlPath);
    if (urlPath === '/__tls-ca.json') return void serveTlsCa(res);
    if (urlPath === '/__control' || urlPath === '/__control/') return void servePanel(res, 'control.html');
    // The interactive Ubuntu console is the default landing page (open the URL =
    // get a typeable console). The old button demo stays at /demo.html.
    if (urlPath === '/' || urlPath === '' || urlPath === '/console' || urlPath === '/console.html' || urlPath === '/__console') return void servePanel(res, 'console.html');
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end('method'); }
    serveStatic(req, res, urlPath);
  });
  server.on('error', (e) => { console.error(`! server error: ${e.message}` + (e.code === 'EADDRINUSE' ? ` (port ${CFG.port} in use — pass --port N)` : '')); process.exit(1); });
  server.listen(CFG.port, CFG.host, () => {
    const urls = lanUrls(CFG.port);
    log(`XIA Sandbox serving ${path.basename(CFG.dist)}  ·  egress ${CFG.egress ? 'ON' : 'OFF (secure default)'}  ·  TLS-CA ${TLS_CA ? 'configured' : 'none'}`);
    log(`  console:  http://localhost:${CFG.port}/   <- interactive Ubuntu terminal (just open it)`);
    for (const u of urls) log(`  network:  ${u}   <- open on any LAN device`);
    log(`  control:  http://localhost:${CFG.port}/__control`);
    if (CFG.open) openBrowser(`http://localhost:${CFG.port}/__control`);
  });
}
function openBrowser(url) {
  try {
    const cmd = process.platform === 'win32' ? 'cmd' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
  } catch {}
}
process.on('SIGINT', () => { log('shutting down'); process.exit(0); });
start();
