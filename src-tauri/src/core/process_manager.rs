#[allow(unused_imports)]
use crate::AsyncHandler;
use crate::{logging, utils::logging::Type};
use anyhow::Result;

/// 进程管理器 - 负责清理和管理mihomo进程
/// TODO: 集成到核心启动/停止流程中，自动清理孤立进程
#[allow(dead_code)]
pub struct ProcessManager;

impl ProcessManager {
    /// 清理多余的 mihomo 进程
    #[allow(dead_code)]
    pub async fn cleanup_orphaned_processes(current_pid: Option<u32>) -> Result<()> {
        use tokio::time::{Duration, timeout};

        logging!(info, Type::Core, "开始清理多余的 mihomo 进程");

        let cleanup_result = timeout(Duration::from_secs(30), async {
            if let Some(pid) = current_pid {
                logging!(debug, Type::Core, "当前管理的进程 PID: {}", pid);
            }

            let target_processes = ["verge-mihomo", "verge-mihomo-alpha"];
            let mut process_futures = Vec::new();

            for &target in &target_processes {
                let process_name = if cfg!(windows) {
                    format!("{target}.exe")
                } else {
                    target.into()
                };

                process_futures.push(async move {
                    timeout(
                        Duration::from_secs(5),
                        Self::find_processes_by_name(process_name.clone(), target),
                    )
                    .await
                    .unwrap_or_else(|_| {
                        logging!(warn, Type::Core, "查找进程 {} 超时", process_name);
                        Ok((Vec::new(), process_name))
                    })
                });
            }

            let process_results = futures::future::join_all(process_futures).await;

            // 收集所有需要终止的进程PID
            let mut pids_to_kill = Vec::new();
            for result in process_results {
                match result {
                    Ok((pids, process_name)) => {
                        for pid in pids {
                            if let Some(current) = current_pid {
                                if pid == current {
                                    logging!(
                                        debug,
                                        Type::Core,
                                        "跳过当前管理的进程: {} (PID: {})",
                                        process_name,
                                        pid
                                    );
                                    continue;
                                }
                            }
                            pids_to_kill.push((pid, process_name.clone()));
                        }
                    }
                    Err(e) => {
                        logging!(debug, Type::Core, "查找进程时发生错误: {}", e);
                    }
                }
            }

            if pids_to_kill.is_empty() {
                logging!(debug, Type::Core, "未发现多余的 mihomo 进程");
                return Ok(());
            }

            logging!(
                info,
                Type::Core,
                "发现 {} 个需要清理的进程",
                pids_to_kill.len()
            );

            // 并行终止所有目标进程
            let mut kill_futures = Vec::new();
            for (pid, process_name) in &pids_to_kill {
                let pid = *pid;
                let process_name = process_name.clone();
                kill_futures.push(async move {
                    timeout(
                        Duration::from_secs(3),
                        Self::kill_process_with_verification(pid, process_name.clone()),
                    )
                    .await
                    .unwrap_or_else(|_| {
                        logging!(
                            warn,
                            Type::Core,
                            "终止进程 {} (PID: {}) 超时",
                            process_name,
                            pid
                        );
                        false
                    })
                });
            }

            let kill_results = futures::future::join_all(kill_futures).await;
            let killed_count = kill_results.into_iter().filter(|&success| success).count();

            if killed_count > 0 {
                logging!(
                    info,
                    Type::Core,
                    "清理完成，共终止了 {} 个多余的 mihomo 进程",
                    killed_count
                );
            } else {
                logging!(warn, Type::Core, "清理过程完成，但没有成功终止任何进程");
            }

            Ok(())
        })
        .await;

        match cleanup_result {
            Ok(result) => result,
            Err(_) => {
                logging!(error, Type::Core, "清理 mihomo 进程总体超时（30秒）");
                Err(anyhow::anyhow!("清理进程超时"))
            }
        }
    }

