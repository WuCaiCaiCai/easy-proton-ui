// 重构说明：集中管理共享依赖（ConfigStore），setup 阶段一次性构建，命令通过 tauri::State 复用。
use crate::{error::AppResult, services::config_store::ConfigStore};
use tauri::AppHandle;

#[derive(Debug, Clone)]
pub struct AppState {
    config_store: ConfigStore,
}

impl AppState {
    pub fn try_new(handle: &AppHandle) -> AppResult<Self> {
        let config_store = ConfigStore::initialize(handle)?;
        Ok(Self { config_store })
    }

    pub fn config_store(&self) -> &ConfigStore {
        &self.config_store
    }
}
