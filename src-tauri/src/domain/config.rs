// 重构说明：原 models.rs 迁移到领域层，并新增基本校验/转换逻辑，避免命令层直接处理脏数据。
use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AppConfig {
    pub proton: String,
    pub prefix: String,
    pub game: String,
}

impl AppConfig {
    pub fn is_complete(&self) -> bool {
        !(self.proton.trim().is_empty()
            || self.prefix.trim().is_empty()
            || self.game.trim().is_empty())
    }

    pub fn into_launch_config(self) -> AppResult<GameLaunchConfig> {
        let launch = GameLaunchConfig {
            proton: self.proton,
            prefix: self.prefix,
            game: self.game,
        };
        launch.validate()?;
        Ok(launch)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameLaunchConfig {
    pub proton: String,
    pub prefix: String,
    pub game: String,
}

impl GameLaunchConfig {
    pub fn validate(&self) -> AppResult<()> {
        if self.proton.trim().is_empty() {
            return Err(AppError::InvalidInput("Proton 路径不能为空".into()));
        }
        if self.prefix.trim().is_empty() {
            return Err(AppError::InvalidInput("前缀目录不能为空".into()));
        }
        if self.game.trim().is_empty() {
            return Err(AppError::InvalidInput("游戏可执行文件不能为空".into()));
        }

        if Path::new(&self.game).parent().is_none() {
            return Err(AppError::InvalidInput("无法解析游戏所在目录".into()));
        }

        Ok(())
    }
}
