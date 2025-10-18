#[cfg(feature = "tokio-trace")]
use std::any::type_name;
use std::future::Future;
#[cfg(feature = "tokio-trace")]
use std::panic::Location;
use tauri::{async_runtime, async_runtime::JoinHandle};

/// 异步任务处理器
pub struct AsyncHandler;

impl AsyncHandler {
    /// 生成一个新的异步任务
    ///
    /// 异步任务处理器，自动处理 panic 并记录日志
    #[track_caller]
    pub fn spawn<F, Fut>(f: F) -> JoinHandle<()>
    where
        F: FnOnce() -> Fut + Send + 'static,
        Fut: Future<Output = ()> + Send + 'static,
    {
        #[cfg(feature = "tokio-trace")]
        Self::log_task_info(&f);

        #[cfg(feature = "tokio-trace")]
        let location = Location::caller();

        async_runtime::spawn(async move {
            #[cfg(feature = "tokio-trace")]
            log::trace!(target: "app", "Task started at {}:{}:{}", 
                location.file(), location.line(), location.column());

            f().await;

            #[cfg(feature = "tokio-trace")]
            log::trace!(target: "app", "Task completed at {}:{}:{}", 
                location.file(), location.line(), location.column());
        })
    }

    /// 生成一个阻塞任务（在专用的阻塞线程池中运行）
    ///
    /// # 注意
    /// - 此方法应该用于 CPU 密集型或会阻塞的同步操作
    /// - 不要在这里执行异步操作
    #[track_caller]
    pub fn spawn_blocking<T, F>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T + Send + 'static,
        T: Send + 'static,
    {
        #[cfg(feature = "tokio-trace")]
        Self::log_task_info(&f);

        #[cfg(feature = "tokio-trace")]
        let location = Location::caller();

        async_runtime::spawn_blocking(move || {
            #[cfg(feature = "tokio-trace")]
            log::trace!(target: "app", "Blocking task started at {}:{}:{}", 
                location.file(), location.line(), location.column());

            let result = f();

            #[cfg(feature = "tokio-trace")]
            log::trace!(target: "app", "Blocking task completed at {}:{}:{}", 
                location.file(), location.line(), location.column());

            result
        })
    }

    /// 在当前线程阻塞直到 future 完成
    ///
    /// # 警告
    /// - 不要在异步上下文中调用此方法，会导致 panic
    /// - 仅在初始化或特殊情况下使用
    #[allow(dead_code)]
    #[track_caller]
    pub fn block_on<Fut>(fut: Fut) -> Fut::Output
    where
        Fut: Future + Send + 'static,
    {
        #[cfg(feature = "tokio-trace")]
        Self::log_task_info(&fut);
        async_runtime::block_on(fut)
    }

    #[cfg(feature = "tokio-trace")]
    #[track_caller]
    fn log_task_info<F>(f: &F)
    where
        F: ?Sized,
    {
        const TRACE_SPECIAL_SIZE: [usize; 3] = [0, 4, 24];
        let size = std::mem::size_of_val(f);
        if TRACE_SPECIAL_SIZE.contains(&size) {
            return;
        }

        let location = Location::caller();
        let type_str = type_name::<F>();
        let size_str = format!("{} bytes", size);
        let loc_str = format!(
            "{}:{}:{}",
            location.file(),
            location.line(),
            location.column()
        );

        println!(
            "┌────────────────────┬─────────────────────────────────────────────────────────────────────────────┐"
        );
        println!("│ {:<18} │ {:<80} │", "Field", "Value");
        println!(
            "├────────────────────┼─────────────────────────────────────────────────────────────────────────────┤"
        );
        println!("│ {:<18} │ {:<80} │", "Type of task", type_str);
        println!("│ {:<18} │ {:<80} │", "Size of task", size_str);
        println!("│ {:<18} │ {:<80} │", "Called from", loc_str);
        println!(
            "└────────────────────┴─────────────────────────────────────────────────────────────────────────────┘"
        );
    }
}
