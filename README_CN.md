<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="NeedyClash" width="128" />
  <br>
  NeedyClash
  <br>
</h1>

<h3 align="center">
基于 <a href="https://github.com/clash-verge-rev/clash-verge-rev">Clash Verge Rev</a> 的规则代理客户端
</h3>

<p align="center">
  <a href="./README.md">English</a> •
  <a href="https://github.com/clash-verge-rev/clash-verge-rev">Clash Verge Rev</a> •
  <a href="#特性">特性</a> •
  <a href="#安装">安装</a> •
  <a href="#开发">开发</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/Lythrilla/needyclash?style=flat-square" alt="Release" />
  <img src="https://img.shields.io/github/license/Lythrilla/needyclash?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Tauri-2.x-blue?style=flat-square" alt="Tauri" />
</p>

---

## 📸 预览

<table>
  <tr>
    <td><b>深色主题</b></td>
    <td><b>浅色主题</b></td>
  </tr>
  <tr>
    <td><img src="./docs/preview_dark.png" alt="深色模式预览" /></td>
    <td><img src="./docs/preview_light.png" alt="浅色模式预览" /></td>
  </tr>
</table>

---

## 🎯 关于

**NeedyClash** 是基于 [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev) 的个性化二次开发版本。本项目在 Clash Verge Rev 优秀工作的基础上，添加了个性化的功能和优化。

### 为什么选择 NeedyClash？

- **🎨 个性化定制**：基于个人偏好定制的功能和 UI 增强
- **⚡ 性能优化**：基于高性能的 Rust 和 Tauri 2 框架构建
- **🔧 增强配置**：更灵活的配置管理和自定义选项
- **🌐 多语言支持**：内置支持多种语言，包括中文、英文等

---

## ✨ 特性

### 核心功能

- **🚀 高性能**
  - 使用 Rust 和 Tauri 2 框架构建，拥有原生级别的性能
  - 轻量级资源占用，启动速度快
  - 高效的内存管理和低 CPU 使用率

