use anyhow::Result;
use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::{
    config::Config,
    core::handle::Handle,
    logging,
    utils::{logging::Type, permission::check_elevated_privileges},
};

/// TUN 模式状态
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TunStatus {
    /// TUN 已启用
    Enabled,
    /// TUN 已禁用
    Disabled,
    /// TUN 正在启用
    Enabling,
    /// TUN 正在禁用
    Disabling,
    /// TUN 错误状态
    Error(String),
}

impl std::fmt::Display for TunStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TunStatus::Enabled => write!(f, "Enabled"),
            TunStatus::Disabled => write!(f, "Disabled"),
            TunStatus::Enabling => write!(f, "Enabling"),
            TunStatus::Disabling => write!(f, "Disabling"),
            TunStatus::Error(msg) => write!(f, "Error({})", msg),
        }
    }
}

/// TUN 模式管理器
pub struct TunManager {
    status: Arc<RwLock<TunStatus>>,
}

impl Default for TunManager {
    fn default() -> Self {
        Self {
            status: Arc::new(RwLock::new(TunStatus::Disabled)),
        }
    }
}

impl TunManager {
    /// 获取当前 TUN 状态
    pub async fn get_status(&self) -> TunStatus {
        self.status.read().await.clone()
    }

    /// 设置 TUN 状态
    async fn set_status(&self, status: TunStatus) {
        *self.status.write().await = status;
    }

    /// 检查是否可以启用 TUN 模式
    pub async fn can_enable_tun() -> Result<()> {
        check_elevated_privileges()
    }

    /// 启用 TUN 模式
    pub async fn enable_tun(&self) -> Result<()> {
        logging!(info, Type::System, "开始启用 TUN 模式");

        // 检查是否可以启用
        Self::can_enable_tun().await?;

        // 设置状态为正在启用
        self.set_status(TunStatus::Enabling).await;

        // 应用配置
        if let Err(err) = self.apply_tun_config(true).await {
            let error_msg = format!("启用 TUN 模式失败: {}", err);
            logging!(error, Type::System, "{}", error_msg);
            self.set_status(TunStatus::Error(error_msg.clone())).await;
            return Err(anyhow::anyhow!(error_msg));
        }

        self.set_status(TunStatus::Enabled).await;
        logging!(info, Type::System, "TUN 模式已成功启用");
        Ok(())
    }

    /// 禁用 TUN 模式
    pub async fn disable_tun(&self) -> Result<()> {
        logging!(info, Type::System, "开始禁用 TUN 模式");

        // 设置状态为正在禁用
        self.set_status(TunStatus::Disabling).await;

        // 应用配置
        if let Err(err) = self.apply_tun_config(false).await {
            let error_msg = format!("禁用 TUN 模式失败: {}", err);
            logging!(error, Type::System, "{}", error_msg);
            self.set_status(TunStatus::Error(error_msg.clone())).await;
            return Err(anyhow::anyhow!(error_msg));
        }

        self.set_status(TunStatus::Disabled).await;
        logging!(info, Type::System, "TUN 模式已成功禁用");
        Ok(())
    }

    /// 应用 TUN 配置到 Clash 核心
    async fn apply_tun_config(&self, enable: bool) -> Result<()> {
        use tokio::time::{Duration, timeout};

        // 配置超时时间常量
        const CONFIG_TIMEOUT_SECS: u64 = 10;
        const CONFIG_STABILIZATION_MS: u64 = 100;

        // 构建 TUN 配置
        let tun_config = serde_json::json!({
            "tun": {
                "enable": enable
            }
        });

        // 通过 Handle 应用配置（带超时保护）
        timeout(
            Duration::from_secs(CONFIG_TIMEOUT_SECS),
            Handle::mihomo().await.patch_base_config(&tun_config),
        )
        .await
        .map_err(|_| anyhow::anyhow!("TUN 配置应用超时"))?
        .map_err(|e| anyhow::anyhow!("TUN 配置应用失败: {}", e))?;

        // 等待配置生效
        tokio::time::sleep(Duration::from_millis(CONFIG_STABILIZATION_MS)).await;

        Ok(())
    }

    /// 同步 TUN 状态到配置
    pub async fn sync_tun_status(&self) -> Result<()> {
        let verge_config = Config::verge().await;
        let enable_tun = verge_config.latest_ref().enable_tun_mode.unwrap_or(false);
        drop(verge_config);

        let current_status = self.get_status().await;

        // 如果配置和状态不一致，更新状态
        let should_be_enabled = matches!(current_status, TunStatus::Enabled);
        if enable_tun != should_be_enabled {
            logging!(
                info,
                Type::System,
                "检测到 TUN 状态不一致，正在同步: config={}, status={:?}",
                enable_tun,
                current_status
            );

            if enable_tun {
                self.enable_tun().await?;
            } else {
                self.disable_tun().await?;
            }
        }

        Ok(())
    }

    /// 强制重新应用 TUN 配置
    pub async fn reapply_tun(&self) -> Result<()> {
        let verge_config = Config::verge().await;
        let enable_tun = verge_config.latest_ref().enable_tun_mode.unwrap_or(false);
        drop(verge_config);

        logging!(
            info,
            Type::System,
            "强制重新应用 TUN 配置: enable={}",
            enable_tun
        );

        if enable_tun {
            self.enable_tun().await
        } else {
            self.disable_tun().await
        }
    }
}

/// 全局 TUN 管理器实例
pub static TUN_MANAGER: Lazy<TunManager> = Lazy::new(TunManager::default);
