# XIA Sandbox SDK — integration surface (preview)

**English** · [中文](#中文)

> 🚧 **Pre-launch preview.** This describes the *shape* of the public SDK so you can
> evaluate the integration. The compiled engine package is not published yet — see the
> [CHANGELOG](../CHANGELOG.md). Names and exact fields are frozen at launch; nothing here
> is code you can run today.

## How you integrate

XIA Sandbox runs inside a **Web Worker** in your page. You talk to it over a small
`postMessage` protocol — no framework required:

```
  init   →   (load runtime + assets)        →   ready
  run    →   (execute a program on-device)   →   result
  fs / upload / provision   →   (manage the in-sandbox filesystem)
```

That's the whole contract: **init → run → result**, plus a filesystem surface.

## The `run` contract

You ask the sandbox to run a real program:

| field | meaning |
|---|---|
| `core` | which program to run — e.g. `python3`, `bash`, `busybox`, `sqlite3` |
| `argv` | the full argument vector, exactly as a shell would pass it |
| `stdin` | optional standard input |
| `timeout` | optional wall-clock cap |

…and you get back a `result`:

| field | meaning |
|---|---|
| `exit` | process exit code |
| `stdout` / `stderr` | captured output |
| `wall` | wall-clock time |
| `warm` | whether a warm runtime was reused |
| `path` | **observational only** — which runtime served the call |
| `reason` | **machine-readable** status enum — branch on this, never parse `stderr` |

## Runtimes (chosen automatically)

The engine routes each call to the best-fit runtime and **falls back transparently** —
you don't pick:

- **Native CPython** — fastest for pure compute / document work.
- **x86 canonical** — the authoritative, fully-compatible path (shells, SQLite, identity-sensitive work).
- **Scientific (Pyodide)** — NumPy / pandas / Matplotlib / Pillow / scikit-learn.
- **Video** — media processing.

Each heavy runtime lives in its own isolated sub-worker, so an out-of-memory in one
can't take down the others.

## The consistency guarantee

The fast paths only ever **accelerate a clean success**. Anything non-trivial — a non-zero
exit, a trap, an edge case — transparently falls back to the authoritative x86 path that
**produces byte-for-byte the same result as real x86**. Speed never changes the answer.

## Filesystem & uploads

A real, **persistent** filesystem lives in the sandbox. You can seed files, upload user
data, and read results back — all client-side, nothing leaves the device.

## Optional: agent loop

There's an optional agent loop for "let an AI run code in a sandbox the user owns." It
talks to a **configurable**, Anthropic-compatible gateway endpoint of *your* choosing —
the SDK never hard-codes a provider.

## Privacy & egress

- Guest programs have **no host network** by default — the sandbox is sealed.
- The host app controls the **single egress chokepoint**. Don't wire it up → zero network. Wire it up → you decide exactly what's allowed, with size/time caps.
- Code and data stay on the device. There is no backend in the loop.

## Delivery & versioning

- Assets are **content-addressed**, cacheable, and versioned by a content fingerprint (not just a semver string).
- They load **lazily** and work **offline once cached**.
- Updates are atomic and roll back to any previously-cached version with zero re-download.

## Hosting requirements

- Static hosting; **no** COOP/COEP/SharedArrayBuffer required.
- Correct MIME (`.mjs` → `text/javascript`, `.wasm` → `application/wasm`).
- CSP `worker-src 'self'`.
- The worker module must be served **`no-store`**; content-hashed assets can be `immutable`.
- For restricted browsers / offline (in-app webviews, Electron): **self-host all assets**, no public CDNs. The engine exposes the knobs for this.

## Status

Pre-launch. Star/watch the repo for the launch announcement.

---

<a name="中文"></a>
# XIA Sandbox SDK —— 集成面（预览）

[English](#xia-sandbox-sdk--integration-surface-preview) · **中文**

> 🚧 **上线前预览。** 这里描述公开 SDK 的*形态*，方便你评估集成。编译后的引擎包尚未发布
> —— 见 [CHANGELOG](../CHANGELOG.md)。名称与确切字段在上线时冻结；本文不含今天可运行的代码。

## 如何集成

XIA Sandbox 跑在你页面里的一个 **Web Worker** 中。你通过一套很小的 `postMessage` 协议
与它通信，无需任何框架：

```
  init   →   （加载运行时 + 资源）          →   ready
  run    →   （在设备上执行一个程序）        →   result
  fs / upload / provision   →   （管理沙箱内文件系统）
```

整个契约就是：**init → run → result**，外加一个文件系统接口。

## `run` 契约

你让沙箱运行一个真实程序：

| 字段 | 含义 |
|---|---|
| `core` | 跑哪个程序 —— 如 `python3`、`bash`、`busybox`、`sqlite3` |
| `argv` | 完整参数向量，与 Shell 传参一致 |
| `stdin` | 可选标准输入 |
| `timeout` | 可选墙钟上限 |

返回一个 `result`：

| 字段 | 含义 |
|---|---|
| `exit` | 进程退出码 |
| `stdout` / `stderr` | 捕获的输出 |
| `wall` | 墙钟耗时 |
| `warm` | 是否复用了热运行时 |
| `path` | **仅供观测** —— 本次由哪个运行时服务 |
| `reason` | **机读**状态枚举 —— 用它分支，永远不要解析 `stderr` |

## 运行时（自动选择）

引擎把每次调用路由到最合适的运行时，并**透明回退** —— 你不用选：

- **原生 CPython** —— 纯计算 / 文档处理最快。
- **x86 canonical** —— 权威、全兼容路径（Shell、SQLite、对身份敏感的任务）。
- **科学计算（Pyodide）** —— NumPy / pandas / Matplotlib / Pillow / scikit-learn。
- **视频** —— 媒体处理。

每个重运行时都在独立的子 Worker 里，某一个 OOM 不会拖垮其它的。

## 一致性铁律

快路径只会**给一次干净的成功加速**。任何非平凡情况 —— 非零退出、trap、边界情形 ——
都会透明回退到权威的 x86 路径，**与真实 x86 逐字节一致**。加速永不改变结果。

## 文件系统与上传

沙箱内有真实、**可持久化**的文件系统。你可以预置文件、上传用户数据、读回结果 ——
全部客户端完成，任何数据都不离开设备。

## 可选：Agent 循环

提供可选的 Agent 循环，用于"让 AI 在用户自己掌控的沙箱里跑代码"。它对接一个**可配置的**、
Anthropic 兼容的网关端点（由*你*指定）—— SDK 不硬编码任何服务商。

## 隐私与出网

- 客体程序默认**无宿主网络** —— 沙箱是封闭的。
- 宿主应用掌控**唯一出网口**。不接 → 零出网；接上 → 你精确决定放行什么，带大小/时间上限。
- 代码与数据留在设备上，链路里没有后端。

## 分发与版本

- 资源**内容寻址**、可缓存，按内容指纹（而非仅 semver 串）定版本。
- **懒加载**，**缓存后可离线**。
- 更新原子切换，可零下载回滚到任意已缓存版本。

## 托管要求

- 静态托管；**不需要** COOP/COEP/SharedArrayBuffer。
- 正确 MIME（`.mjs` → `text/javascript`，`.wasm` → `application/wasm`）。
- CSP `worker-src 'self'`。
- Worker 模块必须 **`no-store`** 下发；内容哈希资产可 `immutable`。
- 受限浏览器 / 离线（应用内 webview、Electron）：**全部资源自托管**，不走公共 CDN。引擎提供相应开关。

## 状态

上线前。Star / Watch 本仓获取上线通知。
