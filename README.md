<div align="center">

**English** · [中文](./README.zh-CN.md)

# XIA Sandbox

### Run real Linux programs in the browser. No server. No install. Just a tab.

**Status: 🟢 Public preview** · **Free for personal use · Commercial license available** · **Built on WebAssembly**

<sub>Real CPython · Real shells · Real SQLite · 100% client-side · Native AOT x86 → WebAssembly</sub>

</div>

---

## 🟢 Public preview — try it now

XIA Sandbox is in **public preview**. The local demo runner, the full integration
docs, and the SDK surface are **available now** — spin up an interactive Ubuntu
console on your LAN in minutes (see [**Quick start**](#quick-start)). The drop-in
1.0 SDK package is on the way; ⭐ star / watch to follow the launch.

> 👀 **Start here:** [Quick start](#quick-start) · [SDK overview](./docs/SDK-OVERVIEW.md) · [full integration guide](./docs/SDK-INTEGRATION-GUIDE.md) · [local demo runner (`xia-serve`)](./xia-serve/README.md) · [CHANGELOG](./CHANGELOG.md) (`0.1.0-preview`)

---

## What is this?

**XIA Sandbox runs *real* Linux programs — genuine CPython, bash, busybox, SQLite — entirely inside a browser tab, on the user's own device.**

Open a page and you get a real **Ubuntu console**: type `python3`, run a `bash` script, query SQLite — and it executes locally in pure WebAssembly, with **nothing sent to a server**. There's no backend to send it to.

It's not a reimplementation, and not a cloud VM you rent. The actual x86 binaries are **ahead-of-time translated to WebAssembly**, so you get the fidelity of the real toolchain with the reach and safety of the web platform — and results are **byte-for-byte identical to real x86**.

Drop the SDK into any web app, or serve the demo on your LAN and open it on any phone or laptop: a full compute environment that boots in seconds, runs offline once cached, and keeps every byte on the device.

---

## Why it's different

| | |
|---|---|
| 🔒 **Private by architecture** | Code and data never leave the device. There is no backend to send them to. Perfect for sensitive workloads where "don't upload it" is a hard requirement. |
| ⚡ **Native AOT, not an interpreter** | x86 is translated to WebAssembly ahead of time — not emulated instruction-by-instruction. Real performance, real binaries. |
| 🐍 **The real Python you know** | Genuine CPython with the standard library — plus an optional scientific stack (NumPy, pandas, Matplotlib, Pillow). |
| 🧰 **Real Linux tooling** | Shells and core utilities, SQLite, and a real, persistent filesystem. |
| 🤖 **Agent-ready** | Give an AI agent a safe, real place to run code — sandboxed on the user's machine, not on your servers. |
| 🌐 **Web-native delivery** | Content-addressed, cacheable, versioned assets. Loads lazily; works offline once cached. |
| 📱 **Desktop & mobile** | Designed to degrade gracefully across devices, from laptops to phones. |

---

## What you can build

- **Privacy-first & local-first apps** — process documents, data, or secrets that must never touch a server.
- **In-browser data science** — notebooks and analysis with NumPy / pandas / Matplotlib, no kernel to host.
- **Document automation** — read and generate Word, Excel, PowerPoint, PDF, all client-side.
- **Safe AI agent execution** — let agents run real code in a sandbox the user owns.
- **Interactive education & docs** — runnable examples with a real interpreter, zero install.
- **Edge & offline tools** — compute that keeps working when the network doesn't.

---

## How it works

*(High-level — no code, just the idea.)*

```
   Your web app
        │  drop-in SDK
        ▼
  ┌──────────────────────────────────────────────┐
  │  XIA Sandbox  (runs in a Web Worker)           │
  │                                                │
  │   real Linux program (ELF)                     │
  │        │  ahead-of-time translation            │
  │        ▼                                        │
  │   WebAssembly  ──►  executes on-device          │
  │                                                │
  │   • multiple runtimes, picked automatically     │
  │   • persistent filesystem                       │
  │   • content-addressed, cached, versioned assets │
  └──────────────────────────────────────────────┘
        │
        ▼
   results stay on the device
```

No servers in that picture — and that's the point.

---

## Quick start

### Try the demo on your LAN

Run the sandbox from **one** machine; open it on **any** device on the same network — phone, tablet, laptop. Each device runs the sandbox entirely in its own browser.

```sh
# 1. get the engine build (the dist/) — see Releases (coming soon)
# 2. serve it on your LAN:
node xia-serve/xia-serve.mjs --dist ./dist --port 8088
# 3. open the printed network URL on any device — the Ubuntu console loads right there
```

The page that opens is an **interactive Ubuntu terminal** — type `uname -a`, `ls /`, `python3 --version`, `python3 -c 'print(2**100)'`, real `bash`. The host control panel at `/__control` turns on the sandbox's network access and stops the server. Full options, the `.env` config, and the bring-your-own TLS CA are in [`xia-serve/README.md`](./xia-serve/README.md).

> No Node? The packaging flow ships a double-click `xia-serve.exe` (no install). The engine build is provided separately and is pre-launch.

### Embed it in your web app

One Web Worker + a tiny message protocol: **`init` → `run` → `result`**.

```js
const worker = new Worker(new URL('./fullruntime-worker.mjs', import.meta.url), { type: 'module' });
worker.onmessage = (e) => {
  if (e.data.type === 'boot')
    fetch('./manifest.json').then(r => r.json())
      .then(manifest => worker.postMessage({ type: 'init', assetBase: './', manifest }));
};
// run a real program on the user's device:
worker.postMessage({ type: 'run', id: 1, core: 'python3', argv: ['python3', '-c', 'print(2**100)'] });
// <- { type:'result', id:1, exit:0, stdout:'1267650600228229401496703205376\n', ... }
```

Full API (Worker protocol, `run` contract, init options, network egress, hosting): [`docs/SDK-INTEGRATION-GUIDE.md`](./docs/SDK-INTEGRATION-GUIDE.md).

---

## Roadmap

- [x] Core engine: real binaries running in the browser
- [x] Python + scientific stack
- [x] Document & data tooling
- [x] Agent execution
- [x] **Public SDK docs + local demo runner (`xia-serve`)** — available now
- [ ] Drop-in 1.0 SDK package (engine binary)
- [ ] Hosted quickstart / playground
- [ ] More languages & toolchains

*Detailed timelines land with launch.*

---

## 📬 Stay in the loop

- ⭐ **Star** this repo to follow along
- 🔔 Watch for the launch announcement
- 🌐 Website: *coming soon*
- ✉️ Contact / waitlist: *coming soon*

---

## License & commercial use

- **Free for personal & non-commercial use.** Build, learn, prototype, research — on us.
- **Commercial use needs a license.** Using it in or for a business? [Get in touch](#-stay-in-the-loop) for a commercial license.
- The **engine** is distributed as a compiled binary under a proprietary license (see [`EULA`](./EULA.md)). It's a general-purpose execution environment.
- The **guest programs** it can run (shells, language runtimes, utilities) ship under **their own open-source licenses** (GPL / LGPL / MPL / PSF / public-domain) with corresponding source — see [`THIRD-PARTY-NOTICES`](./THIRD-PARTY-NOTICES.md).

> Note: this is *source-available / commercial*, **not** an OSI "open source" project — and we don't call it that. You get a generous free tier for personal use; businesses fund the work.

## FAQ

**Is anything sent to a server?**
No. Programs run on the user's device in WebAssembly. There's no backend in the loop.

**Are these real programs or reimplementations?**
Real. The actual binaries are translated and executed — you get genuine behavior, not an approximation.

**Does it need installation or a plugin?**
No. It runs in a standard browser tab.

**When can I use it?**
Now, in public preview — the local demo runner and the full docs are available (see [Quick start](#quick-start)). The drop-in 1.0 SDK package is on the way; ⭐ star/watch to follow it.

---

<div align="center">
<sub>© XIA Sandbox — all rights reserved. Engine: proprietary (free for personal use, commercial license available). Guests: their own licenses. · Public preview; details may change before 1.0.</sub>
</div>
