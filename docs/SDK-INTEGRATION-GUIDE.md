# XIA Sandbox — SDK Integration Guide

Run real Linux programs (CPython, bash, busybox, sqlite3, a scientific Python
stack, ffmpeg) **entirely in the browser**, on the user's own device, with no
backend. This guide is the complete integration surface: how you load it, the
message protocol you talk to it over, the `run` contract, init options, the
network-egress model, and hosting requirements.

> Status: pre-launch preview. The public API shape below is frozen for 1.0;
> exact `reason` enum strings are finalized in the release spec.

---

## 1. The model in one paragraph

You create **one Web Worker** and talk to it with `postMessage`. You send `init`
once, then `run` to execute a program and get a `result`. A small filesystem
surface (`put-file` / `get-file` / `provision`) lets you seed and read files.
The engine ahead-of-time-translates x86-64 to WebAssembly and routes each call to
the best-fit runtime automatically; results are byte-for-byte what real x86 would
produce. Nothing leaves the device unless you explicitly wire network egress.

---

## 2. Quick start

### Option A — serve it locally over your LAN (`xia-serve`)

```sh
node xia-serve/xia-serve.mjs --dist /path/to/dist --port 8088
# open the printed network URL on any device:
#   /console     interactive Ubuntu terminal (hand this to users)
#   /__control   host control panel (egress on/off, stop)
```
See [`xia-serve/README.md`](../xia-serve/README.md). This is also how you give the
sandbox internet access (egress), supply the TLS CA, and start/stop it. All
config is operator-side (`.env`) — **no secrets are baked into the SDK**.

### Option B — embed in your web app

```js
const worker = new Worker(new URL('./fullruntime-worker.mjs', import.meta.url), { type: 'module' });

const pending = new Map(); let nextId = 1;
worker.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'boot') {
    // engine is ready — send init once, with the manifest it should load
    fetch('./manifest.json').then(r => r.json()).then(manifest => {
      worker.postMessage({ type: 'init', assetBase: './', manifest, netProxy: null });
    });
    return;
  }
  if (m.type === 'ready') { /* init complete; safe to run */ return; }
  const res = pending.get(m.id); if (res) { pending.delete(m.id); res(m); }
};

function run(core, argv, opts = {}) {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    worker.postMessage({ type: 'run', id, core, argv, ...opts });
  });
}

// later:
const r = await run('python3', ['python3', '-c', 'print(2**100)']);
console.log(r.exit, r.stdout);   // 0  "1267650600228229401496703205376\n"
```

---

## 3. The Worker message protocol

You **send** messages to the worker; it **posts back** messages. Requests carry
an `id` you generate; the matching reply echoes it.

### 3.1 Lifecycle

| direction | message | meaning |
|---|---|---|
| ← worker | `{ type: 'boot' }` | engine loaded; send `init` now |
| → worker | `{ type: 'init', assetBase, manifest, ...options }` | configure + load assets (once) |
| ← worker | `{ type: 'ready' }` | init complete; `run` is now safe |

### 3.2 Execute

| direction | message |
|---|---|
| → worker | `{ type: 'run', id, core, argv, stdin?, timeout? }` |
| ← worker | `{ type: 'result', id, exit, stdout, stderr, wall, warm, path, reason }` |

### 3.3 Filesystem

| message | meaning |
|---|---|
| `{ type: 'put-file', id, path, bytes }` | write `bytes` (Uint8Array; transfer `bytes.buffer`) to `path` in the sandbox FS |
| `{ type: 'get-file', id, path }` | read a file back (reply carries the bytes) |
| `{ type: 'provision', id, resource, files }` | bulk-seed a named resource (e.g. a dataset / package) |
| `{ type: 'list-provisioned', id }` | list provisioned resources |
| `{ type: 'reset-overlay', id }` | wipe the writable overlay back to the clean rootfs |

The sandbox FS is **persistent** across reloads when persistence is enabled (see
init options).

---

## 4. The `run` contract

**Request:**

| field | type | meaning |
|---|---|---|
| `core` | string | one of `python3`, `bash`, `busybox`, `sqlite3` (more via routing) |
| `argv` | string[] | the full argument vector, e.g. `['python3','-c','...']` or `['busybox','sh','-c','...']` |
| `stdin` | string \| Uint8Array? | optional standard input |
| `timeout` | number? | optional wall-clock cap (ms) |

**Result:**

| field | type | meaning |
|---|---|---|
| `exit` | number | process exit code |
| `stdout` / `stderr` | string | captured output |
| `wall` | number | wall-clock ms |
| `warm` | boolean | a warm runtime was reused (vs cold start) |
| `path` | string | **observational** — which runtime served it (`native` / `x86` / `sci` / `video`) |
| `reason` | string | **machine-readable** status enum — branch on this, never parse `stderr` |

`path` is for telemetry/insight only; **do not** make behavior depend on it.
`reason` is the stable, machine-readable signal (e.g. a clean run, a fall-back, a
capability gate like `x86_disabled_mobile`). The full enum is frozen in the
release spec.

