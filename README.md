<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="NeedyClash" width="128" />
  <br>
  NeedyClash
  <br>
</h1>

<h3 align="center">
A Rule-Based Tunnel GUI Client Based on <a href="https://github.com/clash-verge-rev/clash-verge-rev">Clash Verge Rev</a>
</h3>

<p align="center">
  <a href="./README_CN.md">简体中文</a> •
  <a href="https://github.com/clash-verge-rev/clash-verge-rev">Clash Verge Rev</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/Lythrilla/needyclash?style=flat-square" alt="Release" />
  <img src="https://img.shields.io/github/license/Lythrilla/needyclash?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Tauri-2.x-blue?style=flat-square" alt="Tauri" />
</p>

---

## 📸 Preview

<table>
  <tr>
    <td><b>Dark Theme</b></td>
    <td><b>Light Theme</b></td>
  </tr>
  <tr>
    <td><img src="./docs/preview_dark.png" alt="Dark Mode Preview" /></td>
    <td><img src="./docs/preview_light.png" alt="Light Mode Preview" /></td>
  </tr>
</table>

---

## 🎯 About

**NeedyClash** is a customized secondary development version based on [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev). This project builds upon the excellent work of Clash Verge Rev, adding personalized features and optimizations.

### Why NeedyClash?

- **🎨 Personalized Customization**: Tailored features and UI enhancements based on personal preferences
- **⚡ Performance Optimized**: Built on high-performance Rust and Tauri 2 framework
- **🔧 Enhanced Configuration**: More flexible configuration management and customization options
- **🌐 Multi-Language Support**: Built-in support for multiple languages including English, Chinese, and more

---

## ✨ Features

### Core Features

- **🚀 High Performance**
  - Built with Rust and Tauri 2 framework for native-level performance
  - Lightweight resource consumption with fast startup speed
  - Efficient memory management and low CPU usage

