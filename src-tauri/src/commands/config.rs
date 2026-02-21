// 重构说明：配置命令通过 AppState 间接访问存储服务，所有阻塞 IO 迁移到 spawn_blocking，避免卡住 runtime。
use crate::{domain::config::AppConfig, state::AppState};

#[tauri::command]
pub async fn save_config(
    state: tauri::State<'_, AppState>,
    config: AppConfig,
) -> Result<(), String> {
    let store = state.config_store().clone();

    tauri::async_runtime::spawn_blocking(move || store.save(&config))
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn load_config(state: tauri::State<'_, AppState>) -> Result<AppConfig, String> {
    let store = state.config_store().clone();

    tauri::async_runtime::spawn_blocking(move || {
        store.load().map(|maybe| maybe.unwrap_or_default())
    })
    .await
    .map_err(|err| err.to_string())?
    .map_err(|err| err.to_string())
}
