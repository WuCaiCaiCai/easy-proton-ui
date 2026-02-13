use crate::models::{AppConfig, GamescopeConfig, GameLaunchConfig};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::Manager;
use sysinfo::System;

/**
 * 启动Proton游戏
 * 
 * 根据配置启动游戏，支持普通Proton启动和Gamescope启动两种模式
 * 
 * @param config - 游戏启动配置，包含Proton路径、游戏路径、前缀路径和Gamescope配置
 * @return Result<String, String> - 成功返回启动消息，失败返回错误信息
 */
#[tauri::command]
pub async fn launch_proton(config: GameLaunchConfig) -> Result<String, String> {
    let game_path = Path::new(&config.game);
    let game_dir = game_path.parent().ok_or("无法解析游戏目录")?;

    // 检查gamescope是否可用
    let gamescope_available = Command::new("which")
        .arg("gamescope")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false);

    // 如果有gamescope配置且可用，则使用gamescope启动
    if let Some(gamescope) = &config.gamescope {
        if gamescope.enabled && gamescope_available {
            return launch_with_gamescope(&config, gamescope, game_dir).await;
        }
    }

    // 否则使用普通Proton启动
    launch_with_proton(&config, game_dir).await
}

/**
 * 使用普通Proton启动游戏
 * 
 * 构建基本的Proton启动命令，设置必要的环境变量
 * 
 * @param config - 游戏启动配置
 * @param game_dir - 游戏所在目录
 * @return Result<String, String> - 启动结果
 */
async fn launch_with_proton(config: &GameLaunchConfig, game_dir: &Path) -> Result<String, String> {
    let mut cmd = Command::new(&config.proton);
    cmd.current_dir(game_dir);
    cmd.env("STEAM_COMPAT_DATA_PATH", &config.prefix);
    cmd.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "~/.steam/root");
    cmd.env("LC_ALL", "zh_CN.UTF-8");
    cmd.arg("run").arg(&config.game);

    match cmd.spawn() {
        Ok(_) => Ok("游戏已启动".into()),
        Err(e) => Err(format!("启动失败: {}", e)),
    }
}

/**
 * 使用Gamescope启动游戏
 * 
 * 构建Gamescope命令，包含分辨率、FSR、显示设置等参数
 * Gamescope是一个Wayland合成器，提供游戏缩放和合成功能
 * 
 * @param config - 游戏启动配置
 * @param gamescope - Gamescope配置
 * @param game_dir - 游戏所在目录
 * @return Result<String, String> - 启动结果
 */
async fn launch_with_gamescope(
    config: &GameLaunchConfig,
    gamescope: &GamescopeConfig,
    game_dir: &Path,
) -> Result<String, String> {
    let mut gamescope_cmd = Command::new("gamescope");
    
    // 添加分辨率参数
    // -W: 宽度, -H: 高度
    if let (Some(width), Some(height)) = (gamescope.width, gamescope.height) {
        gamescope_cmd.arg("-W").arg(width.to_string());
        gamescope_cmd.arg("-H").arg(height.to_string());
    }
    
    // 添加全屏参数
    // -f: 全屏模式
    if gamescope.fullscreen {
        gamescope_cmd.arg("-f");
    }
    
    // 添加无边框参数
    // -b: 无边框窗口
    if gamescope.borderless {
        gamescope_cmd.arg("-b");
    }
    
    // 添加垂直同步参数
    // -o: 启用垂直同步
    if gamescope.vsync {
        gamescope_cmd.arg("-o");
    }
    
    // 添加FPS限制
    // -r: FPS限制
    if let Some(fps_limit) = gamescope.fps_limit {
        gamescope_cmd.arg("-r").arg(fps_limit.to_string());
    }
    
    // 添加FSR参数
    if gamescope.use_fsr {
        // 根据FSR模式添加对应的参数
        // --fsr: FSR 1.0
        // --fsr2: FSR 2.0
        // --fsr3: FSR 3.0 (包含帧生成)
        // --fsr4: FSR 4.0 (最新版本)
        match gamescope.fsr_mode.as_deref() {
            Some("fsr1") => gamescope_cmd.arg("--fsr"),
            Some("fsr2") => gamescope_cmd.arg("--fsr2"),
            Some("fsr3") => gamescope_cmd.arg("--fsr3"),
            Some("fsr4") => gamescope_cmd.arg("--fsr4"),
            // 默认使用FSR1，兼容性最好
            _ => gamescope_cmd.arg("--fsr"),
        };
        
        // 添加FSR锐度参数
        // --sharpness: FSR锐度 (0-10)
        if let Some(sharpness) = gamescope.fsr_sharpness {
            gamescope_cmd.arg("--sharpness").arg(sharpness.to_string());
        }
    }
    
    // 添加Proton命令
    // --: 分隔符，后面的参数传递给子进程
    gamescope_cmd.arg("--");
    gamescope_cmd.arg(&config.proton);
    gamescope_cmd.current_dir(game_dir);
    gamescope_cmd.env("STEAM_COMPAT_DATA_PATH", &config.prefix);
    gamescope_cmd.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "~/.steam/root");
    gamescope_cmd.env("LC_ALL", "zh_CN.UTF-8");
    gamescope_cmd.arg("run").arg(&config.game);

    match gamescope_cmd.spawn() {
        Ok(_) => Ok("游戏已通过Gamescope启动".into()),
        Err(e) => Err(format!("Gamescope启动失败: {}", e)),
    }
}

