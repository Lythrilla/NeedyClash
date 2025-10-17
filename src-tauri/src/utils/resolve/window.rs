use tauri::WebviewWindow;

use crate::{
    config::Config,
    core::handle,
    logging_error,
    utils::{
        logging::Type,
        resolve::window_script::{INITIAL_LOADING_OVERLAY, WINDOW_INITIAL_SCRIPT},
    },
};

// 定义默认窗口尺寸常量
const DEFAULT_WIDTH: f64 = 940.0;
const DEFAULT_HEIGHT: f64 = 700.0;

const MINIMAL_WIDTH: f64 = 520.0;
const MINIMAL_HEIGHT: f64 = 520.0;

pub async fn build_new_window() -> Result<WebviewWindow, String> {
    let app_handle = handle::Handle::app_handle();

    // 读取配置以确定是否使用系统标题栏
    let use_system_titlebar = Config::verge()
        .await
        .latest_ref()
        .window_use_system_titlebar
        .unwrap_or(false);

    match tauri::WebviewWindowBuilder::new(
        app_handle,
        "main", /* the unique window label */
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("NeedyClash")
    .center()
    .decorations(use_system_titlebar) // 根据配置决定是否使用系统标题栏
    .fullscreen(false)
    .inner_size(DEFAULT_WIDTH, DEFAULT_HEIGHT)
    .min_inner_size(MINIMAL_WIDTH, MINIMAL_HEIGHT)
    .visible(true)
    .initialization_script(WINDOW_INITIAL_SCRIPT)
    .build()
    {
        Ok(window) => {
            logging_error!(Type::Window, window.eval(INITIAL_LOADING_OVERLAY));
            Ok(window)
        }
        Err(e) => Err(e.to_string()),
    }
}
