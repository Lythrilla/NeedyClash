use anyhow::Result;

use crate::{
    config::Config,
    core::{
        CoreManager, Timer, handle,
        hotkey::Hotkey,
        service::{SERVICE_MANAGER, ServiceManager, is_service_ipc_path_exists},
        sysopt,
        tray::Tray,
    },
    logging, logging_error,
    module::lightweight::{auto_lightweight_mode_init, run_once_auto_lightweight},
    process::AsyncHandler,
    utils::{init, logging::Type, server, window_manager::WindowManager},
};

pub mod dns;
pub mod scheme;
pub mod ui;
pub mod window;
pub mod window_script;

pub fn resolve_setup_handle() {
    init_handle();
}

pub fn resolve_setup_sync() {
    AsyncHandler::spawn(|| async {
        AsyncHandler::spawn_blocking(init_scheme);
        AsyncHandler::spawn_blocking(init_embed_server);
    });
}

pub fn resolve_setup_async() {
    let start_time = std::time::Instant::now();
    logging!(
        info,
        Type::Setup,
        "开始执行异步设置任务... 线程ID: {:?}",
        std::thread::current().id()
    );

    AsyncHandler::spawn(|| async {
        #[cfg(not(feature = "tauri-dev"))]
        resolve_setup_logger().await;
        logging!(
            info,
            Type::NeedyClashRev,
            "Version: {}",
            env!("CARGO_PKG_VERSION")
        );

        // 并行执行服务管理器和基础配置初始化
        futures::join!(
            init_service_manager(),
            init_work_config(),
            init_resources(),
        );

        // 快速初始化项，并行执行
        futures::join!(
            init_startup_script(),
            init_hotkey(),
            init_verge_config(),
        );

        // 提前创建窗口，让用户看到界面，减少"未响应"感知
        logging!(info, Type::Setup, "提前创建窗口以改善响应体验");
        init_window().await;

        // 窗口创建后，在后台继续初始化其他组件
        logging!(info, Type::Setup, "窗口已创建，继续后台初始化");

        // 并行执行轻量级任务
        futures::join!(
            init_timer(),
            init_once_auto_lightweight(),
            init_auto_lightweight_mode(),
        );

        // 配置验证
        Config::verify_config_initialization().await;

        // 核心管理器初始化（可能较慢，但窗口已经显示）
        init_core_manager().await;

        // 系统代理设置
        init_system_proxy().await;
        AsyncHandler::spawn_blocking(|| {
            init_system_proxy_guard();
        });

        // 托盘初始化和刷新（放在最后，不阻塞主要功能）
        init_tray().await;
        refresh_tray_menu().await;

        let elapsed = start_time.elapsed();
        logging!(info, Type::Setup, "所有异步设置任务完成，总耗时: {:?}", elapsed);
    });

    let elapsed = start_time.elapsed();
    logging!(info, Type::Setup, "异步设置任务启动完成，耗时: {:?}", elapsed);

    if elapsed.as_secs() > 10 {
        logging!(warn, Type::Setup, "异步设置任务耗时较长({:?})", elapsed);
    }
}

// 其它辅助函数不变
pub async fn resolve_reset_async() -> Result<(), anyhow::Error> {
    logging!(info, Type::Tray, "Resetting system proxy");
    sysopt::Sysopt::global().reset_sysproxy().await?;

    logging!(info, Type::Core, "Stopping core service");
    CoreManager::global().stop_core().await?;

    #[cfg(target_os = "macos")]
    {
        use dns::restore_public_dns;

        logging!(info, Type::System, "Restoring system DNS settings");
        restore_public_dns().await;
    }

    Ok(())
}

pub fn init_handle() {
    logging!(info, Type::Setup, "Initializing app handle...");
    handle::Handle::global().init();
}

pub(super) fn init_scheme() {
    logging!(info, Type::Setup, "Initializing custom URL scheme");
    logging_error!(Type::Setup, init::init_scheme());
}

#[cfg(not(feature = "tauri-dev"))]
pub(super) async fn resolve_setup_logger() {
    logging!(info, Type::Setup, "Initializing global logger...");
    logging_error!(Type::Setup, init::init_logger().await);
}

pub async fn resolve_scheme(param: String) -> Result<()> {
    logging!(info, Type::Setup, "Resolving scheme for param: {}", param);
    logging_error!(Type::Setup, scheme::resolve_scheme(param).await);
    Ok(())
}

pub(super) fn init_embed_server() {
    logging!(info, Type::Setup, "Initializing embedded server...");
    server::embed_server();
}
pub(super) async fn init_resources() {
    logging!(info, Type::Setup, "Initializing resources...");
    logging_error!(Type::Setup, init::init_resources().await);
}

