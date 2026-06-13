# Changelog

All notable changes to the **XIA Sandbox** public SDK are documented here.
Versioning follows [Semantic Versioning](https://semver.org/). Pre-launch builds
carry a `-preview` suffix and may change without notice.

中文摘要见每个版本末尾。

## [0.1.0-preview] — 2026-06-13

Pre-launch / Coming Soon. Public landing + licensing + SDK surface preview.

### Added
- Public landing page, bilingual (English + 中文).
- Draft **EULA** — the engine is proprietary, binary-only; **free for personal/non-commercial use, commercial license required**.
- Draft **THIRD-PARTY-NOTICES** — the guest programs (shells, language runtimes, utilities) ship under **their own** licenses (GPL / LGPL / MPL / PSF / public-domain) with corresponding source.
- **SDK integration surface overview** (`docs/SDK-OVERVIEW.md`) — a preview of the public API shape (Worker protocol, `run` contract, runtimes, result fields, privacy/egress, delivery & hosting).
- **Full SDK integration guide** (`docs/SDK-INTEGRATION-GUIDE.md`) — the complete Worker protocol, `run` contract, init options, netProxy wire format, and hosting requirements.
- **Local demo runner** (`xia-serve/`) — serve the sandbox over your LAN from one machine: any device opens a URL and gets the sandbox + an interactive **Ubuntu console**. Includes a host-side network egress proxy (off by default, SSRF-guarded), a control panel, and operator-side `.env` config (no secrets baked in; bring your own TLS CA).

### Not yet here
- The compiled engine SDK package (the runtime binary + workers) is **not** published in this repo yet. It ships once the launch-readiness checklist (notices/corresponding-source bundling, symbol/string hardening, SBOM, legal review) is complete.

> 中文：上线前预览版。包含双语落地页、引擎专有 EULA 草稿、第三方组件许可证清单草稿、SDK 集成面概览，新增**完整集成指南**与**本地 demo 运行器**（`xia-serve`：一台机器把沙箱发到局域网，任意设备打开即得沙箱 + 交互式 **Ubuntu 控制台**；自带出网代理、控制面板、`.env` 配置，密钥不内置、TLS CA 自备）。**编译后的引擎二进制尚未在本仓发布**，待合规清单完成后再发。
