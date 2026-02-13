use serde::{Deserialize, Serialize};

/**
 * 应用全局配置结构体
 * 
 * 存储 Proton、Wine 前缀和游戏路径的核心配置
 * 用于持久化存储用户设置
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    /// Proton 可执行文件路径
    pub proton: String,
    
    /// Wine 前缀路径（兼容数据目录）
    pub prefix: String,
    
    /// 游戏可执行文件路径
    pub game: String,
}

/**
 * 游戏启动配置结构体
 * 
 * 包含启动游戏所需的配置信息
 * 用于后端 IPC 通信
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameLaunchConfig {
    /// Proton 可执行文件路径
    pub proton: String,
    
    /// Wine 前缀路径
    pub prefix: String,
    
    /// 游戏可执行文件路径
    pub game: String,
}
