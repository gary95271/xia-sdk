# Third-Party Notices — XIA Sandbox

The XIA Sandbox engine is a general-purpose execution environment. The programs and
libraries below are **third-party works under their own licenses**; your rights to them
come from those licenses, not from the engine's EULA. The XIA Sandbox **engine** itself is
proprietary (see [`EULA`](./EULA.md)) and is **not** listed here. Full license texts ship in
the engine package under `licenses/guests/` and inside each component's upstream distribution.

> Scope: this inventory matches the published engine preview (cores: **busybox**, **python3**).
> A build that adds cores regenerates this list from the shipped manifest.

## Guest programs

| Component | Version | License | Source |
|---|---|---|---|
| **CPython** (`python3`) | 3.12.0 | **PSF-2.0** (permissive) | https://www.python.org |
| **BusyBox** (`busybox`) | 1.36.1 | **GPL-2.0-only** ⚠ | https://busybox.net — see Corresponding Source |

## Shared libraries

| Component | Version | License | Source |
|---|---|---|---|
| **glibc** | 2.39 | **LGPL-2.1-or-later AND GPL-2.0-or-later** ⚠ | https://www.gnu.org/software/libc/ |
| **libxcrypt** | 4.4.36 | **LGPL-2.1-or-later** ⚠ | https://github.com/besser82/libxcrypt |

> ⚠ **GPL / LGPL components ship with their license text and corresponding source.** The
> engine does not link them — it executes them as a CPU/OS would; running a GPL program
> does not relicense the runner.

## Scientific stack (optional — Pyodide)

- **Pyodide** runtime — **MPL-2.0** (file-level copyleft; shipped unmodified → notice + upstream source pointer). Bundled Python standard library — **PSF**.
- **NumPy** (BSD-3-Clause), **pandas** (BSD-3-Clause), **Matplotlib** (Matplotlib/PSF-style license), **Pillow** (HPND / MIT-CMU).
- Support libs: contourpy, kiwisolver, fonttools, cycler, pyparsing, python-dateutil, pytz, six, packaging, micropip.
- TLS: OpenSSL (OpenSSL license).
- Optional agent HTTP stack: httpx, httpcore, h11, anyio, sniffio, **certifi (MPL-2.0)**, idna, distro, **pydantic / pydantic_core / jiter (MIT)**, annotated_types, typing_extensions.

These wheels are upstream Pyodide-distribution builds; the full machine-readable inventory is the CycloneDX SBOM (`sbom.cdx.json`) shipped with the engine release.

## Corresponding Source (GPL / LGPL)

The GPL/LGPL components are **unmodified upstream releases**. The complete corresponding source
for each is available directly from its official upstream site:

- **BusyBox** 1.36.1 — https://busybox.net/downloads/busybox-1.36.1.tar.bz2
- **glibc** 2.39 — https://ftp.gnu.org/gnu/glibc/glibc-2.39.tar.xz
- **libxcrypt** 4.4.36 — https://github.com/besser82/libxcrypt/releases/tag/v4.4.36

For the corresponding source of any shipped binary — including the build/translation scripts
used to produce its WebAssembly form — or by written offer valid 3 years from receipt,
contact: **BD@xuanji.dev**.

You may obtain, modify, and redistribute these components under their own GPL/LGPL terms,
independently of the XIA Sandbox engine.

---
<sub>© respective owners. The XIA Sandbox engine is proprietary — see [`EULA`](./EULA.md).</sub>