- **⚙️ Clash Meta Core**
  - Built-in [Clash Meta (mihomo)](https://github.com/MetaCubeX/mihomo) kernel
  - Support for switching between stable and Alpha version kernels
  - Full support for advanced Clash Meta features

- **🎨 Modern UI**
  - Clean and beautiful Material Design interface
  - Dark/Light theme switching
  - Custom theme colors and tray icons
  - CSS injection support for deep customization

### Advanced Features

- **📝 Configuration Management**
  - Visual configuration file management
  - Merge and Script mode for configuration enhancement
  - YAML syntax highlighting and auto-completion
  - Configuration file import/export

- **🌐 Proxy Features**
  - Visual proxy group and node management
  - Real-time latency testing
  - Rule-based traffic routing
  - System proxy and guard mode
  - TUN (virtual network adapter) mode support

- **🔍 Monitoring & Debugging**
  - Real-time connection monitoring
  - Traffic statistics and analysis
  - Detailed logging
  - Network interface selection

- **☁️ Backup & Sync**
  - WebDAV configuration backup
  - Cross-device configuration synchronization
  - Automatic backup and recovery

- **🌍 Internationalization**
  - Support for 10+ languages
  - Easy language switching
  - Community-driven translations

---

## 📦 Installation

### System Requirements

- **Windows**: Windows 10 (1809+) / Windows 11
  - x64 / x86 architecture
  - WebView2 Runtime (auto-installed)

- **macOS**: macOS 10.15 (Catalina) or later
  - Intel / Apple Silicon (M1/M2/M3)

- **Linux**: Most modern distributions
  - x64 / ARM64 architecture
  - WebKit2GTK / GTK3 required

### Download

**Option 1: Download Pre-built Releases** (Recommended)

- Visit the [Releases](https://github.com/clash-verge-rev/clash-verge-rev/releases) page
- Download the appropriate installer for your platform:
  - **Windows**: `.exe` (installer) or `.zip` (portable)
  - **macOS**: `.dmg` (installer)
  - **Linux**: `.AppImage` / `.deb` / `.rpm`

**Option 2: Build from Source**
See [Development](#development) section below for build instructions.

### Installation Guide

#### Windows

1. Download the `.exe` installer
2. Run the installer and follow the setup wizard
3. Launch NeedyClash from the Start Menu or desktop shortcut

For portable version:

1. Download the `.zip` file
2. Extract to your desired location
3. Run `NeedyClash.exe`

#### macOS

1. Download the `.dmg` file
2. Open the DMG and drag NeedyClash to Applications folder
3. Launch from Applications (first time may require right-click > Open)

#### Linux

**AppImage** (Universal):

```bash
chmod +x NeedyClash_*.AppImage
./NeedyClash_*.AppImage
```

**Debian/Ubuntu** (.deb):

```bash
sudo dpkg -i needyclash_*.deb
sudo apt-get install -f  # Install dependencies if needed
```

**Fedora/RHEL** (.rpm):

```bash
sudo rpm -i needyclash_*.rpm
```

---

## 🛠️ Development

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or later)
   - Download from [nodejs.org](https://nodejs.org/)

2. **pnpm** (v8 or later)

   ```bash
   npm install -g pnpm
   ```

3. **Rust** (latest stable)

   ```bash
   # Install via rustup
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

4. **System Dependencies**

   **Windows**:
   - Visual Studio 2022 with C++ desktop development
   - WebView2 Runtime (auto-installed)

   **macOS**:
   - Xcode Command Line Tools:
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

### Build Instructions

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Lythrilla/needyclash.git
   cd needyclash
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Prepare Build**

   ```bash
   pnpm run prebuild
   ```

4. **Development Mode**

   ```bash
   pnpm dev
   ```

   This will start the development server with hot-reload enabled.

5. **Build for Production**

   ```bash
   # Standard build
   pnpm build

   # Fast build (for testing)
   pnpm run build:fast
   ```

   Build artifacts will be in `src-tauri/target/release/bundle/`

### Development Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:trace        # Start with tokio trace

# Build
pnpm build            # Production build
pnpm build:fast       # Fast build (less optimization)

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript type checking
pnpm fmt              # Format Rust code
pnpm clippy           # Run Rust linter

# Utilities
pnpm updater          # Create updater artifacts
pnpm portable         # Create portable version
```

### Project Structure

```
needyclash/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   └── locales/           # i18n translations
├── src-tauri/             # Tauri/Rust backend
│   ├── src/
│   │   ├── cmd/           # Tauri commands
│   │   ├── config/        # Configuration handling
│   │   ├── core/          # Core functionality
│   │   ├── enhance/       # Configuration enhancement
│   │   └── utils/         # Utility functions
│   └── sidecar/           # Clash Meta binaries
├── scripts/               # Build and utility scripts
└── docs/                  # Documentation and assets
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed information
2. **Suggest Features**: Share your ideas via GitHub Issues
3. **Submit Pull Requests**: Fork, create a branch, and submit a PR
4. **Improve Documentation**: Help improve docs and translations

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

---

## ❓ FAQ

### Common Issues

**Q: Application won't start on Windows**

- Ensure WebView2 Runtime is installed
- Try running as administrator
- Check antivirus/firewall settings

**Q: TUN mode not working**

- TUN mode requires administrator/root privileges
- Install the service helper when prompted
- Check system permissions

**Q: Configuration file not updating**

- Try restarting the application
- Check file permissions
- Verify the configuration URL is accessible

For more troubleshooting, visit the [Clash Verge Rev FAQ](https://clash-verge-rev.github.io/faq/windows.html).

---

## 🙏 Acknowledgements

This project would not be possible without these amazing projects:

- **[Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)** - The foundation of this project, continuing the legacy of Clash Verge
- **[Clash Verge](https://github.com/zzzgydi/clash-verge)** - The original Clash Verge project by zzzgydi
- **[Clash Meta (mihomo)](https://github.com/MetaCubeX/mihomo)** - A powerful rule-based tunnel in Go
- **[Tauri](https://github.com/tauri-apps/tauri)** - Build smaller, faster, and more secure desktop applications
- **[React](https://reactjs.org/)** - A JavaScript library for building user interfaces
- **[Material-UI](https://mui.com/)** - React components for faster and easier web development
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling

Special thanks to:

- All contributors of the Clash Verge Rev project
- The Clash Meta development team
- The Tauri community
- Everyone who has supported this project

---

## 📄 License

NeedyClash is licensed under the **GPL-3.0** license.

```
Copyright (C) 2024 Lythrilla
Based on Clash Verge Rev (GPL-3.0)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

See [LICENSE](./LICENSE) for full license text.

---

## 📮 Contact & Support

- **Original Project**: [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)
- **Documentation**: [clash-verge-rev.github.io](https://clash-verge-rev.github.io/)
- **Telegram**: [@clash_verge_rev](https://t.me/clash_verge_rev)

---

<p align="center">
  <sub>Built with ❤️ using Rust and Tauri</sub>
</p>
