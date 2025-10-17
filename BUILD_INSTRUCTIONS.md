# Clash Verge Rev - Lythrilla Edition 构建说明

## 版权信息修改完成
- **作者**: Lythrilla
- **描述**: 基于 Clash Verge Rev 的二次开发版本
- **版权**: Modified by Lythrilla - Based on Clash Verge Rev (GPL-3.0)

## 构建前准备

### 1. 安装必要的工具

#### Windows 环境需要：
- **Node.js** (v18 或更高版本)
- **pnpm** (包管理器)
- **Rust** (最新稳定版)
- **Visual Studio Build Tools** (用于编译 Rust)

#### 安装命令：
```bash
# 安装 pnpm (如果还没安装)
npm install -g pnpm

# 验证安装
node --version
pnpm --version
rustc --version
```

### 2. 安装依赖
```bash
cd C:\Users\Lythrilla\Downloads\clash-verge-rev-dev
pnpm install
```

## 构建 EXE 文件

### 方法 1: 标准构建（推荐）
```bash
pnpm run build
```

构建完成后，EXE 文件位于：
- `src-tauri/target/release/clash-verge.exe`
- 安装包位于：`src-tauri/target/release/bundle/`

### 方法 2: 快速构建（开发测试用）
```bash
pnpm run build:fast
```

## 构建产物说明

构建完成后会生成以下文件：

1. **可执行文件**
   - `src-tauri/target/release/clash-verge.exe` - 主程序

2. **安装包**
   - `src-tauri/target/release/bundle/nsis/Clash Verge_2.4.3_x64-setup.exe` - NSIS 安装程序
   - `src-tauri/target/release/bundle/msi/Clash Verge_2.4.3_x64_en-US.msi` - MSI 安装包

## 版本信息

- **版本号**: 2.4.3
- **产品名称**: Clash Verge Rev - Lythrilla Edition
- **发布者**: Lythrilla
- **许可证**: GPL-3.0-only

## 常见问题

### 1. 构建失败：缺少 Rust 工具链
```bash
# 安装 Rust
# 访问 https://rustup.rs/ 下载安装
```

### 2. 构建失败：缺少 Visual Studio Build Tools
- 下载并安装 Visual Studio Build Tools
- 选择 "C++ 生成工具" 工作负载

### 3. 构建速度慢
- 第一次构建会比较慢（需要下载依赖）
- 后续构建会快很多
- 可以使用 `pnpm run build:fast` 进行快速构建

## 验证构建结果

构建完成后，可以在文件属性中查看：
- 右键点击生成的 exe 文件
- 选择"属性" → "详细信息"
- 可以看到：
  - **文件描述**: Clash Verge Rev - Modified by Lythrilla
  - **公司**: Lythrilla
  - **版权**: Modified by Lythrilla - Based on Clash Verge Rev (GPL-3.0)

## 注意事项

1. 构建过程可能需要 10-30 分钟（取决于电脑性能）
2. 确保有足够的磁盘空间（至少 5GB）
3. 首次构建会下载大量依赖
4. 构建过程中不要关闭终端

## 清理构建文件

如果需要重新构建：
```bash
# 清理 Rust 构建缓存
cd src-tauri
cargo clean

# 清理 Node 构建产物
cd ..
rm -rf dist
```


