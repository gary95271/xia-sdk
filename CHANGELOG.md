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

### Not yet here
- The compiled engine SDK package (the runtime binary + workers) is **not** published in this repo yet. It ships once the launch-readiness checklist (notices/corresponding-source bundling, internal-string strip, SBOM, legal review) is complete.

> 中文：上线前预览版。包含双语落地页、引擎专有 EULA 草稿、第三方组件许可证清单草稿，以及 SDK 集成面概览（API 形态预览）。**编译后的引擎二进制尚未在本仓发布**，待合规清单完成后再发。