---

## 5. `init` options

```js
worker.postMessage({
  type: 'init',
  assetBase: './',         // base URL for assets (relative to the page)
  manifest,                // the parsed manifest.json (v0 flat OR xia-manifest/1)
  netProxy: null,          // host egress endpoint URL, or null for no network
  // --- optional ---
  persist: true,           // persist the writable FS overlay across reloads (IndexedDB)
  prewarmSci: false,       // pre-spin the scientific (Pyodide) sub-worker in the background
  prewarmX86: false,       // pre-spin the x86 canonical runtime
  mobileX86: false,        // opt in to the x86 lane on mobile (off by default — heavy)
  env: { /* VAR: 'value' */ },   // extra environment for the guest
});
```

- **`netProxy`** — the URL of a host endpoint that performs the guest's network
  requests (see §6). `null` ⇒ the guest has no network. (`xia-serve` exposes this
  at `/__net`; the bundled demo also reads it from the `?netproxy=` query param.)
- **`persist`** — when on, files the guest writes survive a page reload.
- **`prewarmSci` / `prewarmX86`** — default **off**. Turn on if your workload is
  known to need that runtime, to hide its cold start.
- **`mobileX86`** — the heavy x86 lane is disabled on mobile by default (it can
  exceed a phone tab's memory budget); opt in only if you've measured it's safe.

---

## 6. Network egress (the host netProxy)

The guest has **no ambient network**. The single egress point is a host endpoint
you provide as `netProxy`. The engine's in-browser net stack calls it with a
synchronous request; HTTPS is TLS-terminated host-side inside the worker (using a
sandbox CA), so your endpoint only ever sees plain HTTP-level requests.

**Wire contract** (what your endpoint receives and must return):

```
POST <netProxy>      content-type: application/json
  request  body : { "url", "method", "headers", "bodyB64" }     // bodyB64: base64 or null
  response body : { "status", "statusText", "contentType", "bodyB64" }   // 200 OK
            or  : { "error": "<reason>" }
```

`xia-serve` implements exactly this at `/__net`, with the security posture you
should mirror in any custom proxy:

- **off by default** — no egress until explicitly enabled;
- **SSRF guard** — reject targets that resolve to private/loopback/link-local IPs unless explicitly allowed;
- **allowlist** — optionally restrict to specific hosts;
- **caps** — per-request size and time limits.

Egress is the host's chokepoint: you decide exactly what the sandbox can reach.

---

## 7. Cores & runtimes

| `core` | what it is |
|---|---|
| `python3` | real CPython 3.12 + standard library |
| `bash` | GNU bash 5.2 (arrays, `[[ ]]`, arithmetic, …) |
| `busybox` | busybox `sh` + ~270 applets (coreutils-style) |
| `sqlite3` | sqlite3 CLI |

Behind these, the engine picks a runtime per call and **falls back transparently**
to the authoritative x86 path on anything non-trivial, so results always match
real x86. An optional **scientific** runtime (Pyodide: NumPy / pandas / Matplotlib
/ Pillow / scikit-learn) and a **video** runtime (ffmpeg) engage automatically for
matching workloads. Each heavy runtime runs in its own sub-worker, isolated so an
out-of-memory in one can't crash the others.

---

## 8. Hosting requirements

Static hosting is enough — **no** COOP/COEP/SharedArrayBuffer required.

- **MIME**: `.mjs` → `text/javascript`, `.wasm` → `application/wasm`, `.json` → `application/json`.
- **CSP**: allow `worker-src 'self'` (and `script-src 'self'`).
- **Caching**: serve the worker `.mjs` as **`no-store`**; content-hash-named assets (`*.<hash>.pack/.wasm/.js`) as `immutable`.
- **Offline / restricted browsers** (in-app webviews, Electron): **self-host all assets** — no public CDNs. The engine exposes the knobs for this.

`xia-serve` already sets all of these correctly; use it as the reference for a
custom host.

---

## 9. Versioning

Assets are content-addressed; the version fingerprint is the **manifest hash**,
not a semver string. A `build.lock.json` records the source provenance. The
manifest is **additive** — a newer engine reads an older manifest — so clients
detect a new version by the manifest hash and swap the whole asset root atomically,
rolling back with zero re-download (see the client version-update protocol).

---

## 10. Limits (current)

- Cross-ELF subprocess (one program `exec`-ing a *different* program) is limited; single-program `fork`/`exec` works.
- Raw sockets are gated; HTTP/HTTPS egress via `netProxy` is the supported path.
- The x86 lane is disabled on mobile by default (memory budget); native + scientific runtimes still work there.
- Some AVX/EVEX instructions trap loudly rather than run (no silent wrong results).

---

*Questions about commercial integration or the frozen API: see the landing page.
This document describes the public interface only; the engine ships as a compiled
binary under its EULA.*
