<div align="center">

[English](./README.md) · **中文**

# XIA Sandbox

### 在浏览器里运行真正的 Linux 程序。无服务器。免安装。一个标签页搞定。

**状态：🟢 公开预览** · **个人使用免费 · 提供商业授权** · **基于 WebAssembly**

<sub>真 CPython · 真 Shell · 真 SQLite · 100% 客户端运行 · 原生 AOT x86 → WebAssembly</sub>

</div>

---

## 🟢 公开预览 —— 现在就能试

XIA Sandbox 已进入**公开预览**。本地 demo 运行器、完整集成文档、SDK 接口**现已可用** ——
几分钟就能在局域网起一个交互式 Ubuntu 控制台（见 [**快速上手**](#快速上手)）。即插即用的
1.0 SDK 包正在路上；⭐ Star / Watch 跟进发布。

> 👀 **从这开始：** [快速上手](#快速上手) · [SDK 概览](./docs/SDK-OVERVIEW.md) · [完整集成指南](./docs/SDK-INTEGRATION-GUIDE.md) · [本地 demo 运行器（`xia-serve`）](./xia-serve/README.md) · [CHANGELOG](./CHANGELOG.md)（`0.1.0-preview`）

---

## 这是什么？

**XIA Sandbox 让*真正的* Linux 程序 —— 真 CPython、bash、busybox、SQLite —— 完全运行在浏览器标签页里、跑在用户自己的设备上。**

打开网页就有一个真实的 **Ubuntu 控制台**：直接敲 `python3`、跑 `bash` 脚本、查 SQLite —— 全在本地以纯 WebAssembly 执行，**任何数据都不上传服务器**，因为根本没有后端可发。

不是重新实现，也不是租来的云虚拟机。真正的 x86 二进制被**提前（AOT）翻译成 WebAssembly**，既有真实工具链的保真度，又有 Web 平台的可达性与安全性 —— 而且**结果与真实 x86 逐字节一致**。

把 SDK 放进任意 Web 应用，或者把 demo 发到局域网、用手机或笔记本打开：一个秒级启动的完整计算环境，缓存后可离线运行，每一个字节都留在设备上。

---

## 凭什么不一样

| | |
|---|---|
| 🔒 **架构级隐私** | 代码和数据永不离开设备，因为根本没有后端可发。对"绝不能上传"的敏感场景是硬保障。 |
| ⚡ **原生 AOT，不是解释器** | x86 被提前翻译成 WebAssembly —— 不是逐条指令模拟。真实性能，真实二进制。 |
| 🐍 **你熟悉的那个 Python** | 真 CPython + 标准库 —— 外加可选的科学计算栈（NumPy、pandas、Matplotlib、Pillow）。 |
| 🧰 **真实的 Linux 工具链** | Shell 与核心工具、SQLite，以及真实、可持久化的文件系统。 |
| 🤖 **为 Agent 而生** | 给 AI Agent 一个安全、真实的代码执行环境 —— 沙箱在用户机器上，而不是你的服务器上。 |
| 🌐 **Web 原生分发** | 内容寻址、可缓存、带版本的资源；按需懒加载；缓存后可离线运行。 |
| 📱 **桌面 & 移动** | 面向从笔记本到手机的各种设备优雅降级。 |

---

## 你能用它构建什么

- **隐私优先 / 本地优先的应用** —— 处理绝不能上服务器的文档、数据或密钥。
- **浏览器内数据科学** —— 用 NumPy / pandas / Matplotlib 做笔记本与分析，无需托管内核。
- **文档自动化** —— 客户端读写 Word、Excel、PowerPoint、PDF。
- **安全的 AI Agent 执行** —— 让 Agent 在用户自己掌控的沙箱里跑真实代码。
- **交互式教学与文档** —— 用真解释器跑可运行示例，零安装。
- **边缘 & 离线工具** —— 断网也能继续计算。

---

## 工作原理

*（高层视角 —— 不含代码，只讲思路。）*

```
   你的 Web 应用
        │  即插即用 SDK
        ▼
  ┌──────────────────────────────────────────────┐
  │  XIA Sandbox  （运行在 Web Worker 中）          │
  │                                                │
  │   真实 Linux 程序 (ELF)                         │
  │        │  提前 (AOT) 翻译                       │
  │        ▼                                        │
  │   WebAssembly  ──►  在设备上执行                 │
  │                                                │
  │   • 多运行时，自动路由                           │
  │   • 持久化文件系统                              │
  │   • 内容寻址、缓存、带版本的资源                  │
  └──────────────────────────────────────────────┘
        │
        ▼
   结果留在设备上
```

这张图里没有服务器 —— 而这正是重点。

---

## 快速上手

### 在局域网里跑 demo

用**一台**机器把沙箱发到局域网，**任意**设备（手机 / 平板 / 笔记本）打开即用——每台设备都在自己浏览器里完整运行沙箱。

```sh
# 1. 拿到引擎构建（dist/）—— 见 Releases（即将提供）
# 2. 在局域网上起服务：
node xia-serve/xia-serve.mjs --dist ./dist --port 8088
# 3. 在任意设备打开打印出来的 network 网址 —— Ubuntu 控制台直接就在那
```

打开的页面就是**交互式 Ubuntu 终端**——直接敲 `uname -a`、`ls /`、`python3 --version`、`python3 -c 'print(2**100)'`、真 `bash`。宿主控制面板在 `/__control`（开沙箱出网、停服务）。完整选项、`.env` 配置、自备 TLS CA 见 [`xia-serve/README.md`](./xia-serve/README.md)。

> 没装 Node？打包流程会出一个双击即用的 `xia-serve.exe`（免安装）。引擎构建单独提供，目前为上线前阶段。

### 集成进你的 Web 应用

一个 Web Worker + 极简消息协议：**`init` → `run` → `result`**。

```js
const worker = new Worker(new URL('./fullruntime-worker.mjs', import.meta.url), { type: 'module' });
worker.onmessage = (e) => {
  if (e.data.type === 'boot')
    fetch('./manifest.json').then(r => r.json())
      .then(manifest => worker.postMessage({ type: 'init', assetBase: './', manifest }));
};
// 在用户设备上跑真实程序：
worker.postMessage({ type: 'run', id: 1, core: 'python3', argv: ['python3', '-c', 'print(2**100)'] });
// <- { type:'result', id:1, exit:0, stdout:'1267650600228229401496703205376\n', ... }
```

完整接口（Worker 协议、`run` 契约、init 选项、网络出口、托管要求）见 [`docs/SDK-INTEGRATION-GUIDE.md`](./docs/SDK-INTEGRATION-GUIDE.md)。

---

## 路线图

- [x] 核心引擎：真实二进制在浏览器里运行
- [x] Python + 科学计算栈
- [x] 文档与数据工具
- [x] Agent 执行
- [x] **公开 SDK 文档 + 本地 demo 运行器（`xia-serve`）** —— 现已可用
- [ ] 即插即用 1.0 SDK 包（引擎二进制）
- [ ] 托管版 quickstart / playground
- [ ] 更多语言与工具链

*详细时间线随上线公布。*

---

## 📬 保持关注

- ⭐ **Star** 本仓库持续跟进
- 🔔 Watch 获取上线通知
- 🌐 官网：*即将公布*
- ✉️ 联系 / 等候名单：*即将公布*

---

## 许可与商用

- **个人与非商业用途免费。** 构建、学习、原型、研究 —— 我们请客。
- **商用需授权。** 在企业中或为企业使用？[联系我们](#-保持关注)获取商业授权。
- **引擎**以编译后的二进制形式、按专有许可分发（见 [`EULA`](./EULA.md)）。它是一个通用执行环境。
- 它所能运行的**客体程序**（Shell、语言运行时、工具）按**各自的开源许可**分发（GPL / LGPL / MPL / PSF / 公有领域），并附带对应源码 —— 见 [`THIRD-PARTY-NOTICES`](./THIRD-PARTY-NOTICES.md)。

> 说明：这是*源码可得 / 商业*模式，**不是** OSI 定义的"开源"项目 —— 我们也不会这么称呼它。个人用途有充足的免费档；商用付费支持开发。

## 常见问题

**有任何东西上传服务器吗？**
没有。程序在用户设备上以 WebAssembly 运行，链路里没有后端。

**是真程序还是重新实现？**
真的。真实二进制被翻译并执行 —— 你得到的是真实行为，不是近似。

**需要安装或插件吗？**
不需要。在标准浏览器标签页里就能跑。

**什么时候能用？**
现在，公开预览中 —— 本地 demo 运行器和完整文档已可用（见[快速上手](#快速上手)）。即插即用的 1.0 SDK 包正在路上；⭐ Star / Watch 跟进。

---

<div align="center">
<sub>© XIA Sandbox —— 保留所有权利。引擎：专有（个人免费，商用授权）。客体：各自的许可。· 公开预览，细节可能在 1.0 前调整。</sub>
</div>
