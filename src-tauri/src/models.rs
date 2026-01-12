use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub proton: String, // Proton 路径
    pub prefix: String, // PFX 路径
    pub game: String,   // 游戏 EXE 路径
}