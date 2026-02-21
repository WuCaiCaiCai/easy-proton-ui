// 重构说明：进程治理命令改为调用服务层 ProcessManager，并把繁重操作放在阻塞线程中执行。
use crate::services::process::ProcessManager;

#[tauri::command]
pub async fn force_close_games() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(ProcessManager::force_close_games)
        .await
        .map_err(|err| err.to_string())?
        .map(|summary| summary.into_user_message())
        .map_err(|err| err.to_string())
}
