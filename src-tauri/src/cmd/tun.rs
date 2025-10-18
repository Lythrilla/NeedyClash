use super::CmdResult;
use crate::config::Config;
use crate::core::tun_manager::{TUN_MANAGER, TunManager};
use crate::utils::i18n::t;

/// 检查是否可以启用 TUN 模式
#[tauri::command]
pub async fn check_tun_available() -> CmdResult<bool> {
    match TunManager::can_enable_tun().await {
        Ok(_) => Ok(true),
        Err(err) => {
            log::debug!(target: "app", "TUN mode not available: {}", err);
            Ok(false)
        }
    }
}

/// 获取 TUN 模式状态
#[tauri::command]
pub async fn get_tun_status() -> CmdResult<String> {
    let status = TUN_MANAGER.get_status().await;
    Ok(format!("{:?}", status))
}

/// 启用 TUN 模式
#[tauri::command]
pub async fn enable_tun_mode() -> CmdResult {
    // 检查是否可以启用
    if let Err(err) = TunManager::can_enable_tun().await {
        return Err(t(err.to_string().as_str()).await);
    }

    // 启用 TUN
    TUN_MANAGER
        .enable_tun()
        .await
        .map_err(|err| err.to_string())?;

    Ok(())
}

/// 禁用 TUN 模式
#[tauri::command]
pub async fn disable_tun_mode() -> CmdResult {
    TUN_MANAGER
        .disable_tun()
        .await
        .map_err(|err| err.to_string())?;

    Ok(())
}

/// 同步 TUN 状态
#[tauri::command]
pub async fn sync_tun_status() -> CmdResult {
    TUN_MANAGER
        .sync_tun_status()
        .await
        .map_err(|err| err.to_string())?;

    Ok(())
}

/// 重新应用 TUN 配置
#[tauri::command]
pub async fn reapply_tun_config() -> CmdResult {
    TUN_MANAGER
        .reapply_tun()
        .await
        .map_err(|err| err.to_string())?;

    Ok(())
}

/// 切换 TUN 模式（用于快捷键等）
#[tauri::command]
pub async fn toggle_tun_mode() -> CmdResult<bool> {
    let verge_config = Config::verge().await;
    let current_state = verge_config.latest_ref().enable_tun_mode.unwrap_or(false);
    drop(verge_config);

    let new_state = !current_state;

    // 先检查是否可以启用
    if new_state {
        if let Err(err) = TunManager::can_enable_tun().await {
            return Err(t(err.to_string().as_str()).await);
        }
    }

    // 更新配置
    use crate::config::IVerge;
    use crate::feat::patch_verge;

    let patch = IVerge {
        enable_tun_mode: Some(new_state),
        ..Default::default()
    };

    patch_verge(patch, false)
        .await
        .map_err(|err| err.to_string())?;

    Ok(new_state)
}
