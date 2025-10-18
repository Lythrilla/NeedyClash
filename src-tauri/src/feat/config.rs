use crate::{
    config::{Config, IVerge},
    core::{CoreManager, handle, hotkey, sysopt, tray},
    feat::config_flags::{UpdateFlags, analyze_patch},
    logging, logging_error,
    module::lightweight,
    utils::logging::Type,
};
use anyhow::Result;
use serde_yaml_ng::Mapping;

/// Patch Clash configuration
pub async fn patch_clash(patch: Mapping) -> Result<()> {
    Config::clash()
        .await
        .draft_mut()
        .patch_config(patch.clone());

    let res = {
        // 激活订阅
        if patch.get("secret").is_some() || patch.get("external-controller").is_some() {
            Config::generate().await?;
            CoreManager::global().restart_core().await?;
        } else {
            if patch.get("mode").is_some() {
                logging_error!(Type::Tray, tray::Tray::global().update_menu().await);
                logging_error!(Type::Tray, tray::Tray::global().update_icon().await);
            }
            Config::runtime().await.draft_mut().patch_config(patch);
            CoreManager::global().update_config().await?;
        }
        handle::Handle::refresh_clash();
        <Result<()>>::Ok(())
    };
    match res {
        Ok(()) => {
            Config::clash().await.apply();
            // 分离数据获取和异步调用
            let clash_data = Config::clash().await.data_mut().clone();
            clash_data.save_config().await?;
            Ok(())
        }
        Err(err) => {
            Config::clash().await.discard();
            Err(err)
        }
    }
}

// 更新标志已移至 config_flags 模块

/// Patch Verge configuration
pub async fn patch_verge(patch: IVerge, not_save_file: bool) -> Result<()> {
    Config::verge()
        .await
        .draft_mut()
        .patch_config(patch.clone());

    // 分析配置补丁，获取需要更新的标志
    let update_flags = analyze_patch(&patch);

    let res: std::result::Result<(), anyhow::Error> = {
        // Process updates based on flags
        if update_flags.contains(UpdateFlags::RESTART_CORE) {
            Config::generate().await?;
            CoreManager::global().restart_core().await?;
        }
        if update_flags.contains(UpdateFlags::CLASH_CONFIG) {
            CoreManager::global().update_config().await?;
            handle::Handle::refresh_clash();

            // 如果是 TUN 模式更改，使用 TUN Manager 处理
            if patch.enable_tun_mode.is_some() {
                use crate::core::tun_manager::TUN_MANAGER;
                if let Err(err) = TUN_MANAGER.sync_tun_status().await {
                    logging!(error, Type::System, "同步 TUN 状态失败: {}", err);
                }
            }
        }
        if update_flags.contains(UpdateFlags::VERGE_CONFIG) {
            Config::verge().await.draft_mut().enable_global_hotkey = patch.enable_global_hotkey;
            handle::Handle::refresh_verge();
        }
        if update_flags.contains(UpdateFlags::LAUNCH) {
            sysopt::Sysopt::global().update_launch().await?;
        }
        if update_flags.contains(UpdateFlags::SYS_PROXY) {
            sysopt::Sysopt::global().update_sysproxy().await?;
        }
        if update_flags.contains(UpdateFlags::HOTKEY)
            && let Some(hotkeys) = patch.hotkeys
        {
            hotkey::Hotkey::global().update(hotkeys).await?;
        }
        if update_flags.contains(UpdateFlags::SYSTRAY_MENU) {
            tray::Tray::global().update_menu().await?;
        }
        if update_flags.contains(UpdateFlags::SYSTRAY_ICON) {
            tray::Tray::global().update_icon().await?;
        }
        if update_flags.contains(UpdateFlags::SYSTRAY_TOOLTIP) {
            tray::Tray::global().update_tooltip().await?;
        }
        if update_flags.contains(UpdateFlags::SYSTRAY_CLICK_BEHAVIOR) {
            tray::Tray::global().update_click_behavior().await?;
        }
        if update_flags.contains(UpdateFlags::LIGHT_WEIGHT) {
            if patch.enable_auto_light_weight_mode.unwrap_or(false) {
                lightweight::enable_auto_light_weight_mode().await;
            } else {
                lightweight::disable_auto_light_weight_mode();
            }
        }

        <Result<()>>::Ok(())
    };
    match res {
        Ok(()) => {
            Config::verge().await.apply();
            if !not_save_file {
                // 分离数据获取和异步调用
                let verge_data = Config::verge().await.data_mut().clone();
                verge_data.save_file().await?;
            }

            Ok(())
        }
        Err(err) => {
            Config::verge().await.discard();
            Err(err)
        }
    }
}
