# Third-Party Notices — XIA Sandbox

> ⚠️ **DRAFT / pre-launch.** This inventory will be auto-generated from, and verified against, the actual shipped build before release; versions may drift until then.

The XIA Sandbox engine is a general-purpose execution environment. The programs and
libraries below are **third-party works under their own licenses**; your rights to them
come from those licenses, not from the engine's EULA. The XIA Sandbox **engine** itself is
proprietary (see [`EULA`](./EULA.md)) and is **not** listed here. Full license texts ship in
`licenses/` and inside each component's upstream distribution.

## Guest programs (system images)

| Component | Version | License | Source |
|---|---|---|---|
| **CPython** (`python3`, native + x86) | 3.12.0 | **PSF License** (permissive) | python.org / corresponding source archived |
| **SQLite** (`sqlite3`) | 3.45.x | **Public Domain** | sqlite.org *(Debian packaging bits GPL-2.0+)* |
| **BusyBox** (`busybox`) | 1.36.1 | **GPL-2.0-only** ⚠ | see **Corresponding Source** below |
| **GNU Bash** (`bash`) | 5.2.21 | **GPL-3.0-or-later** ⚠ | see **Corresponding Source** below |

> ⚠ **GPL components ship separately** from the proprietary engine, with their license
> text and corresponding source. The engine does not link them — it executes them as a
> CPU/OS would; running a GPL program does not relicense the runner.

## Scientific stack (optional — Pyodide)

- **Pyodide** runtime — **MPL-2.0** (file-level copyleft; shipped unmodified → notice + upstream source pointer). Bundled Python standard library — **PSF**.
- **NumPy** (BSD-3-Clause), **pandas** (BSD-3-Clause), **Matplotlib** (Matplotlib/PSF-style license), **Pillow** (HPND / MIT-CMU).
- Support libs: contourpy, kiwisolver, fonttools, cycler, pyparsing, python-dateutil, pytz, six, packaging, micropip.
- TLS: OpenSSL (Apache-2.0 / OpenSSL license).
- Optional agent HTTP stack: httpx, httpcore, h11, anyio, sniffio, **certifi (MPL-2.0)**, idna, distro, **pydantic / pydantic_core / jiter (MIT)**, annotated_types, typing_extensions.

These wheels are upstream Pyodide-distribution builds; each appears in `licenses/` with its notice.

## Video (optional — FFmpeg, self-hosted by the integrator)

- **FFmpeg core** (`@ffmpeg/core`) — **LGPL-2.1+ / GPL** depending on the build. Shipped as a separate, integrator-self-hosted upstream artifact (LGPL relinking obligation met by hosting the unmodified upstream build).
- `@ffmpeg/ffmpeg`, `@ffmpeg/util` (MIT); optional mp4box, mp4-muxer.

## Corresponding Source (GPL)

For the GPL-licensed components (**BusyBox** GPL-2.0, **GNU Bash** GPL-3.0+), the complete
corresponding source — the upstream source packages plus the scripts used to build/translate
them into the shipped form — will be made available at launch (download location and written
offer to be published before any binary distribution).

You may obtain, modify, and redistribute these components under their own GPL terms,
independently of the XIA Sandbox engine.

---
<sub>DRAFT — to be auto-generated from the build and confirmed by counsel before release. © respective owners.</sub>
