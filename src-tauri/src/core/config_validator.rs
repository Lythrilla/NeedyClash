use anyhow::Result;
use crate::{config::Config, core::handle, logging, utils::{dirs, logging::Type}};
use tauri_plugin_shell::ShellExt;

/// 配置验证器
/// TODO: 集成到配置加载流程中，在应用配置前进行验证
#[allow(dead_code)]
pub struct ConfigValidator;

impl ConfigValidator {
    /// 检查文件是否为脚本文件
    #[allow(dead_code)]
    pub fn is_script_file(path: &str) -> Result<bool> {
        // 先通过扩展名快速判断
        if path.ends_with(".yaml") || path.ends_with(".yml") {
            return Ok(false);
        } else if path.ends_with(".js") {
            return Ok(true);
        }

        // 读取文件内容
        let content = std::fs::read_to_string(path).map_err(|err| {
            logging!(warn, Type::Config, "无法读取文件以检测类型: {}, 错误: {}", path, err);
            anyhow::anyhow!("Failed to read file to detect type: {}", err)
        })?;

        // 检查文件特征
        let has_yaml_features = content.contains(": ")
            || content.contains("#")
            || content.contains("---")
            || content.lines().any(|line| line.trim().starts_with("- "));

        let has_js_features = content.contains("function ")
            || content.contains("const ")
            || content.contains("let ")
            || content.contains("var ")
            || content.contains("//")
            || content.contains("/*")
            || content.contains("export ")
            || content.contains("import ");

        // 决策逻辑
        if has_yaml_features && !has_js_features {
            Ok(false)
        } else if has_js_features && !has_yaml_features {
            Ok(true)
        } else if has_yaml_features && has_js_features {
            // 两种特征都有，更精细判断
            if content.contains("function main")
                || content.contains("module.exports")
                || content.contains("export default")
            {
                return Ok(true);
            }

            let yaml_pattern_count = content.lines().filter(|line| line.contains(": ")).count();
            if yaml_pattern_count > 2 {
                return Ok(false);
            }

            Ok(false)
        } else {
            logging!(debug, Type::Config, "无法确定文件类型，默认当作YAML处理: {}", path);
            Ok(false)
        }
    }

    /// 验证YAML文件语法
    #[allow(dead_code)]
    pub fn validate_yaml_syntax(path: &str) -> Result<(bool, String)> {
        logging!(info, Type::Config, "开始检查YAML文件: {}", path);

        let content = std::fs::read_to_string(path).map_err(|err| {
            let error_msg = format!("Failed to read file: {err}");
            logging!(error, Type::Config, "无法读取文件: {}", error_msg);
            anyhow::anyhow!(error_msg)
        })?;

        match serde_yaml_ng::from_str::<serde_yaml_ng::Value>(&content) {
            Ok(_) => {
                logging!(info, Type::Config, "YAML语法检查通过");
                Ok((true, String::new()))
            }
            Err(err) => {
                let error_msg = format!("YAML syntax error: {err}");
                logging!(error, Type::Config, "YAML语法错误: {}", error_msg);
                Ok((false, error_msg))
            }
        }
    }

    /// 验证JavaScript脚本文件
    #[allow(dead_code)]
    pub fn validate_script_file(path: &str) -> Result<(bool, String)> {
        let content = std::fs::read_to_string(path).map_err(|err| {
            let error_msg = format!("Failed to read script file: {err}");
            logging!(warn, Type::Config, "脚本语法错误: {}", err);
            anyhow::anyhow!(error_msg)
        })?;

        logging!(debug, Type::Config, "验证脚本文件: {}", path);

        use boa_engine::{Context, Source};

        let mut context = Context::default();
        let result = context.eval(Source::from_bytes(&content));

        match result {
            Ok(_) => {
                logging!(debug, Type::Config, "脚本语法验证通过: {}", path);

                // 检查脚本是否包含main函数
                if !content.contains("function main")
                    && !content.contains("const main")
                    && !content.contains("let main")
                {
                    let error_msg = "Script must contain a main function";
                    logging!(warn, Type::Config, "脚本缺少main函数: {}", path);
                    return Ok((false, error_msg.into()));
                }

                Ok((true, String::new()))
            }
            Err(err) => {
                let error_msg = format!("Script syntax error: {err}");
                logging!(warn, Type::Config, "脚本语法错误: {}", err);
                Ok((false, error_msg))
            }
        }
    }

    /// 使用Clash内核验证配置
    #[allow(dead_code)]
    pub async fn validate_with_core(config_path: &str) -> Result<(bool, String)> {
        // 检查程序是否正在退出
        if handle::Handle::global().is_exiting() {
            logging!(info, Type::Core, "应用正在退出，跳过验证");
            return Ok((true, String::new()));
        }

        logging!(info, Type::Config, "开始验证配置文件: {}", config_path);

        let clash_core = Config::verge().await.latest_ref().get_valid_clash_core();
        logging!(info, Type::Config, "使用内核: {}", clash_core);

        let app_handle = handle::Handle::app_handle();
        let app_dir = dirs::app_home_dir()?;
        let app_dir_str = dirs::path_to_str(&app_dir)?;

        let output = app_handle
            .shell()
            .sidecar(clash_core)?
            .args(["-t", "-d", app_dir_str, "-f", config_path])
            .output()
            .await?;

        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);

        let error_keywords = ["FATA", "fatal", "Parse config error", "level=fatal"];
        let has_error = !output.status.success() 
            || error_keywords.iter().any(|&kw| stderr.contains(kw));

        logging!(info, Type::Config, "-------- 验证结果 --------");

        if !stderr.is_empty() {
            logging!(info, Type::Config, "stderr输出:\n{}", stderr);
        }

        if has_error {
            logging!(info, Type::Config, "发现错误，开始处理错误信息");
            let error_msg = if !stdout.is_empty() {
                stdout.into()
            } else if !stderr.is_empty() {
                stderr.into()
            } else if let Some(code) = output.status.code() {
                format!("验证进程异常退出，退出码: {code}")
            } else {
                "验证进程被终止".into()
            };

            logging!(info, Type::Config, "-------- 验证结束 --------");
            Ok((false, error_msg))
        } else {
            logging!(info, Type::Config, "验证成功");
            logging!(info, Type::Config, "-------- 验证结束 --------");
            Ok((true, String::new()))
        }
    }
}


