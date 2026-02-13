use serde::{Deserialize, Serialize};

/**
 * 应用配置结构体
 * 
 * 存储Proton、游戏路径和前缀路径的基本配置
 * 用于持久化存储用户设置
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    /// Proton可执行文件路径
    pub proton: String,
    /// Wine前缀路径（兼容数据目录）
    pub prefix: String,
    /// 游戏可执行文件路径
    pub game: String,
}

/**
 * Gamescope配置结构体
 * 
 * 存储Gamescope相关的所有设置，包括分辨率、FSR、显示选项等
 * 用于通过Gamescope启动游戏时的参数配置
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GamescopeConfig {
    /// 是否启用Gamescope
    pub enabled: bool,
    
    /// 分辨率宽度（像素）
    /// None表示使用游戏原生分辨率
    pub width: Option<u32>,
    
    /// 分辨率高度（像素）
    /// None表示使用游戏原生分辨率
    pub height: Option<u32>,
    
    /// 是否启用FSR（FidelityFX Super Resolution）
    /// AMD的开源超分辨率技术
    pub use_fsr: bool,
    
    /// FSR模式
    /// 可选值: "fsr1", "fsr2", "fsr3", "fsr4"
    /// None表示使用默认模式（FSR1）
    pub fsr_mode: Option<String>,
    
    /// FSR锐度设置 (0-10)
    /// 0: 最柔和, 10: 最锐利
    /// None表示使用默认值（5）
    pub fsr_sharpness: Option<u32>,
    
    /// 是否全屏显示
    pub fullscreen: bool,
    
    /// 是否使用无边框窗口
    pub borderless: bool,
    
    /// 是否启用垂直同步
    pub vsync: bool,
    
    /// FPS限制
    /// None表示不限制FPS
    pub fps_limit: Option<u32>,
}

/**
 * 游戏启动配置结构体
 * 
 * 包含启动游戏所需的所有配置信息
 * 用于传递给启动命令
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameLaunchConfig {
    /// Proton可执行文件路径
    pub proton: String,
    
    /// Wine前缀路径
    pub prefix: String,
    
    /// 游戏可执行文件路径
    pub game: String,
    
    /// Gamescope配置（可选）
    /// 如果为Some且enabled为true，则使用Gamescope启动
    pub gamescope: Option<GamescopeConfig>,
}