use crate::{APP_HANDLE, singleton};
use parking_lot::RwLock;
use std::{
    sync::{
        Arc,
        atomic::{AtomicU64, Ordering},
    },
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_plugin_mihomo::{Mihomo, MihomoExt};
use tokio::sync::{mpsc, RwLockReadGuard, RwLockWriteGuard};

use crate::{logging, utils::logging::Type};

/// 不同类型的前端通知
#[derive(Debug, Clone)]
enum FrontendEvent {
    RefreshClash,
    RefreshVerge,
    NoticeMessage { status: String, message: String },
    ProfileChanged { current_profile_id: String },
    TimerUpdated { profile_index: String },
    ProfileUpdateStarted { uid: String },
    ProfileUpdateCompleted { uid: String },
}

/// 事件发送统计和监控
#[derive(Debug, Default)]
struct EventStats {
    total_sent: AtomicU64,
    total_errors: AtomicU64,
    last_error_time: RwLock<Option<Instant>>,
}

/// 存储启动期间的错误消息
#[derive(Debug, Clone)]
struct ErrorMessage {
    status: String,
    message: String,
}

/// 全局前端通知系统
#[derive(Debug)]
struct NotificationSystem {
    sender: Option<mpsc::UnboundedSender<FrontendEvent>>,
    is_running: bool,
    stats: EventStats,
    last_emit_time: RwLock<Instant>,
    emergency_mode: RwLock<bool>,
}

impl Default for NotificationSystem {
    fn default() -> Self {
        Self::new()
    }
}

impl NotificationSystem {
    fn new() -> Self {
        Self {
            sender: None,
            is_running: false,
            stats: EventStats::default(),
            last_emit_time: RwLock::new(Instant::now()),
            emergency_mode: RwLock::new(false),
        }
    }

    /// 启动通知处理任务
    fn start(&mut self) {
        if self.is_running {
            return;
        }

        let (tx, mut rx) = mpsc::unbounded_channel();
        self.sender = Some(tx);
        self.is_running = true;

        *self.last_emit_time.write() = Instant::now();

        crate::process::AsyncHandler::spawn(|| async move {
            let handle = Handle::global();

            while !handle.is_exiting() {
                match tokio::time::timeout(Duration::from_millis(100), rx.recv()).await {
                    Ok(Some(event)) => {
                        let should_skip = {
                            let system_guard = handle.notification_system.read();
                            let Some(system) = system_guard.as_ref() else {
                                continue;
                            };
                            *system.emergency_mode.read() 
                                && matches!(&event, FrontendEvent::NoticeMessage { status, .. } if status == "info")
                        };

                        if should_skip {
                            continue;
                        }

                        if let Some(window) = Handle::get_window() {
                            {
                                let system_guard = handle.notification_system.read();
                                if let Some(system) = system_guard.as_ref() {
                                    *system.last_emit_time.write() = Instant::now();
                                }
                            }

                            let (event_name_str, payload_result) = match event {
                                FrontendEvent::RefreshClash => {
                                    ("verge://refresh-clash-config", Ok(serde_json::json!("yes")))
                                }
                                FrontendEvent::RefreshVerge => {
                                    ("verge://refresh-verge-config", Ok(serde_json::json!("yes")))
                                }
                                FrontendEvent::NoticeMessage { status, message } => {
                                    match serde_json::to_value((status, message)) {
                                        Ok(p) => ("verge://notice-message", Ok(p)),
                                        Err(e) => {
                                            log::error!("Failed to serialize NoticeMessage payload: {e}");
                                            ("verge://notice-message", Err(e))
                                        }
                                    }
                                }
                                FrontendEvent::ProfileChanged { current_profile_id } => {
                                    ("profile-changed", Ok(serde_json::json!(current_profile_id)))
                                }
                                FrontendEvent::TimerUpdated { profile_index } => {
                                    ("verge://timer-updated", Ok(serde_json::json!(profile_index)))
                                }
                                FrontendEvent::ProfileUpdateStarted { uid } => {
                                    ("profile-update-started", Ok(serde_json::json!({ "uid": uid })))
                                }
                                FrontendEvent::ProfileUpdateCompleted { uid } => {
                                    ("profile-update-completed", Ok(serde_json::json!({ "uid": uid })))
                                }
                            };

                            if let Ok(payload) = payload_result {
                                match window.emit(event_name_str, payload) {
                                    Ok(_) => {
                                        let system_guard = handle.notification_system.read();
                                        if let Some(system) = system_guard.as_ref() {
                                            system.stats.total_sent.fetch_add(1, Ordering::Relaxed);
                                        }
                                        log::trace!("Emitted event: {event_name_str}");
                                    }
                                    Err(e) => {
                                        log::warn!("Failed to emit {event_name_str}: {e}");
                                        let system_guard = handle.notification_system.read();
                                        if let Some(system) = system_guard.as_ref() {
                                            system.stats.total_errors.fetch_add(1, Ordering::Relaxed);
                                            *system.stats.last_error_time.write() = Some(Instant::now());

                                            if system.stats.total_errors.load(Ordering::Relaxed) > 10 {
                                                *system.emergency_mode.write() = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        tokio::time::sleep(Duration::from_millis(20)).await;
                    }
                    Ok(None) => break,
                    Err(_) => {}
                }
            }
        });
    }

    /// 发送事件到队列
    fn send_event(&self, event: FrontendEvent) -> bool {
        if *self.emergency_mode.read()
            && let FrontendEvent::NoticeMessage { ref status, .. } = event
            && status == "info"
        {
            log::info!("Skipping info message in emergency mode");
            return false;
        }

        if let Some(sender) = &self.sender {
            match sender.send(event) {
                Ok(_) => true,
                Err(e) => {
                    log::warn!("Failed to send event to notification queue: {e:?}");
                    self.stats.total_errors.fetch_add(1, Ordering::SeqCst);
                    *self.stats.last_error_time.write() = Some(Instant::now());
                    false
                }
            }
        } else {
            log::warn!("Notification system not started, can't send event");
            false
        }
    }

    /// 优雅关闭通知系统
    fn shutdown(&mut self) {
        if !self.is_running {
            return;
        }

        log::info!("NotificationSystem shutdown initiated");
        self.is_running = false;

        if let Some(sender) = self.sender.take() {
            drop(sender);
        }

        log::info!(
            "NotificationSystem shutdown completed. Stats: sent={}, errors={}",
            self.stats.total_sent.load(Ordering::Relaxed),
            self.stats.total_errors.load(Ordering::Relaxed)
        );
    }
}

#[derive(Debug, Clone)]
pub struct Handle {
    pub is_exiting: Arc<RwLock<bool>>,
    startup_errors: Arc<RwLock<Vec<ErrorMessage>>>,
    startup_completed: Arc<RwLock<bool>>,
    notification_system: Arc<RwLock<Option<NotificationSystem>>>,
}

impl Default for Handle {
    fn default() -> Self {
        Self {
            is_exiting: Arc::new(RwLock::new(false)),
            startup_errors: Arc::new(RwLock::new(Vec::new())),
            startup_completed: Arc::new(RwLock::new(false)),
            notification_system: Arc::new(RwLock::new(Some(NotificationSystem::new()))),
        }
    }
}

// Use singleton macro
singleton!(Handle, HANDLE);

impl Handle {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn init(&self) {
        // 如果正在退出，不要重新初始化
        if self.is_exiting() {
            log::debug!("Handle::init called while exiting, skipping initialization");
            return;
        }

        let mut system_opt = self.notification_system.write();
        if let Some(system) = system_opt.as_mut() {
            // 只在未运行时启动
            if !system.is_running {
                system.start();
            } else {
                log::debug!("NotificationSystem already running, skipping start");
            }
        }
    }

    /// 获取 AppHandle
    #[allow(clippy::expect_used)]
    pub fn app_handle() -> &'static AppHandle {
        APP_HANDLE.get().expect("failed to get global app handle")
    }

    pub async fn mihomo() -> RwLockReadGuard<'static, Mihomo> {
        Self::app_handle().mihomo().read().await
    }

    #[allow(unused)]
    pub async fn mihomo_mut() -> RwLockWriteGuard<'static, Mihomo> {
        Self::app_handle().mihomo().write().await
    }

    pub fn get_window() -> Option<WebviewWindow> {
        let app_handle = Self::app_handle();
        let window: Option<WebviewWindow> = app_handle.get_webview_window("main");
        if window.is_none() {
            log::debug!(target:"app", "main window not found");
        }
        window
    }

    pub fn refresh_clash() {
        let handle = Self::global();
        if handle.is_exiting() {
            return;
        }

        let system_opt = handle.notification_system.read();
        if let Some(system) = system_opt.as_ref() {
            system.send_event(FrontendEvent::RefreshClash);
        }
    }

    pub fn refresh_verge() {
        let handle = Self::global();
        if handle.is_exiting() {
            return;
        }

        let system_opt = handle.notification_system.read();
        if let Some(system) = system_opt.as_ref() {
            system.send_event(FrontendEvent::RefreshVerge);
        }
    }

    pub fn notify_profile_changed(profile_id: String) {
        let handle = Self::global();
        if handle.is_exiting() {
            return;
        }

        let system_opt = handle.notification_system.read();
        if let Some(system) = system_opt.as_ref() {
            system.send_event(FrontendEvent::ProfileChanged {
                current_profile_id: profile_id,
            });
        } else {
            log::warn!(
                "Notification system not initialized when trying to send ProfileChanged event."
            );
        }
    }

    pub fn notify_timer_updated(profile_index: String) {
        let handle = Self::global();
        if handle.is_exiting() {
            return;
        }

        let system_opt = handle.notification_system.read();
        if let Some(system) = system_opt.as_ref() {
            system.send_event(FrontendEvent::TimerUpdated { profile_index });
        } else {
            log::warn!(
                "Notification system not initialized when trying to send TimerUpdated event."
            );
        }
    }

    pub fn notify_profile_update_started(uid: String) {
        let handle = Self::global();
        if handle.is_exiting() {
            return;
        }

        let system_opt = handle.notification_system.read();
        if let Some(system) = system_opt.as_ref() {
            system.send_event(FrontendEvent::ProfileUpdateStarted { uid });
        } else {
            log::warn!(
                "Notification system not initialized when trying to send ProfileUpdateStarted event."
            );
        }
    }

    pub fn notify_profile_update_completed(uid: String) {
        let handle = Self::global();
        if handle.is_exiting() {
            return;
        }

        let system_opt = handle.notification_system.read();
        if let Some(system) = system_opt.as_ref() {
            system.send_event(FrontendEvent::ProfileUpdateCompleted { uid });
        } else {
            log::warn!(
                "Notification system not initialized when trying to send ProfileUpdateCompleted event."
            );
        }
    }

    /// 通知前端显示消息队列
    pub fn notice_message<S: Into<String>, M: Into<String>>(status: S, msg: M) {
        let handle = Self::global();
        let status_str = status.into();
        let msg_str = msg.into();

        if !*handle.startup_completed.read() {
            logging!(
                info,
                Type::Frontend,
                "启动过程中发现错误，加入消息队列: {} - {}",
                status_str,
                msg_str
            );

            let mut errors = handle.startup_errors.write();
            errors.push(ErrorMessage {
                status: status_str,
                message: msg_str,
            });
            return;
        }

        if handle.is_exiting() {
            return;
        }

        let system_opt = handle.notification_system.read();
        if let Some(system) = system_opt.as_ref() {
            system.send_event(FrontendEvent::NoticeMessage {
                status: status_str,
                message: msg_str,
            });
        }
    }

    pub fn mark_startup_completed(&self) {
        {
            let mut completed = self.startup_completed.write();
            *completed = true;
        }

        self.send_startup_errors();
    }

    /// 发送启动时累积的所有错误消息
    fn send_startup_errors(&self) {
        let errors = {
            let mut errors = self.startup_errors.write();
            std::mem::take(&mut *errors)
        };

        if errors.is_empty() {
            return;
        }

        logging!(
            info,
            Type::Frontend,
            "发送{}条启动时累积的错误消息",
            errors.len()
        );

        crate::process::AsyncHandler::spawn(|| async move {
            tokio::time::sleep(Duration::from_secs(2)).await;

            let handle = Handle::global();
            
            for error in errors {
                if handle.is_exiting() {
                    break;
                }

                {
                    let system_opt = handle.notification_system.read();
                    if let Some(system) = system_opt.as_ref() {
                        system.send_event(FrontendEvent::NoticeMessage {
                            status: error.status,
                            message: error.message,
                        });
                    }
                }

                tokio::time::sleep(Duration::from_millis(300)).await;
            }
        });
    }

    pub fn set_is_exiting(&self) {
        let mut is_exiting = self.is_exiting.write();
        *is_exiting = true;

        let mut system_opt = self.notification_system.write();
        if let Some(system) = system_opt.as_mut() {
            system.shutdown();
        }
    }

    pub fn is_exiting(&self) -> bool {
        *self.is_exiting.read()
    }
}

#[cfg(target_os = "macos")]
impl Handle {
    pub fn set_activation_policy(&self, policy: tauri::ActivationPolicy) -> Result<(), String> {
        let app_handle = Self::app_handle();
        app_handle
            .set_activation_policy(policy)
            .map_err(|e| e.to_string())
    }

    pub fn set_activation_policy_regular(&self) {
        if let Err(e) = self.set_activation_policy(tauri::ActivationPolicy::Regular) {
            logging!(
                warn,
                Type::Setup,
                "Failed to set regular activation policy: {}",
                e
            );
        }
    }

    pub fn set_activation_policy_accessory(&self) {
        if let Err(e) = self.set_activation_policy(tauri::ActivationPolicy::Accessory) {
            logging!(
                warn,
                Type::Setup,
                "Failed to set accessory activation policy: {}",
                e
            );
        }
    }

    #[allow(dead_code)]
    pub fn set_activation_policy_prohibited(&self) {
        if let Err(e) = self.set_activation_policy(tauri::ActivationPolicy::Prohibited) {
            logging!(
                warn,
                Type::Setup,
                "Failed to set prohibited activation policy: {}",
                e
            );
        }
    }
}
