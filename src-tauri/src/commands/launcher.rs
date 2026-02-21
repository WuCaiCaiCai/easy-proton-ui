// 重构说明：命令本身只负责调度与错误映射，阻塞启动逻辑封装到服务层并在后台线程执行。
use crate::{
    domain::config::GameLaunchConfig,
    services::proton::{LaunchSummary, ProtonLauncher},
};

#[tauri::command]
pub async fn launch_proton(config: GameLaunchConfig) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || ProtonLauncher::launch(config))
        .await
        .map_err(|err| err.to_string())?
        .map(LaunchSummary::into_user_message)
        .map_err(|err| err.to_string())
}