/**
 * 保存应用配置
 * 
 * 将应用配置保存到JSON文件中，用于持久化存储
 * 
 * @param handle - Tauri应用句柄
 * @param config - 应用配置
 * @return Result<(), String> - 保存结果
 */
#[tauri::command]
pub async fn save_config(handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = handle.path().app_config_dir().unwrap().join("config.json");
    if let Some(p) = path.parent() { fs::create_dir_all(p).ok(); }
    let json = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

/**
 * 加载应用配置
 * 
 * 从JSON文件中加载应用配置，如果文件不存在则返回默认配置
 * 
 * @param handle - Tauri应用句柄
 * @return Result<AppConfig, String> - 加载的配置或错误
 */
#[tauri::command]
pub async fn load_config(handle: tauri::AppHandle) -> Result<AppConfig, String> {
    let path = handle.path().app_config_dir().unwrap().join("config.json");
    if !path.exists() {
        return Ok(AppConfig { proton: "".into(), prefix: "".into(), game: "".into() });
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

/**
 * 强制关闭游戏进程
 * 
 * 查找并关闭所有可能的游戏进程，用于处理游戏卡死或异常情况
 * 使用sysinfo库扫描系统进程，识别游戏相关进程并关闭
 * 
 * @return Result<String, String> - 关闭结果信息
 */
#[tauri::command]
pub async fn force_close_games() -> Result<String, String> {
    let mut system = System::new_all();
    system.refresh_all();

    let mut closed_count = 0;
    
    // 获取当前进程ID，避免关闭自己
    let current_pid = std::process::id();
    
    // 查找并关闭可能的游戏进程
    for (pid, process) in system.processes() {
        // 跳过当前进程（Easy Proton 软件本身）
        if pid.as_u32() == current_pid {
            continue;
        }
        
        let name = process.name().to_lowercase();
        
        // 更精确的游戏进程识别
        // 1. 排除系统关键进程
        if name.contains("systemd") || 
           name.contains("dbus") || 
           name.contains("pulseaudio") ||
           name.contains("xorg") ||
           name.contains("gnome") ||
           name.contains("kde") ||
           name.contains("easy-proton") ||  // 排除软件本身
           name.contains("tauri") {          // 排除 Tauri 相关进程
            continue;
        }
        
        // 2. 识别游戏相关进程
        let is_game_process = 
            // Windows 可执行文件
            name.ends_with(".exe") ||
            // Wine/Proton 相关进程
            (name.contains("wine") && !name.contains("wineserver")) ||
            name.contains("proton") ||
            // Steam 游戏进程
            (name.contains("steam") && name.contains("game")) ||
            // 常见的游戏进程名模式
            name.contains("game") ||
            name.contains("hl2") ||
            name.contains("dota") ||
            name.contains("csgo") ||
            name.contains("tf2") ||
            // 64位/32位可执行文件
            (name.ends_with("64") && name.len() > 2) ||
            (name.ends_with("32") && name.len() > 2);
        
        if is_game_process {
            // 尝试优雅关闭
            if process.kill() {
                closed_count += 1;
                log::info!("已关闭游戏进程: {} (PID: {})", name, pid);
            } else {
                log::warn!("无法关闭进程: {} (PID: {})", name, pid);
            }
        }
    }

    if closed_count > 0 {
        Ok(format!("已强制关闭 {} 个游戏进程", closed_count))
    } else {
        Ok("未找到需要关闭的游戏进程".into())
    }
}