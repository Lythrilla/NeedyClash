pub const WINDOW_INITIAL_SCRIPT: &str = r#"
    console.log('[Tauri] 窗口初始化脚本开始执行');

    function createLoadingOverlay() {

        if (document.getElementById('initial-loading-overlay')) {
            console.log('[Tauri] 加载指示器已存在');
            return;
        }

        console.log('[Tauri] 创建加载指示器');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'initial-loading-overlay';
        loadingDiv.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: var(--bg-color, #ffffff);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                z-index: 9999;
                transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                gap: 24px;
            ">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="
                        width: 10px; height: 10px;
                        background: var(--dot-color, #3b82f6);
                        border-radius: 50%;
                        animation: bounce 1s ease-in-out infinite;
                    "></div>
                    <div style="
                        width: 10px; height: 10px;
                        background: var(--dot-color, #3b82f6);
                        border-radius: 50%;
                        animation: bounce 1s ease-in-out 0.15s infinite;
                    "></div>
                    <div style="
                        width: 10px; height: 10px;
                        background: var(--dot-color, #3b82f6);
                        border-radius: 50%;
                        animation: bounce 1s ease-in-out 0.3s infinite;
                    "></div>
                </div>
                <div style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-color, #000000);
                    letter-spacing: 0.3px;
                    opacity: 0.7;
                ">NeedyClash Loading..</div>
            </div>
            
            <style>
                @keyframes bounce {
                    0%, 80%, 100% { 
                        transform: scale(0.8);
                        opacity: 0.5;
                    }
                    40% { 
                        transform: scale(1.2);
                        opacity: 1;
                    }
                }
                
                @media (prefers-color-scheme: dark) {
                    :root { 
                        --bg-color: #000000;
                        --dot-color: #ffffff;
                        --text-color: #ffffff;
                    }
                }
                
                @media (prefers-color-scheme: light) {
                    :root { 
                        --bg-color: #ffffff;
                        --dot-color: #000000;
                        --text-color: #000000;
                    }
                }
            </style>
        `;

        if (document.body) {
            document.body.appendChild(loadingDiv);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body && !document.getElementById('initial-loading-overlay')) {
                    document.body.appendChild(loadingDiv);
                }
            });
        }
    }

    createLoadingOverlay();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createLoadingOverlay);
    } else {
        createLoadingOverlay();
    }

    console.log('[Tauri] 窗口初始化脚本执行完成');
"#;

pub const INITIAL_LOADING_OVERLAY: &str = r"
    const overlay = document.getElementById('initial-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
";