- **⚙️ Clash Meta 内核**
  - 内置 [Clash Meta (mihomo)](https://github.com/MetaCubeX/mihomo) 内核
  - 支持切换稳定版和 Alpha 版本内核
  - 完整支持 Clash Meta 高级特性

- **🎨 现代化界面**
  - 简洁美观的 Material Design 界面
  - 深色/浅色主题切换
  - 自定义主题颜色和托盘图标
  - 支持 CSS 注入进行深度定制

### 高级功能

- **📝 配置管理**
  - 可视化配置文件管理
  - Merge 和 Script 模式的配置增强
  - YAML 语法高亮和自动补全
  - 配置文件导入/导出

- **🌐 代理功能**
  - 可视化代理组和节点管理
  - 实时延迟测试
  - 基于规则的流量路由
  - 系统代理和守卫模式
  - TUN (虚拟网卡) 模式支持

- **🔍 监控与调试**
  - 实时连接监控
  - 流量统计和分析
  - 详细的日志记录
  - 网络接口选择

- **☁️ 备份与同步**
  - WebDAV 配置备份
  - 跨设备配置同步
  - 自动备份和恢复

- **🌍 国际化**
  - 支持 10+ 种语言
  - 便捷的语言切换
  - 社区驱动的翻译

---

## 📦 安装

### 系统要求

- **Windows**: Windows 10 (1809+) / Windows 11
  - x64 / x86 架构
  - WebView2 Runtime (自动安装)

- **macOS**: macOS 10.15 (Catalina) 或更高版本
  - Intel / Apple Silicon (M1/M2/M3)

- **Linux**: 大多数现代发行版
  - x64 / ARM64 架构
  - 需要 WebKit2GTK / GTK3

### 下载

**方式 1：下载预编译版本**（推荐）

- 访问 [Releases](https://github.com/clash-verge-rev/clash-verge-rev/releases) 页面
- 下载适合您平台的安装包：
  - **Windows**: `.exe` (安装版) 或 `.zip` (便携版)
  - **macOS**: `.dmg` (安装版)
  - **Linux**: `.AppImage` / `.deb` / `.rpm`

**方式 2：从源码构建**
参见下方[开发](#开发)部分的构建说明。

### 安装指南

#### Windows

1. 下载 `.exe` 安装程序
2. 运行安装程序并按照设置向导操作
3. 从开始菜单或桌面快捷方式启动 NeedyClash

便携版本：

1. 下载 `.zip` 文件
2. 解压到您想要的位置
3. 运行 `NeedyClash.exe`

#### macOS

1. 下载 `.dmg` 文件
2. 打开 DMG 并将 NeedyClash 拖到应用程序文件夹
3. 从应用程序启动（首次可能需要右键 > 打开）

#### Linux

**AppImage** (通用):

```bash
chmod +x NeedyClash_*.AppImage
./NeedyClash_*.AppImage
```

**Debian/Ubuntu** (.deb):

```bash
sudo dpkg -i needyclash_*.deb
sudo apt-get install -f  # 如需要，安装依赖
```

**Fedora/RHEL** (.rpm):

```bash
sudo rpm -i needyclash_*.rpm
```

---

## 🛠️ 开发

### 前置要求

在开始之前，请确保已安装以下工具：

1. **Node.js** (v18 或更高版本)
   - 从 [nodejs.org](https://nodejs.org/) 下载

2. **pnpm** (v8 或更高版本)

   ```bash
   npm install -g pnpm
   ```

3. **Rust** (最新稳定版)

   ```bash
   # 通过 rustup 安装
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

4. **系统依赖**

   **Windows**:
   - Visual Studio 2022 含 C++ 桌面开发工具
   - WebView2 Runtime (自动安装)

   **macOS**:
   - Xcode 命令行工具：
     ```bash
     xcode-select --install
     ```

   **Linux** (Debian/Ubuntu):

   ```bash
   sudo apt update
   sudo apt install -y libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libxdo-dev \
     libssl-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

### 构建说明

1. **克隆仓库**

   ```bash
   git clone https://github.com/Lythrilla/needyclash.git
   cd needyclash
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **准备构建**

   ```bash
   pnpm run prebuild
   ```

4. **开发模式**

   ```bash
   pnpm dev
   ```

   这将启动开发服务器并启用热重载。

5. **生产构建**

   ```bash
   # 标准构建
   pnpm build

   # 快速构建（用于测试）
   pnpm run build:fast
   ```

   构建产物将在 `src-tauri/target/release/bundle/` 目录中

### 开发脚本

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm dev:trace        # 启动并开启 tokio 追踪

# 构建
pnpm build            # 生产构建
pnpm build:fast       # 快速构建（较少优化）

# 代码质量
pnpm lint             # 运行 ESLint
pnpm lint:fix         # 修复 ESLint 问题
pnpm format           # 使用 Prettier 格式化
pnpm typecheck        # TypeScript 类型检查
pnpm fmt              # 格式化 Rust 代码
pnpm clippy           # 运行 Rust linter

# 工具
pnpm updater          # 创建更新器产物
pnpm portable         # 创建便携版本
```

### 项目结构

```
needyclash/
├── src/                    # React 前端源码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义 React hooks
│   ├── services/          # API 服务
│   ├── utils/             # 工具函数
│   └── locales/           # 国际化翻译
├── src-tauri/             # Tauri/Rust 后端
│   ├── src/
│   │   ├── cmd/           # Tauri 命令
│   │   ├── config/        # 配置处理
│   │   ├── core/          # 核心功能
│   │   ├── enhance/       # 配置增强
│   │   └── utils/         # 工具函数
│   └── sidecar/           # Clash Meta 二进制文件
├── scripts/               # 构建和工具脚本
└── docs/                  # 文档和资源
```

---

## 🤝 贡献

欢迎贡献！您可以通过以下方式帮助：

1. **报告 Bug**：提交包含详细信息的 issue
2. **建议功能**：通过 GitHub Issues 分享您的想法
3. **提交 PR**：Fork、创建分支并提交 Pull Request
4. **改进文档**：帮助改进文档和翻译

详情请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## ❓ 常见问题

### 常见问题

**问：Windows 上应用无法启动**

- 确保已安装 WebView2 Runtime
- 尝试以管理员身份运行
- 检查杀毒软件/防火墙设置

**问：TUN 模式无法工作**

- TUN 模式需要管理员/root 权限
- 在提示时安装服务助手
- 检查系统权限

**问：配置文件未更新**

- 尝试重启应用程序
- 检查文件权限
- 验证配置 URL 是否可访问

更多故障排除，请访问 [Clash Verge Rev 常见问题](https://clash-verge-rev.github.io/faq/windows.html)。

---

## 🙏 致谢

本项目的实现离不开这些优秀的项目：

- **[Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)** - 本项目的基础，Clash Verge 的延续
- **[Clash Verge](https://github.com/zzzgydi/clash-verge)** - zzzgydi 开发的原始 Clash Verge 项目
- **[Clash Meta (mihomo)](https://github.com/MetaCubeX/mihomo)** - 强大的基于规则的 Go 隧道
- **[Tauri](https://github.com/tauri-apps/tauri)** - 构建更小、更快、更安全的桌面应用
- **[React](https://reactjs.org/)** - 用于构建用户界面的 JavaScript 库
- **[Material-UI](https://mui.com/)** - React 组件，让 Web 开发更快更简单
- **[Vite](https://vitejs.dev/)** - 下一代前端工具链

特别感谢：

- Clash Verge Rev 项目的所有贡献者
- Clash Meta 开发团队
- Tauri 社区
- 所有支持本项目的人

---

## 📄 许可证

NeedyClash 使用 **GPL-3.0** 许可证。

```
Copyright (C) 2024 Lythrilla
基于 Clash Verge Rev (GPL-3.0)

本程序是自由软件：您可以根据自由软件基金会发布的
GNU 通用公共许可证的条款重新分发和/或修改它，
许可证的第 3 版或（根据您的选择）任何更高版本。

本程序的分发是希望它有用，但不提供任何保证；
甚至不提供适销性或特定用途适用性的暗示保证。
```

完整许可证文本请参见 [LICENSE](./LICENSE)。

---

## 📮 联系与支持

- **原始项目**: [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)
- **文档**: [clash-verge-rev.github.io](https://clash-verge-rev.github.io/)
- **Telegram**: [@clash_verge_rev](https://t.me/clash_verge_rev)

---

<p align="center">
  <sub>使用 Rust 和 Tauri 用❤️构建</sub>
</p>
