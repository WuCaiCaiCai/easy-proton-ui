use crate::models::AppConfig;
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::Manager;
use sysinfo::System;

#[tauri::command]
pub async fn launch_proton(config: AppConfig) -> Result<String, String> {
    let game_path = Path::new(&config.game);
    let game_dir = game_path.parent().ok_or("无法解析游戏目录")?;

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
    
    // 查找并关闭可能的游戏进程
    for (pid, process) in system.processes() {
        let name = process.name().to_lowercase();
        
        // 常见的游戏进程名或Wine/Proton相关进程
        if name.contains(".exe") || 
           name.contains("wine") || 
           name.contains("proton") ||
           name.contains("steam") ||
           name.ends_with("64") ||
           name.ends_with("32") {
            
            // 尝试优雅关闭
            if process.kill() {
                closed_count += 1;
                log::info!("已关闭进程: {} (PID: {})", name, pid);
            }
        }
    }

    if closed_count > 0 {
        Ok(format!("已强制关闭 {} 个游戏相关进程", closed_count))
    } else {
        Ok("未找到需要关闭的游戏进程".into())
    }
}