pub(super) async fn init_startup_script() {
    logging!(info, Type::Setup, "Initializing startup script");
    logging_error!(Type::Setup, init::startup_script().await);
}

pub(super) async fn init_timer() {
    logging!(info, Type::Setup, "Initializing timer...");
    logging_error!(Type::Setup, Timer::global().init().await);
}

pub(super) async fn init_hotkey() {
    logging!(info, Type::Setup, "Initializing hotkey...");
    logging_error!(Type::Setup, Hotkey::global().init().await);
}

pub(super) async fn init_once_auto_lightweight() {
    logging!(
        info,
        Type::Lightweight,
        "Running auto lightweight mode check..."
    );
    run_once_auto_lightweight().await;
}

pub(super) async fn init_auto_lightweight_mode() {
    logging!(info, Type::Setup, "Initializing auto lightweight mode...");
    logging_error!(Type::Setup, auto_lightweight_mode_init().await);
}

pub async fn init_work_config() {
    logging!(info, Type::Setup, "Initializing work configuration...");
    logging_error!(Type::Setup, init::init_config().await);
}

pub(super) async fn init_tray() {
    // Check if tray should be disabled via environment variable
    if std::env::var("CLASH_VERGE_DISABLE_TRAY").unwrap_or_default() == "1" {
        logging!(info, Type::Setup, "System tray disabled via --no-tray flag");
        return;
    }

    logging!(info, Type::Setup, "Initializing system tray...");
    logging_error!(Type::Setup, Tray::global().init().await);
}

pub(super) async fn init_verge_config() {
    logging!(info, Type::Setup, "Initializing verge configuration...");
    logging_error!(Type::Setup, Config::init_config().await);
}

pub(super) async fn init_service_manager() {
    logging!(info, Type::Setup, "Initializing service manager...");
    clash_verge_service_ipc::set_config(ServiceManager::config()).await;

    // 减少重试次数和等待时间，避免阻塞窗口响应
    let max_retries = 2; // 从3减少到2
    let mut retry_count = 0;

    while retry_count < max_retries {
        if !is_service_ipc_path_exists() {
            logging!(
                warn,
                Type::Setup,
                "Service IPC path does not exist (attempt {}/{}), waiting for service to start...",
                retry_count + 1,
                max_retries
            );
            retry_count += 1;
            if retry_count < max_retries {
                tokio::time::sleep(tokio::time::Duration::from_millis(300)).await; // 从1000ms减少到300ms
                continue;
            }
            return;
        }

        match SERVICE_MANAGER.lock().await.init().await {
            Ok(_) => {
                logging!(
                    info,
                    Type::Setup,
                    "Service manager initialized successfully"
                );
                logging_error!(Type::Setup, SERVICE_MANAGER.lock().await.refresh().await);
                return;
            }
            Err(e) => {
                logging!(
                    warn,
                    Type::Setup,
                    "Service manager init failed (attempt {}/{}): {}",
                    retry_count + 1,
                    max_retries,
                    e
                );
                retry_count += 1;
                if retry_count < max_retries {
                    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await; // 从1000ms减少到300ms
                }
            }
        }
    }

    logging!(
        info,
        Type::Setup,
        "Service not available after {} attempts, will use Sidecar mode",
        max_retries
    );
}

pub(super) async fn init_core_manager() {
    logging!(info, Type::Setup, "Initializing core manager...");
    logging_error!(Type::Setup, CoreManager::global().init().await);
}

pub(super) async fn init_system_proxy() {
    logging!(info, Type::Setup, "Initializing system proxy...");
    logging_error!(
        Type::Setup,
        sysopt::Sysopt::global().update_sysproxy().await
    );
}

pub(super) fn init_system_proxy_guard() {
    logging!(info, Type::Setup, "Initializing system proxy guard...");
    logging_error!(Type::Setup, sysopt::Sysopt::global().init_guard_sysproxy());
}

pub(super) async fn refresh_tray_menu() {
    logging!(info, Type::Setup, "Refreshing tray menu...");
    logging_error!(Type::Setup, Tray::global().update_part().await);
}

pub(super) async fn init_window() {
    logging!(info, Type::Setup, "Initializing main window...");
    let is_silent_start =
        { Config::verge().await.latest_ref().enable_silent_start }.unwrap_or(false);
    #[cfg(target_os = "macos")]
    {
        if is_silent_start {
            use crate::core::handle::Handle;

            Handle::global().set_activation_policy_accessory();
        }
    }
    WindowManager::create_window(!is_silent_start).await;
}
