use crate::{
    config::{Config, IVerge},
    core::{CoreManager, handle, hotkey, sysopt, tray},
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

// Define update flags as bitflags for better performance
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct UpdateFlags(u32);

impl UpdateFlags {
    const RESTART_CORE: Self = Self(1 << 0);
    const CLASH_CONFIG: Self = Self(1 << 1);
    const VERGE_CONFIG: Self = Self(1 << 2);
    const LAUNCH: Self = Self(1 << 3);
    const SYS_PROXY: Self = Self(1 << 4);
    const SYSTRAY_ICON: Self = Self(1 << 5);
    const HOTKEY: Self = Self(1 << 6);
    const SYSTRAY_MENU: Self = Self(1 << 7);
    const SYSTRAY_TOOLTIP: Self = Self(1 << 8);
    const SYSTRAY_CLICK_BEHAVIOR: Self = Self(1 << 9);
    const LIGHT_WEIGHT: Self = Self(1 << 10);

    const fn empty() -> Self {
        Self(0)
    }

    const fn contains(&self, other: Self) -> bool {
        (self.0 & other.0) == other.0
    }
}

impl std::ops::BitOrAssign for UpdateFlags {
    fn bitor_assign(&mut self, rhs: Self) {
        self.0 |= rhs.0;
    }
}

impl std::ops::BitOr for UpdateFlags {
    type Output = Self;

    fn bitor(self, rhs: Self) -> Self::Output {
        Self(self.0 | rhs.0)
    }
}

/// Patch Verge configuration
pub async fn patch_verge(patch: IVerge, not_save_file: bool) -> Result<()> {
    Config::verge()
        .await
        .draft_mut()
        .patch_config(patch.clone());

    // 提取配置项（避免重复访问 patch）
    let tun_mode = patch.enable_tun_mode;
    let auto_launch = patch.enable_auto_launch;
    let system_proxy = patch.enable_system_proxy;
    let pac = patch.proxy_auto_config.is_some();
    let pac_content = patch.pac_file_content.is_some();
    let proxy_bypass = patch.system_proxy_bypass.is_some();
    let language = patch.language.is_some();
    let mixed_port = patch.verge_mixed_port.is_some();
    #[cfg(target_os = "macos")]
    let tray_icon = patch.tray_icon.is_some();
    #[cfg(not(target_os = "macos"))]
    let tray_icon = false;
    let common_tray_icon = patch.common_tray_icon.is_some();
    let sysproxy_tray_icon = patch.sysproxy_tray_icon.is_some();
    let tun_tray_icon = patch.tun_tray_icon.is_some();
    #[cfg(not(target_os = "windows"))]
    let redir_enabled = patch.verge_redir_enabled.is_some();
    #[cfg(not(target_os = "windows"))]
    let redir_port = patch.verge_redir_port.is_some();
    #[cfg(target_os = "linux")]
    let tproxy_enabled = patch.verge_tproxy_enabled.is_some();
    #[cfg(target_os = "linux")]
    let tproxy_port = patch.verge_tproxy_port.is_some();
    let socks_enabled = patch.verge_socks_enabled.is_some();
    let socks_port = patch.verge_socks_port.is_some();
    let http_enabled = patch.verge_http_enabled.is_some();
    let http_port = patch.verge_port.is_some();
    let enable_tray_speed = patch.enable_tray_speed.is_some();
    let enable_tray_icon = patch.enable_tray_icon.is_some();
    let enable_global_hotkey = patch.enable_global_hotkey;
    let tray_event = patch.tray_event.is_some();
    let home_cards = patch.home_cards.is_some();
    let enable_auto_light_weight = patch.enable_auto_light_weight_mode;
    let enable_external_controller = patch.enable_external_controller.is_some();
    let hotkeys = patch.hotkeys.is_some();
    let res: std::result::Result<(), anyhow::Error> = {
        // Initialize with no flags set
        let mut update_flags = UpdateFlags::empty();

        // Build update flags based on configuration changes
        if tun_mode.is_some() {
            update_flags |= UpdateFlags::CLASH_CONFIG
                | UpdateFlags::SYSTRAY_MENU
                | UpdateFlags::SYSTRAY_TOOLTIP
                | UpdateFlags::SYSTRAY_ICON;
        }
        if enable_global_hotkey.is_some() || home_cards {
            update_flags |= UpdateFlags::VERGE_CONFIG;
        }
        #[cfg(not(target_os = "windows"))]
        if redir_enabled || redir_port {
            update_flags |= UpdateFlags::RESTART_CORE;
        }
        #[cfg(target_os = "linux")]
        if tproxy_enabled || tproxy_port {
            update_flags |= UpdateFlags::RESTART_CORE;
        }
        if socks_enabled
            || http_enabled
            || socks_port
            || http_port
            || mixed_port
            || enable_external_controller
        {
            update_flags |= UpdateFlags::RESTART_CORE;
        }
        if auto_launch.is_some() {
            update_flags |= UpdateFlags::LAUNCH;
        }

        if system_proxy.is_some() {
            update_flags |= UpdateFlags::SYS_PROXY
                | UpdateFlags::SYSTRAY_MENU
                | UpdateFlags::SYSTRAY_TOOLTIP
                | UpdateFlags::SYSTRAY_ICON;
        }

        if proxy_bypass || pac_content || pac {
            update_flags |= UpdateFlags::SYS_PROXY;
        }

        if language {
            update_flags |= UpdateFlags::SYSTRAY_MENU;
        }
        if common_tray_icon
            || sysproxy_tray_icon
            || tun_tray_icon
            || tray_icon
            || enable_tray_speed
            || enable_tray_icon
        {
            update_flags |= UpdateFlags::SYSTRAY_ICON;
        }

        if hotkeys {
            update_flags |= UpdateFlags::HOTKEY | UpdateFlags::SYSTRAY_MENU;
        }

        if tray_event {
            update_flags |= UpdateFlags::SYSTRAY_CLICK_BEHAVIOR;
        }

        if enable_auto_light_weight.is_some() {
            update_flags |= UpdateFlags::LIGHT_WEIGHT;
        }

        // Process updates based on flags
        if update_flags.contains(UpdateFlags::RESTART_CORE) {
            Config::generate().await?;
            CoreManager::global().restart_core().await?;
        }
        if update_flags.contains(UpdateFlags::CLASH_CONFIG) {
            CoreManager::global().update_config().await?;
            handle::Handle::refresh_clash();

            // 如果是 TUN 模式更改，使用 TUN Manager 处理
            if tun_mode.is_some() {
                use crate::core::tun_manager::TUN_MANAGER;
                if let Err(err) = TUN_MANAGER.sync_tun_status().await {
                    logging!(error, Type::System, "同步 TUN 状态失败: {}", err);
                }
            }
        }
        if update_flags.contains(UpdateFlags::VERGE_CONFIG) {
            Config::verge().await.draft_mut().enable_global_hotkey = enable_global_hotkey;
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
            if enable_auto_light_weight.unwrap_or(false) {
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
