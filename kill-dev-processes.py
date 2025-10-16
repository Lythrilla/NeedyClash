#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
超级强力进程终止工具 - Clash Verge Dev
支持多种终止策略、子进程清理、端口释放、文件锁处理
"""

import os
import sys
import subprocess
import time
import re
from collections import defaultdict

class ProcessKiller:
    def __init__(self):
        self.killed_count = 0
        self.failed_count = 0
        self.total_count = 0
        self.verbose = True
        
    def run_command(self, cmd, silent=False):
        """执行命令并返回输出"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='ignore'
            )
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            if not silent:
                print(f"  ⚠ 命令执行异常: {e}")
            return 1, "", str(e)
    
    def get_process_tree(self, pid):
        """获取进程树（包含所有子进程）"""
        try:
            cmd = f'wmic process where (ParentProcessId={pid}) get ProcessId'
            returncode, stdout, stderr = self.run_command(cmd, silent=True)
            
            if returncode == 0 and stdout:
                pids = []
                for line in stdout.strip().split('\n')[1:]:  # 跳过标题行
                    line = line.strip()
                    if line and line.isdigit():
                        pids.append(line)
                        # 递归获取子进程
                        pids.extend(self.get_process_tree(line))
                return pids
        except:
            pass
        return []
    
    def get_process_info(self, pid):
        """获取进程详细信息"""
        cmd = f'wmic process where ProcessId={pid} get Name,CommandLine,ExecutablePath /format:list'
        returncode, stdout, stderr = self.run_command(cmd, silent=True)
        
        if returncode == 0 and stdout:
            info = {}
            for line in stdout.split('\n'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    info[key.strip()] = value.strip()
            return info
        return {}
    
    def kill_process_tree(self, pid, retry=3):
        """终止进程及其所有子进程"""
        success = False
        
        # 先获取所有子进程
        child_pids = self.get_process_tree(pid)
        all_pids = [pid] + child_pids
        
        for attempt in range(retry):
            # 尝试优雅终止
            if attempt == 0:
                returncode, _, _ = self.run_command(f'taskkill /PID {pid} /T', silent=True)
                time.sleep(0.3)
            
            # 强制终止主进程和所有子进程
            for p in all_pids:
                self.run_command(f'taskkill /F /PID {p}', silent=True)
            
            time.sleep(0.2)
            
            # 验证是否已终止
            returncode, stdout, _ = self.run_command(f'tasklist /FI "PID eq {pid}" /NH', silent=True)
            if returncode != 0 or str(pid) not in stdout:
                success = True
                break
        
        return success
    
    def kill_by_name_advanced(self, process_name, keywords=None):
        """高级进程名终止 - 支持关键词过滤"""
        print(f"\n🔍 查找进程: {process_name}")
        
        # 获取所有匹配的进程
        cmd = f'wmic process where "name=\'{process_name}\'" get ProcessId,CommandLine /format:list'
        returncode, stdout, stderr = self.run_command(cmd, silent=True)
        
        if returncode != 0 or not stdout:
            print(f"  ✓ 未找到 {process_name}")
            return True
        
        # 解析进程信息
        processes = []
        current_proc = {}
        for line in stdout.split('\n'):
            line = line.strip()
            if not line:
                if current_proc:
                    processes.append(current_proc)
                    current_proc = {}
                continue
            
            if '=' in line:
                key, value = line.split('=', 1)
                current_proc[key.strip()] = value.strip()
        
        if not processes:
            print(f"  ✓ 未找到 {process_name}")
            return True
        
        # 过滤进程
        target_processes = []
        for proc in processes:
            pid = proc.get('ProcessId', '')
            cmdline = proc.get('CommandLine', '')
            
            if not pid or not pid.isdigit():
                continue
            
            # 如果指定了关键词，只终止包含这些关键词的进程
            if keywords:
                if any(kw.lower() in cmdline.lower() for kw in keywords):
                    target_processes.append((pid, cmdline))
            else:
                target_processes.append((pid, cmdline))
        
        if not target_processes:
            print(f"  ✓ 未找到匹配的 {process_name}")
            return True
        
        # 终止进程
        print(f"  📋 找到 {len(target_processes)} 个进程")
        success_count = 0
        
        for pid, cmdline in target_processes:
            self.total_count += 1
            # 显示命令行（截断）
            display_cmd = cmdline[:80] + "..." if len(cmdline) > 80 else cmdline
            print(f"  → 终止 PID {pid}: {display_cmd}")
            
            if self.kill_process_tree(pid):
                print(f"  ✓ 成功终止 PID {pid}")
                self.killed_count += 1
                success_count += 1
            else:
                print(f"  ✗ 终止失败 PID {pid}")
                self.failed_count += 1
        
        return success_count > 0
    
    def kill_by_port_advanced(self, port):
        """高级端口清理 - 显示进程信息"""
        print(f"\n🔍 检查端口: {port}")
        
        # 查找占用端口的连接
        returncode, stdout, stderr = self.run_command(f'netstat -ano | findstr :{port}', silent=True)
        
        if returncode != 0 or not stdout:
            print(f"  ✓ 端口 {port} 空闲")
            return True
        
        # 解析 PID
        pid_connections = defaultdict(list)
        for line in stdout.strip().split('\n'):
            parts = line.strip().split()
            if len(parts) >= 5:
                pid = parts[-1]
                if pid.isdigit() and pid != "0":
                    connection_type = parts[0]  # TCP/UDP
                    local_addr = parts[1]
                    state = parts[3] if len(parts) > 3 and parts[3] != pid else ""
                    pid_connections[pid].append({
                        'type': connection_type,
                        'addr': local_addr,
                        'state': state
                    })
        
        if not pid_connections:
            print(f"  ✓ 端口 {port} 空闲")
            return True
        
        print(f"  📋 找到 {len(pid_connections)} 个进程占用端口")
        
        # 终止每个占用端口的进程
        success_count = 0
        for pid, connections in pid_connections.items():
            self.total_count += 1
            
            # 获取进程信息
            info = self.get_process_info(pid)
            process_name = info.get('Name', 'Unknown')
            
            print(f"  → 终止 PID {pid} ({process_name})")
            print(f"     连接数: {len(connections)}")
            
            if self.kill_process_tree(pid, retry=5):
                print(f"  ✓ 成功终止 PID {pid}")
                self.killed_count += 1
                success_count += 1
            else:
                print(f"  ✗ 终止失败 PID {pid}")
                self.failed_count += 1
            
            time.sleep(0.3)
        
        # 验证端口是否释放
        time.sleep(0.5)
        returncode, stdout, _ = self.run_command(f'netstat -ano | findstr :{port}', silent=True)
        if returncode != 0 or not stdout:
            print(f"  ✅ 端口 {port} 已释放")
        else:
            print(f"  ⚠ 端口 {port} 仍被占用")
        
        return success_count > 0
    
    def kill_by_cmdline_pattern(self, pattern, description):
        """根据命令行模式终止进程"""
        print(f"\n🔍 查找进程: {description}")
        
        cmd = 'wmic process get ProcessId,CommandLine /format:list'
        returncode, stdout, stderr = self.run_command(cmd, silent=True)
        
        if returncode != 0 or not stdout:
            print(f"  ✓ 未找到匹配进程")
            return True
        
        # 解析并匹配
        processes = []
        current_proc = {}
        for line in stdout.split('\n'):
            line = line.strip()
            if not line:
                if current_proc and current_proc.get('ProcessId'):
                    cmdline = current_proc.get('CommandLine', '')
                    if re.search(pattern, cmdline, re.IGNORECASE):
                        processes.append(current_proc)
                current_proc = {}
                continue
            
            if '=' in line:
                key, value = line.split('=', 1)
                current_proc[key.strip()] = value.strip()
        
        if not processes:
            print(f"  ✓ 未找到匹配进程")
            return True
        
        print(f"  📋 找到 {len(processes)} 个进程")
        
        for proc in processes:
            pid = proc.get('ProcessId', '')
            if not pid or not pid.isdigit():
                continue
            
            self.total_count += 1
            cmdline = proc.get('CommandLine', '')[:80]
            print(f"  → 终止 PID {pid}: {cmdline}")
            
            if self.kill_process_tree(pid):
                print(f"  ✓ 成功终止 PID {pid}")
                self.killed_count += 1
            else:
                print(f"  ✗ 终止失败 PID {pid}")
                self.failed_count += 1
        
        return True
    
    def cleanup_npm_locks(self):
        """清理 npm/pnpm 锁文件"""
        print(f"\n🧹 清理锁文件...")
        
        lock_patterns = [
            '.pnpm-lock.yaml',
            'package-lock.json',
            'yarn.lock',
            'node_modules/.cache',
        ]
        
        cleaned = 0
        for pattern in lock_patterns:
            if os.path.exists(pattern):
                try:
                    if os.path.isfile(pattern):
                        os.remove(pattern)
                        print(f"  ✓ 删除: {pattern}")
                        cleaned += 1
                    elif os.path.isdir(pattern):
                        import shutil
                        shutil.rmtree(pattern)
                        print(f"  ✓ 删除目录: {pattern}")
                        cleaned += 1
                except Exception as e:
                    print(f"  ⚠ 无法删除 {pattern}: {e}")
        
        if cleaned == 0:
            print(f"  ✓ 无需清理")

def main():
    """主函数"""
    killer = ProcessKiller()
    
    print("=" * 70)
    print("  🔥 超级强力进程终止工具 - Clash Verge Dev 🔥")
    print("=" * 70)
    
    # 0. 优先终止 Clash Verge 和 Mihomo 相关进程
    print("\n" + "─" * 70)
    print("🎯 第零阶段: 清理 Clash Verge 和 Mihomo 进程")
    print("─" * 70)
    
    clash_verge_processes = [
        "verge-mihomo.exe",
        "verge-mihomo-alpha.exe",
        "clash-verge-service.exe",
        "clash-verge.exe",
        "mihomo.exe",
        "clash.exe",
        "clash-meta.exe",
    ]
    
    for proc in clash_verge_processes:
        killer.kill_by_name_advanced(proc)
        time.sleep(0.1)
    
    # 1. 终止 Node.js 相关进程（带关键词过滤）
    print("\n" + "─" * 70)
    print("📦 第一阶段: 清理 Node.js 进程")
    print("─" * 70)
    
    killer.kill_by_name_advanced("node.exe", keywords=["vite", "dev", "tauri", "pnpm", "npm"])
    
    # 2. 终止其他开发工具
    print("\n" + "─" * 70)
    print("🛠 第二阶段: 清理开发工具进程")
    print("─" * 70)
    
    dev_tools = [
        "vite.exe",
        "pnpm.exe",
        "npm.exe",
        "yarn.exe",
        "bun.exe",
        "deno.exe",
    ]
    
    for tool in dev_tools:
        killer.kill_by_name_advanced(tool)
        time.sleep(0.1)
    
    # 3. 根据命令行模式终止
    print("\n" + "─" * 70)
    print("🎯 第三阶段: 模式匹配清理")
    print("─" * 70)
    
    patterns = [
        (r'tauri.*dev', 'Tauri 开发服务'),
        (r'vite.*--port.*5173', 'Vite 开发服务'),
        (r'webpack.*dev.*server', 'Webpack 开发服务'),
    ]
    
    for pattern, desc in patterns:
        killer.kill_by_cmdline_pattern(pattern, desc)
        time.sleep(0.1)
    
    # 4. 清理端口占用
    print("\n" + "─" * 70)
    print("🌐 第四阶段: 清理端口占用")
    print("─" * 70)
    
    ports = [
        1420,  # Tauri 默认端口
        5173,  # Vite 默认端口
        3000,  # 常见开发端口
        3001,
        8080,
        8081,
        9000,
        9001,
    ]
    
    for port in ports:
        killer.kill_by_port_advanced(port)
        time.sleep(0.1)
    
    # 5. 清理锁文件（可选）
    # killer.cleanup_npm_locks()
    
    # 6. 最终验证
    print("\n" + "─" * 70)
    print("✅ 第五阶段: 最终验证")
    print("─" * 70)
    
    time.sleep(1)
    
    # 再次检查关键端口
    critical_ports = [1420, 5173]
    all_clear = True
    for port in critical_ports:
        returncode, stdout, _ = killer.run_command(f'netstat -ano | findstr :{port}', silent=True)
        if returncode == 0 and stdout:
            print(f"  ⚠ 端口 {port} 仍被占用")
            all_clear = False
        else:
            print(f"  ✓ 端口 {port} 空闲")
    
    # 打印统计
    print("\n" + "=" * 70)
    print("📊 清理统计")
    print("=" * 70)
    print(f"  总计处理: {killer.total_count} 个进程")
    print(f"  成功终止: {killer.killed_count} 个")
    print(f"  失败数量: {killer.failed_count} 个")
    print()
    
    if all_clear and killer.failed_count == 0:
        print("  ✅ 所有进程已清理，端口已释放")
        print("  🚀 现在可以安全运行: pnpm dev")
    elif killer.failed_count > 0:
        print("  ⚠ 部分进程终止失败，可能需要管理员权限")
        print("  💡 建议: 以管理员身份运行此脚本")
    else:
        print("  ✅ 清理完成")
        print("  🚀 现在可以运行: pnpm dev")
    
    print("=" * 70)

if __name__ == "__main__":
    try:
        # 检查是否以管理员权限运行
        try:
            is_admin = os.getuid() == 0
        except AttributeError:
            import ctypes
            is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
        
        if not is_admin:
            print("💡 提示: 以管理员权限运行可以提高成功率\n")
        
        main()
    except KeyboardInterrupt:
        print("\n\n❌ 操作已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

