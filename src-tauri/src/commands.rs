use crate::models::{AppConfig, GamescopeConfig, GameLaunchConfig};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::Manager;
use sysinfo::System;

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

async fn launch_with_gamescope(
    config: &GameLaunchConfig,
    gamescope: &GamescopeConfig,
    game_dir: &Path,
) -> Result<String, String> {
    let mut gamescope_cmd = Command::new("gamescope");
    
    // 添加分辨率参数
    if let (Some(width), Some(height)) = (gamescope.width, gamescope.height) {
        gamescope_cmd.arg("-W").arg(width.to_string());
        gamescope_cmd.arg("-H").arg(height.to_string());
    }
    
    // 添加全屏参数
    if gamescope.fullscreen {
        gamescope_cmd.arg("-f");
    }
    
    // 添加无边框参数
    if gamescope.borderless {
        gamescope_cmd.arg("-b");
    }
    
    // 添加垂直同步参数
    if gamescope.vsync {
        gamescope_cmd.arg("-o");
    }
    
    // 添加FPS限制
    if let Some(fps_limit) = gamescope.fps_limit {
        gamescope_cmd.arg("-r").arg(fps_limit.to_string());
    }
    
    // 添加FSR参数
    if gamescope.use_fsr {
        if let Some(fsr_mode) = &gamescope.fsr_mode {
            match fsr_mode.as_str() {
                "fsr1" => gamescope_cmd.arg("--fsr"),
                "fsr2" => gamescope_cmd.arg("--fsr2"),
                "fsr3" => gamescope_cmd.arg("--fsr3"),
                "fsr4" => gamescope_cmd.arg("--fsr4"),
                _ => gamescope_cmd.arg("--fsr"),
            };
            
            // 添加FSR锐度参数
            if let Some(sharpness) = gamescope.fsr_sharpness {
                gamescope_cmd.arg("--sharpness").arg(sharpness.to_string());
            }
        }
    }
    
    // 添加Proton命令
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

#[tauri::command]
pub async fn save_config(handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = handle.path().app_config_dir().unwrap().join("config.json");
    if let Some(p) = path.parent() { fs::create_dir_all(p).ok(); }
    let json = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn load_config(handle: tauri::AppHandle) -> Result<AppConfig, String> {
    let path = handle.path().app_config_dir().unwrap().join("config.json");
    if !path.exists() {
        return Ok(AppConfig { proton: "".into(), prefix: "".into(), game: "".into() });
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

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
