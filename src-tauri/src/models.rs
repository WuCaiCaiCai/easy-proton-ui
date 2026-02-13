use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub proton: String, // Proton 路径
    pub prefix: String, // PFX 路径
    pub game: String,   // 游戏 EXE 路径
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GamescopeConfig {
    pub enabled: bool,          // 是否启用gamescope
    pub width: Option<u32>,     // 分辨率宽度
    pub height: Option<u32>,    // 分辨率高度
    pub use_fsr: bool,          // 是否启用FSR
    pub fsr_mode: Option<String>, // FSR模式
    pub fsr_sharpness: Option<u32>, // FSR锐度 (0-10)
    pub fullscreen: bool,       // 是否全屏
    pub borderless: bool,       // 是否无边框
    pub vsync: bool,            // 是否启用垂直同步
    pub fps_limit: Option<u32>, // FPS限制
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameLaunchConfig {
    pub proton: String,
    pub prefix: String,
    pub game: String,
    pub gamescope: Option<GamescopeConfig>,
}
