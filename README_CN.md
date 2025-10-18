<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="NeedyClash" width="128" />
  <br>
  NeedyClash
  <br>
</h1>

<h3 align="center">
基于 Clash Meta 的规则代理客户端
</h3>

<p align="center">
  <a href="./README.md">English</a> •
  <a href="https://github.com/clash-verge-rev/clash-verge-rev">Clash Verge Rev</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/Lythrilla/needyclash?style=flat-square" alt="Release" />
  <img src="https://img.shields.io/github/license/Lythrilla/needyclash?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8D8?style=flat-square&logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
</p>

---

## 📸 预览

<table>
  <tr>
    <td><img src="./docs/preview_dark.png" alt="深色主题" /></td>
    <td><img src="./docs/preview_light.png" alt="浅色主题" /></td>
  </tr>
</table>

---

## 🎯 项目简介

**NeedyClash** 是基于 [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev) 的个人定制版本，使用 **Tauri 2.x + Rust + React 19** 技术栈，集成 **Clash Meta (mihomo)** 内核。

### 核心特点

- 🚀 **高性能**：Rust 后端，原生性能，低资源占用
- ⚡ **双模式**：支持 Service 和 Sidecar 运行模式
- 🛡️ **TUN 模式**：虚拟网卡透明代理，全局流量接管
- 🎨 **现代界面**：Material Design，深色/浅色主题
- 📊 **实时监控**：连接追踪、流量统计、日志分析
- 🔧 **配置增强**：Merge/Script 模式，YAML 编辑器
- ☁️ **WebDAV 同步**：配置跨设备同步
- 🌍 **多语言**：支持 13 种语言

---

## ✨ 功能特性

### 代理管理
- 多内核支持（稳定版/Alpha 版）
- 系统代理守卫，防止被篡改
- 代理链可视化配置
- 节点延迟测试和自动选择

### 配置系统
- 多配置文件管理
- 订阅自动更新
- Monaco 编辑器（VSCode 同款）
- 配置验证和语法高亮
- Merge/Script 增强模式

### 监控调试
- 实时连接监控
- 流量统计分析
- 分级日志系统
- 规则匹配追踪

### 系统集成
- TUN 模式透明代理
- 系统代理自动配置
- 进程守护和自动恢复
- 托盘图标快捷操作

---

## 🏗️ 技术架构

### 技术栈

**前端**
- React 19 + TypeScript 5.x
- Material-UI (MUI) 7.x
- React Router 7.x + SWR
- Monaco Editor + Recharts
- Vite 7.x

**后端**
- Rust 2024 Edition
- Tauri 2.x
- Tokio 异步运行时
- Clash Meta (mihomo) 内核

### 核心模块

```
src-tauri/src/
├── core/              # 核心功能
│   ├── core.rs        # 内核管理
│   ├── tun_manager.rs # TUN 模式
│   ├── proxy_guard.rs # 系统代理守卫
│   └── service.rs     # 服务模式
├── config/            # 配置管理
├── enhance/           # 配置增强引擎
└── cmd/               # Tauri 命令

src/
├── components/        # React 组件
├── pages/            # 页面路由
├── hooks/            # 自定义 Hooks
└── services/         # API 服务
```

---

## 📦 安装使用

### 系统要求

- **Windows**：10 (1809+) / 11，需要 WebView2
- **macOS**：10.15+ (Intel / Apple Silicon)
- **Linux**：需要 webkit2gtk 和 libappindicator

### 快速安装

访问 [Releases](https://github.com/Lythrilla/NeedyClash/releases) 下载对应平台的安装包：

```
Windows:  .msi / .exe / .zip (便携版)
macOS:    .dmg
Linux:    .deb / .AppImage / .rpm
```

### 首次配置

1. 导入配置：配置页面 → 新建 → 导入订阅链接
2. 选择节点：代理页面 → 选择策略组和节点
3. 启用代理：首页开启"系统代理"开关
4. （可选）启用 TUN 模式：需要管理员权限

---

## 🛠️ 开发指南

### 环境准备

```bash
# 1. 安装 Rust (https://rustup.rs/)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. 安装 Node.js (v18+) 和 pnpm
npm install -g pnpm

# 3. Linux 需要安装依赖
sudo apt install libwebkit2gtk-4.1-dev build-essential
```

### 构建运行

```bash
# 克隆项目
git clone https://github.com/Lythrilla/needyclash.git
cd needyclash

# 安装依赖
pnpm install

# 下载内核
pnpm run prebuild

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 便携版 (Windows)
pnpm portable
```

### 代码检查

```bash
pnpm lint          # ESLint 检查
pnpm typecheck     # TypeScript 检查
pnpm clippy        # Rust Clippy
pnpm fmt           # Rust 格式化
pnpm format        # Prettier 格式化
```

---

## ❓ 常见问题

**Q: TUN 模式无法启动？**
- Windows/Linux: 需要管理员权限
- macOS: 需要在系统设置中授权

**Q: 系统代理不生效？**
- 检查是否开启"系统代理守卫"
- 部分应用不走系统代理，需使用 TUN 模式

**Q: 配置更新失败？**
- 检查订阅链接有效性
- 查看日志详细错误
- 尝试手动导入配置

**Q: 日志在哪里？**
```
Windows: %APPDATA%\com.lythrilla.needyclash\logs\
macOS:   ~/Library/Application Support/com.lythrilla.needyclash/logs/
Linux:   ~/.config/com.lythrilla.needyclash/logs/
```

更多问题访问 [Clash Verge Rev 文档](https://clash-verge-rev.github.io/)

---

## 🤝 贡献

欢迎贡献代码！提交 PR 前请：

1. Fork 仓库并创建分支
2. 运行 `pnpm lint` 和 `pnpm clippy` 检查
3. 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
4. 提交清晰的 commit 信息

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 开源协议

本项目采用 **GPL-3.0** 许可证。

```
Copyright (C) 2024-2025 Lythrilla
基于 Clash Verge Rev (GPL-3.0)
```

详见 [LICENSE](./LICENSE)

---

## 🙏 致谢

- **[Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)** - 项目基础
- **[Clash Verge](https://github.com/zzzgydi/clash-verge)** - 原始项目
- **[Clash Meta (mihomo)](https://github.com/MetaCubeX/mihomo)** - 代理内核
- **[Tauri](https://tauri.app/)** - 桌面框架
- **[React](https://reactjs.org/)** + **[MUI](https://mui.com/)** - UI 框架

感谢所有贡献者和支持者！

---

## 📮 联系方式

- **仓库**: [github.com/Lythrilla/NeedyClash](https://github.com/Lythrilla/NeedyClash)
- **Issues**: [GitHub Issues](https://github.com/Lythrilla/NeedyClash/issues)
- **上游项目**: [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)
- **文档**: [clash-verge-rev.github.io](https://clash-verge-rev.github.io/)
- **Telegram**: [@clash_verge_rev](https://t.me/clash_verge_rev)

---

<p align="center">
  <sub>使用 Rust 和 Tauri 用 ❤️ 构建</sub>
</p>
