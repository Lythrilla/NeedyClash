import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { log_error, log_info, log_success } from "./utils.mjs";

const cwd = process.cwd();

// 定义所有支持的目标平台
const ALL_TARGETS = {
  windows: [
    "x86_64-pc-windows-msvc",    // Windows x64
    "i686-pc-windows-msvc",      // Windows x86 (32位)
    "aarch64-pc-windows-msvc",   // Windows ARM64
  ],
  macos: [
    "x86_64-apple-darwin",       // macOS Intel
    "aarch64-apple-darwin",      // macOS Apple Silicon (M1/M2)
  ],
  linux: [
    "x86_64-unknown-linux-gnu",  // Linux x64
    "aarch64-unknown-linux-gnu", // Linux ARM64
    "armv7-unknown-linux-gnueabihf", // Linux ARMv7
  ],
};

// 检测当前操作系统
function getCurrentOS() {
  const platform = process.platform;
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "macos";
  if (platform === "linux") return "linux";
  throw new Error(`不支持的操作系统: ${platform}`);
}

// 获取当前系统的默认目标
function getCurrentTargets() {
  const os = getCurrentOS();
  return ALL_TARGETS[os];
}

// 检查 Rust 工具链是否已安装
function checkRustToolchain(target) {
  try {
    execSync(`rustup target list --installed | findstr ${target}`, {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

// 安装 Rust 工具链
function installRustToolchain(target) {
  log_info(`正在安装 Rust 工具链: ${target}...`);
  try {
    execSync(`rustup target add ${target}`, { stdio: "inherit" });
    log_success(`✓ 工具链安装成功: ${target}`);
    return true;
  } catch (err) {
    log_error(`✗ 工具链安装失败: ${target}`);
    return false;
  }
}

// 运行 prebuild 脚本
async function runPrebuild(target) {
  log_info(`运行 prebuild 脚本 (目标: ${target})...`);
  try {
    execSync(`node scripts/prebuild.mjs ${target}`, {
      stdio: "inherit",
      cwd,
    });
    log_success(`✓ prebuild 完成: ${target}`);
    return true;
  } catch (err) {
    log_error(`✗ prebuild 失败: ${target}`);
    return false;
  }
}

// 构建目标
async function buildTarget(target, fast = false) {
  log_info(`开始构建: ${target}${fast ? " (快速模式)" : ""}...`);
  try {
    const buildCmd = fast
      ? `pnpm tauri build --target ${target} -- --profile fast-release`
      : `pnpm tauri build --target ${target}`;

    execSync(buildCmd, {
      stdio: "inherit",
      cwd,
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
    });
    log_success(`✓ 构建完成: ${target}`);
    return true;
  } catch (err) {
    log_error(`✗ 构建失败: ${target}`);
    return false;
  }
}

// 构建单个目标的完整流程
async function buildSingleTarget(target, fast = false) {
  console.log("\n" + "=".repeat(60));
  log_info(`构建目标: ${target}`);
  console.log("=".repeat(60) + "\n");

  // 检查并安装工具链
  if (!checkRustToolchain(target)) {
    log_info(`未找到工具链 ${target}，正在安装...`);
    if (!installRustToolchain(target)) {
      return false;
    }
  } else {
    log_success(`✓ 工具链已安装: ${target}`);
  }

  // 运行 prebuild
  if (!(await runPrebuild(target))) {
    return false;
  }

  // 构建
  if (!(await buildTarget(target, fast))) {
    return false;
  }

  return true;
}

// 构建多个目标
async function buildMultipleTargets(targets, fast = false) {
  const results = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    log_info(`\n[${i + 1}/${targets.length}] 处理目标: ${target}\n`);

    const success = await buildSingleTarget(target, fast);
    if (success) {
      results.success.push(target);
    } else {
      results.failed.push(target);
    }
  }

  return results;
}

// 显示帮助信息
function showHelp() {
  console.log(`
Clash Verge Rev - 多平台构建工具
作者: Lythrilla

用法:
  node scripts/build-all-platforms.mjs [选项] [目标...]

选项:
  --help, -h          显示此帮助信息
  --fast, -f          使用快速构建模式（开发测试用）
  --current           仅构建当前操作系统的所有架构
  --all               构建当前操作系统的所有可用目标

目标平台:
  Windows:
    x86_64-pc-windows-msvc      (Windows x64)
    i686-pc-windows-msvc        (Windows x86/32位)
    aarch64-pc-windows-msvc     (Windows ARM64)

  macOS:
    x86_64-apple-darwin         (macOS Intel)
    aarch64-apple-darwin        (macOS Apple Silicon M1/M2)

  Linux:
    x86_64-unknown-linux-gnu    (Linux x64)
    aarch64-unknown-linux-gnu   (Linux ARM64)
    armv7-unknown-linux-gnueabihf (Linux ARMv7)

示例:
  # 构建当前系统的所有架构
  node scripts/build-all-platforms.mjs --current

  # 快速构建当前系统的所有架构
  node scripts/build-all-platforms.mjs --current --fast

  # 构建特定目标
  node scripts/build-all-platforms.mjs x86_64-pc-windows-msvc

  # 构建多个特定目标
  node scripts/build-all-platforms.mjs x86_64-pc-windows-msvc aarch64-pc-windows-msvc

注意:
  - 跨平台构建（如在 Windows 上构建 macOS）需要特殊配置或使用 CI/CD
  - 建议在各自的操作系统上构建对应平台的版本
  - 使用 GitHub Actions 可以自动化多平台构建
`);
}

// 显示构建结果摘要
function showSummary(results, startTime) {
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log("\n" + "=".repeat(60));
  console.log("构建摘要");
  console.log("=".repeat(60));

  if (results.success.length > 0) {
    console.log("\n✓ 构建成功:");
    results.success.forEach((target) => {
      console.log(`  - ${target}`);
    });
  }

  if (results.failed.length > 0) {
    console.log("\n✗ 构建失败:");
    results.failed.forEach((target) => {
      console.log(`  - ${target}`);
    });
  }

  console.log(`\n总耗时: ${duration} 分钟`);
  console.log("\n构建产物位置:");
  console.log("  - 可执行文件: src-tauri/target/<target>/release/");
  console.log("  - 安装包: src-tauri/target/<target>/release/bundle/");
  console.log("=".repeat(60) + "\n");
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  // 显示帮助
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // 检查必要工具
  try {
    execSync("rustc --version", { stdio: "pipe" });
    execSync("pnpm --version", { stdio: "pipe" });
  } catch {
    log_error("错误: 未找到必要工具 (rustc 或 pnpm)");
    log_info("请确保已安装 Rust 和 pnpm");
    process.exit(1);
  }

  const startTime = Date.now();
  const fast = args.includes("--fast") || args.includes("-f");
  const currentOS = getCurrentOS();

  let targets = [];

  // 解析参数
  if (args.includes("--current")) {
    targets = getCurrentTargets();
    log_info(`当前操作系统: ${currentOS}`);
    log_info(`将构建以下目标: ${targets.join(", ")}`);
  } else if (args.includes("--all")) {
    targets = getCurrentTargets();
    log_info(`将构建当前系统的所有目标: ${targets.join(", ")}`);
  } else {
    // 过滤出有效的目标
    const validTargets = [
      ...ALL_TARGETS.windows,
      ...ALL_TARGETS.macos,
      ...ALL_TARGETS.linux,
    ];

    targets = args.filter(
      (arg) => !arg.startsWith("--") && validTargets.includes(arg),
    );

    if (targets.length === 0) {
      log_error("错误: 未指定有效的构建目标");
      log_info("使用 --help 查看帮助信息");
      process.exit(1);
    }

    // 检查跨平台构建警告
    const targetOS = targets.map((t) => {
      if (ALL_TARGETS.windows.includes(t)) return "windows";
      if (ALL_TARGETS.macos.includes(t)) return "macos";
      if (ALL_TARGETS.linux.includes(t)) return "linux";
      return null;
    });

    const hasCrossPlatform = targetOS.some((os) => os && os !== currentOS);
    if (hasCrossPlatform) {
      log_info(
        "⚠ 警告: 检测到跨平台构建目标，可能需要特殊配置或 CI/CD 支持",
      );
      log_info(`当前操作系统: ${currentOS}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  log_info("Clash Verge Rev - 多平台构建");
  log_info(`作者: Lythrilla`);
  console.log("=".repeat(60));
  log_info(`构建目标数量: ${targets.length}`);
  log_info(`构建模式: ${fast ? "快速模式" : "标准模式"}`);
  console.log("=".repeat(60) + "\n");

  // 执行构建
  const results = await buildMultipleTargets(targets, fast);

  // 显示摘要
  showSummary(results, startTime);

  // 如果有失败的构建，退出码为 1
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

// 运行主函数
main().catch((err) => {
  log_error("发生错误:", err.message);
  process.exit(1);
});



