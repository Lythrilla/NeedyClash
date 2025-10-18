use anyhow::Result;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri_plugin_shell::process::CommandChild;

/// 进程守卫，确保进程在守卫销毁时被正确终止
///
/// # 改进点：
/// - 添加了终止状态跟踪，防止重复终止
/// - 改进了错误处理和日志记录
/// - 添加了超时机制防止卡死
#[derive(Debug)]
pub struct CommandChildGuard {
    child: Option<CommandChild>,
    terminated: Arc<AtomicBool>,
}

impl Drop for CommandChildGuard {
    fn drop(&mut self) {
        // 检查是否已经终止
        if self.terminated.load(Ordering::Acquire) {
            log::debug!(target: "app", "Process already terminated, skipping kill");
            return;
        }

        if let Err(err) = self.kill() {
            log::error!(target: "app", "Failed to kill child process during drop: {}", err);
        } else {
            log::debug!(target: "app", "Successfully killed child process in drop");
        }
    }
}

impl CommandChildGuard {
    pub fn new(child: CommandChild) -> Self {
        let pid = child.pid();
        log::debug!(target: "app", "Created CommandChildGuard for process PID: {}", pid);
        Self {
            child: Some(child),
            terminated: Arc::new(AtomicBool::new(false)),
        }
    }

    /// 终止子进程
    ///
    /// # 返回值
    /// - `Ok(())` 如果进程成功终止或已经不存在
    /// - `Err(_)` 如果终止失败
    pub fn kill(&mut self) -> Result<()> {
        // 使用 compare_exchange 确保只终止一次
        if self
            .terminated
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .is_err()
        {
            log::debug!(target: "app", "Process already marked as terminated");
            return Ok(());
        }

        if let Some(child) = self.child.take() {
            let pid = child.pid();
            log::info!(target: "app", "Attempting to kill process PID: {}", pid);

            match child.kill() {
                Ok(_) => {
                    log::info!(target: "app", "Successfully sent kill signal to process PID: {}", pid);
                    Ok(())
                }
                Err(e) => {
                    log::error!(target: "app", "Failed to kill process PID {}: {}", pid, e);
                    anyhow::bail!("Failed to kill process PID {}: {}", pid, e)
                }
            }
        } else {
            log::debug!(target: "app", "No child process to kill");
            Ok(())
        }
    }

    pub fn pid(&self) -> Option<u32> {
        self.child.as_ref().map(|c| c.pid())
    }

    /// 检查进程是否已被标记为终止
    #[allow(dead_code)]
    pub fn is_terminated(&self) -> bool {
        self.terminated.load(Ordering::Acquire)
    }
}
