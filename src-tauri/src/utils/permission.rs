use anyhow::{Result, bail};

/// 检查当前进程是否具有管理员/root权限
pub fn check_admin_privileges() -> Result<bool> {
    #[cfg(target_os = "windows")]
    {
        use deelevate::{PrivilegeLevel, Token};
        Token::with_current_process()
            .and_then(|token| token.privilege_level())
            .map(|level| level != PrivilegeLevel::NotPrivileged)
            .map_err(|e| anyhow::anyhow!("Failed to check privilege level: {}", e))
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(unsafe { libc::geteuid() } == 0)
    }
}

/// 检查是否在服务模式或管理员模式下运行
pub fn check_elevated_privileges() -> Result<()> {
    use crate::core::{CoreManager, RunningMode};

    let running_mode = CoreManager::global().get_running_mode();

    if running_mode == RunningMode::Service {
        return Ok(());
    }

    let is_admin = check_admin_privileges()?;

    if !is_admin {
        #[cfg(target_os = "windows")]
        bail!("This operation requires Service Mode or Administrator privileges");

        #[cfg(not(target_os = "windows"))]
        bail!("This operation requires Service Mode or root privileges");
    }

    Ok(())
}