    /// 根据进程名查找进程PID列表
    #[allow(dead_code)]
    async fn find_processes_by_name(
        process_name: String,
        _target: &str,
    ) -> Result<(Vec<u32>, String)> {
        #[cfg(windows)]
        {
            use std::mem;
            use winapi::um::handleapi::CloseHandle;
            use winapi::um::tlhelp32::{
                CreateToolhelp32Snapshot, PROCESSENTRY32W, Process32FirstW, Process32NextW,
                TH32CS_SNAPPROCESS,
            };
            use winapi::um::winnt::HANDLE;

            let process_name_clone = process_name.clone();
            let pids = AsyncHandler::spawn_blocking(move || -> Result<Vec<u32>> {
                let mut pids = Vec::new();

                unsafe {
                    let snapshot: HANDLE = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
                    if snapshot == winapi::um::handleapi::INVALID_HANDLE_VALUE {
                        return Err(anyhow::anyhow!("Failed to create process snapshot"));
                    }

                    let mut pe32: PROCESSENTRY32W = mem::zeroed();
                    pe32.dwSize = mem::size_of::<PROCESSENTRY32W>() as u32;

                    if Process32FirstW(snapshot, &mut pe32) != 0 {
                        loop {
                            let end_pos = pe32
                                .szExeFile
                                .iter()
                                .position(|&x| x == 0)
                                .unwrap_or(pe32.szExeFile.len());
                            let exe_file = String::from_utf16_lossy(&pe32.szExeFile[..end_pos]);

                            if exe_file.eq_ignore_ascii_case(&process_name_clone) {
                                pids.push(pe32.th32ProcessID);
                            }
                            if Process32NextW(snapshot, &mut pe32) == 0 {
                                break;
                            }
                        }
                    }

                    CloseHandle(snapshot);
                }

                Ok(pids)
            })
            .await??;

            Ok((pids, process_name))
        }

        #[cfg(not(windows))]
        {
            let output = if cfg!(target_os = "macos") {
                tokio::process::Command::new("pgrep")
                    .arg(&process_name)
                    .output()
                    .await?
            } else {
                tokio::process::Command::new("pidof")
                    .arg(&process_name)
                    .output()
                    .await?
            };

            if !output.status.success() {
                return Ok((Vec::new(), process_name));
            }

            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut pids = Vec::new();

            for pid_str in stdout.split_whitespace() {
                if let Ok(pid) = pid_str.parse::<u32>() {
                    pids.push(pid);
                }
            }

            Ok((pids, process_name))
        }
    }

    /// 终止进程并验证结果
    #[allow(dead_code)]
    async fn kill_process_with_verification(pid: u32, process_name: String) -> bool {
        logging!(
            info,
            Type::Core,
            "尝试终止进程: {} (PID: {})",
            process_name,
            pid
        );

        #[cfg(windows)]
        let success = {
            use winapi::um::handleapi::CloseHandle;
            use winapi::um::processthreadsapi::{OpenProcess, TerminateProcess};
            use winapi::um::winnt::{HANDLE, PROCESS_TERMINATE};

            AsyncHandler::spawn_blocking(move || -> bool {
                unsafe {
                    let process_handle: HANDLE = OpenProcess(PROCESS_TERMINATE, 0, pid);
                    if process_handle.is_null() {
                        return false;
                    }
                    let result = TerminateProcess(process_handle, 1);
                    CloseHandle(process_handle);
                    result != 0
                }
            })
            .await
            .unwrap_or(false)
        };

        #[cfg(not(windows))]
        let success = {
            tokio::process::Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output()
                .await
                .map(|output| output.status.success())
                .unwrap_or(false)
        };

        if success {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            let still_running = Self::is_process_running(pid).await.unwrap_or(false);
            if still_running {
                logging!(
                    warn,
                    Type::Core,
                    "进程 {} (PID: {}) 终止命令成功但进程仍在运行",
                    process_name,
                    pid
                );
                false
            } else {
                logging!(
                    info,
                    Type::Core,
                    "成功终止进程: {} (PID: {})",
                    process_name,
                    pid
                );
                true
            }
        } else {
            logging!(
                warn,
                Type::Core,
                "无法终止进程: {} (PID: {})",
                process_name,
                pid
            );
            false
        }
    }

    /// 检查进程是否正在运行
    #[allow(dead_code)]
    async fn is_process_running(pid: u32) -> Result<bool> {
        #[cfg(windows)]
        {
            use winapi::shared::minwindef::DWORD;
            use winapi::um::handleapi::CloseHandle;
            use winapi::um::processthreadsapi::GetExitCodeProcess;
            use winapi::um::processthreadsapi::OpenProcess;
            use winapi::um::winnt::{HANDLE, PROCESS_QUERY_INFORMATION};

            AsyncHandler::spawn_blocking(move || -> Result<bool> {
                unsafe {
                    let process_handle: HANDLE = OpenProcess(PROCESS_QUERY_INFORMATION, 0, pid);
                    if process_handle.is_null() {
                        return Ok(false);
                    }
                    let mut exit_code: DWORD = 0;
                    let result = GetExitCodeProcess(process_handle, &mut exit_code);
                    CloseHandle(process_handle);

                    if result == 0 {
                        return Ok(false);
                    }
                    Ok(exit_code == 259)
                }
            })
            .await?
        }

        #[cfg(not(windows))]
        {
            let output = tokio::process::Command::new("ps")
                .args(["-p", &pid.to_string()])
                .output()
                .await?;

            Ok(output.status.success() && !output.stdout.is_empty())
        }
    }
}
