# xia-serve — run a XIA Sandbox over your LAN

One machine serves the sandbox; **any device on the network** opens a URL and
gets a full Ubuntu userland (busybox / bash / python3 / sqlite3) running 100% in
its own browser — no install on the client, nothing sent to a server.

## Run it

**Windows (double-click):** run `xia-serve.cmd`. It needs Node.js on PATH; the
packaging flow ships a standalone `xia-serve.exe` that needs no Node (see below).

**Any OS (Node):**
```sh
node xia-serve.mjs --dist /path/to/built-dist --port 8088
```

On start it prints the URLs:
```
  local:    http://localhost:8088/
  network:  http://<your-lan-ip>:8088/   <- open on any LAN device
  control:  http://localhost:8088/__control
```
Open a **network** URL on a phone/laptop/tablet on the same Wi-Fi → the sandbox
loads and drops into the Ubuntu environment.

## Interactive console

Opening the server URL (`http://<host>:<port>/`) drops you straight into a full
**Ubuntu terminal** — type commands and press Enter (`uname -a`, `python3 --version`,
`ls /`, `python3 -c 'print(2**100)'`, real bash). (`/console` is an explicit alias for the same page.)
It runs 100% in the visitor's browser; the working directory persists across
commands and files persist across reloads. This is the page to hand to users.

## Configuration (`.env`)

Copy [`.env.example`](./.env.example) to `.env` (or set the vars in your
environment); CLI flags override. **No secrets are baked into the SDK** — port,
egress policy, and the TLS CA are all operator config.

## Control panel (`/__control`, host-only)

- See the LAN URLs to hand out.
- **Egress on/off** + host allowlist (see below).
- **Stop** the server.

Change the port by stopping and relaunching with `--port N`.

## Network egress (the guest's internet)

By default the sandbox has **no network** — it's sealed. Turn on **egress** (in
the panel or `--egress`) and the guest's HTTP/HTTPS flows out **through this
machine** via the `/__net` endpoint (the SDK's documented `netProxy` chokepoint).

Secure by default when on:
- private / loopback / link-local targets are **blocked** (SSRF guard) unless `--allow-private`;
- optional host **allowlist** (`--allow a.com,b.com` or in the panel);
- per-request **size + time caps** (`--max-bytes`, `--timeout`).

```sh
# serve with egress on, restricted to two hosts:
node xia-serve.mjs --dist ./dist --egress --allow api.github.com,pypi.org
```

## Flags

| flag | default | meaning |
|---|---|---|
| `--dist DIR` | `../dist-demo` | the built SDK dist to serve |
| `--port N` | `8088` | listen port |
| `--host H` | `0.0.0.0` | bind address (LAN) |
| `--egress` | off | enable guest network egress at start |
| `--allow a,b` | (any public) | egress host allowlist |
| `--allow-private` | off | allow private/loopback egress targets (careful) |
| `--max-bytes N` | 16 MiB | egress response size cap |
| `--timeout MS` | 20000 | egress request timeout |
| `--tls-ca FILE` | (none) | operator TLS CA file for guest HTTPS (see below) |
| `--no-open` | — | don't auto-open the control panel |

(Each flag has an `XIA_*` env equivalent — see `.env.example`.)

## TLS CA for guest HTTPS (operator-supplied, not baked)

For the sandbox's `curl`/`wget` **HTTPS** to work, the engine terminates TLS
host-side using a CA. The SDK **ships no CA private key** — you supply your own:

1. Generate a throwaway sandbox-local CA (see [`tls-ca.example.json`](./tls-ca.example.json) for the exact `openssl` line).
2. Point `XIA_TLS_CA` (or `--tls-ca`) at your `{ caPem, caKeyPem }` file.

`xia-serve` then serves it at `/__tls-ca.json` and the console wires it in. With
no CA configured, the sandbox runs without host TLS termination (HTTP egress and
Python's own HTTPS still work). This CA only signs certs **inside the user's own
browser tab** — generate one per deployment; never commit a real key.

## Packaging into a standalone `.exe`

`xia-serve.mjs` is dependency-free (Node built-ins only), so the public build can
bundle it + a chosen `dist/` into a single double-click executable that needs no
Node install. In the packaging flow:

```sh
# example with Node's built-in SEA, or pkg/nexe in CI:
node --experimental-sea-config sea-config.json   # -> xia-serve.exe
# then drop the dist alongside (or embed it) and ship the folder.
```

The control panel, egress proxy, and LAN serving are all in the one `.mjs`, so
the `.exe` behaves identically to `node xia-serve.mjs`.

See [`../docs/SDK-INTEGRATION-GUIDE.md`](../docs/SDK-INTEGRATION-GUIDE.md) for the
full SDK API (the Worker protocol, `run` contract, init options, the netProxy wire format).
