// 重构说明：统一错误类型，命令/服务层可共享并在最终转换为用户可读字符串，日志定位更统一。
use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("配置路径不可用: {0}")]
    ConfigPath(String),
    #[error("输入非法: {0}")]
    InvalidInput(String),
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON 解析失败: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("进程操作失败: {0}")]
    Process(String),
    #[error("Tauri 错误: {0}")]
    Tauri(#[from] tauri::Error),
}
