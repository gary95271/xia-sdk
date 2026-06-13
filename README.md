<div align="center">

**English** · [中文](./README.zh-CN.md)

# XIA Sandbox

### Run real Linux programs in the browser. No server. No install. Just a tab.

**Status: 🚧 Coming Soon** · **Free for personal use · Commercial license available** · **Built on WebAssembly**

<sub>Real CPython · Real shells · Real SQLite · 100% client-side · Native AOT x86 → WebAssembly</sub>

</div>

---

## 🚧 Coming Soon

We're putting the finishing touches on a public, drop-in SDK. **Launch date: coming soon.**
Watch / star this repo to be the first to know — and see [**Stay in the loop**](#-stay-in-the-loop) below.

> 👀 **Preview:** [SDK overview](./docs/SDK-OVERVIEW.md) · [full integration guide](./docs/SDK-INTEGRATION-GUIDE.md) · [local demo runner (`xia-serve`)](./xia-serve/README.md) · [CHANGELOG](./CHANGELOG.md) (`0.1.0-preview`)

---

## What is this?

**XIA Sandbox runs *actual* Linux programs — real Python, real shells, real SQLite — entirely inside a browser tab.**

Not a reimplementation. Not a cloud VM you rent. The real binaries execute on the user's own device, in pure WebAssembly, with **nothing sent to a server**. Drop the SDK into any web app and give your users a full compute environment that boots in seconds.

It works by **ahead-of-time translating x86 machine code to WebAssembly** — so you get the fidelity of the real toolchain with the safety and reach of the web platform.

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

## Roadmap

- [x] Core engine: real binaries running in the browser
- [x] Python + scientific stack
- [x] Document & data tooling
- [x] Agent execution
- [ ] **Public SDK & docs — 🚧 coming soon**
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
Soon — this is the pre-launch page. Star/watch to get notified.

---

<div align="center">
<sub>© XIA Sandbox — all rights reserved. Engine: proprietary (free for personal use, commercial license available). Guests: their own licenses. · This page is a pre-launch placeholder; details may change before launch.</sub>
</div>
