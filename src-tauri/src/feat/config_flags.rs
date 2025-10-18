use crate::config::IVerge;

/// 配置更新标志位
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct UpdateFlags(u32);

impl UpdateFlags {
    pub const RESTART_CORE: Self = Self(1 << 0);
    pub const CLASH_CONFIG: Self = Self(1 << 1);
    pub const VERGE_CONFIG: Self = Self(1 << 2);
    pub const LAUNCH: Self = Self(1 << 3);
    pub const SYS_PROXY: Self = Self(1 << 4);
    pub const SYSTRAY_ICON: Self = Self(1 << 5);
    pub const HOTKEY: Self = Self(1 << 6);
    pub const SYSTRAY_MENU: Self = Self(1 << 7);
    pub const SYSTRAY_TOOLTIP: Self = Self(1 << 8);
    pub const SYSTRAY_CLICK_BEHAVIOR: Self = Self(1 << 9);
    pub const LIGHT_WEIGHT: Self = Self(1 << 10);

    pub const fn empty() -> Self {
        Self(0)
    }

    pub const fn contains(&self, other: Self) -> bool {
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

/// 分析配置补丁，返回需要更新的标志
pub fn analyze_patch(patch: &IVerge) -> UpdateFlags {
    let mut flags = UpdateFlags::empty();

    // TUN模式相关
    if patch.enable_tun_mode.is_some() {
        flags |= UpdateFlags::CLASH_CONFIG
            | UpdateFlags::SYSTRAY_MENU
            | UpdateFlags::SYSTRAY_TOOLTIP
            | UpdateFlags::SYSTRAY_ICON;
    }

    // 全局热键和首页卡片
    if patch.enable_global_hotkey.is_some() || patch.home_cards.is_some() {
        flags |= UpdateFlags::VERGE_CONFIG;
    }

    // 端口配置
    #[cfg(not(target_os = "windows"))]
    if patch.verge_redir_enabled.is_some() || patch.verge_redir_port.is_some() {
        flags |= UpdateFlags::RESTART_CORE;
    }

    #[cfg(target_os = "linux")]
    if patch.verge_tproxy_enabled.is_some() || patch.verge_tproxy_port.is_some() {
        flags |= UpdateFlags::RESTART_CORE;
    }

    if patch.verge_socks_enabled.is_some()
        || patch.verge_http_enabled.is_some()
        || patch.verge_socks_port.is_some()
        || patch.verge_port.is_some()
        || patch.verge_mixed_port.is_some()
        || patch.enable_external_controller.is_some()
    {
        flags |= UpdateFlags::RESTART_CORE;
    }

    // 自动启动
    if patch.enable_auto_launch.is_some() {
        flags |= UpdateFlags::LAUNCH;
    }

    // 系统代理
    if patch.enable_system_proxy.is_some() {
        flags |= UpdateFlags::SYS_PROXY
            | UpdateFlags::SYSTRAY_MENU
            | UpdateFlags::SYSTRAY_TOOLTIP
            | UpdateFlags::SYSTRAY_ICON;
    }

    // 代理配置
    if patch.system_proxy_bypass.is_some()
        || patch.pac_file_content.is_some()
        || patch.proxy_auto_config.is_some()
    {
        flags |= UpdateFlags::SYS_PROXY;
    }

    // 语言设置
    if patch.language.is_some() {
        flags |= UpdateFlags::SYSTRAY_MENU;
    }

    // 托盘图标
    #[cfg(target_os = "macos")]
    let tray_icon_changed = patch.tray_icon.is_some();
    #[cfg(not(target_os = "macos"))]
    let tray_icon_changed = false;

    if tray_icon_changed
        || patch.common_tray_icon.is_some()
        || patch.sysproxy_tray_icon.is_some()
        || patch.tun_tray_icon.is_some()
        || patch.enable_tray_speed.is_some()
        || patch.enable_tray_icon.is_some()
    {
        flags |= UpdateFlags::SYSTRAY_ICON;
    }

    // 热键
    if patch.hotkeys.is_some() {
        flags |= UpdateFlags::HOTKEY | UpdateFlags::SYSTRAY_MENU;
    }

    // 托盘事件
    if patch.tray_event.is_some() {
        flags |= UpdateFlags::SYSTRAY_CLICK_BEHAVIOR;
    }

    // 轻量模式
    if patch.enable_auto_light_weight_mode.is_some() {
        flags |= UpdateFlags::LIGHT_WEIGHT;
    }

    flags
}


