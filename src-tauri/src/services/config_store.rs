// 重构说明：封装配置文件的路径解析与读写，替换原命令中零散的 fs 调用，便于未来扩展到多种存储后端。
use crate::{
    domain::config::AppConfig,
    error::{AppError, AppResult},
};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone)]
pub struct ConfigStore {
    path: PathBuf,
}

impl ConfigStore {
    pub fn initialize(app: &AppHandle) -> AppResult<Self> {
        let config_dir = app
            .path()
            .app_config_dir()
            .map_err(|err: tauri::Error| AppError::ConfigPath(err.to_string()))?;

        if !config_dir.exists() {
            fs::create_dir_all(&config_dir)?;
        }

        Ok(Self {
            path: config_dir.join("config.json"),
        })
    }

    pub fn load(&self) -> AppResult<Option<AppConfig>> {
        if !self.path.exists() {
            return Ok(None);
        }

        let raw = fs::read_to_string(&self.path)?;
        let config = serde_json::from_str(&raw)?;
        Ok(Some(config))
    }

    pub fn save(&self, config: &AppConfig) -> AppResult<()> {
        let serialized = serde_json::to_string_pretty(config)?;
        fs::write(&self.path, serialized)?;
        Ok(())
    }

    pub fn path(&self) -> &PathBuf {
        &self.path
    }
}
