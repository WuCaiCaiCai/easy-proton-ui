use crate::models::AppConfig; // 引用上面的模型
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::Manager;

// 获取配置文件的路径
fn get_config_path(app_handle: &tauri::AppHandle) -> std::path::PathBuf {
    app_handle
        .path()
        .app_config_dir()
        .expect("无法获取配置目录")
        .join("config.json")
}

#[tauri::command]
pub async fn save_config(handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = get_config_path(&handle);
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let json = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn load_config(handle: tauri::AppHandle) -> Result<AppConfig, String> {
    let path = get_config_path(&handle);
    if !path.exists() {
        return Ok(AppConfig {
            proton: "".into(),
            prefix: "".into(),
            game: "".into(),
        });
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn launch_proton(config: AppConfig, envs: String) -> Result<String, String> {
    let game_path = Path::new(&config.game);
    let game_dir = game_path.parent().ok_or("无法解析游戏目录")?;

    println!("正在启动: {:?}", config.game);

    let mut cmd = Command::new(&config.proton);
    cmd.current_dir(game_dir);
    cmd.env("STEAM_COMPAT_DATA_PATH", &config.prefix);
    cmd.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "~/.steam/root");
    cmd.env("LC_ALL", "zh_CN.UTF-8");
    
    // 处理用户自定义环境变量
    for line in envs.lines() {
        if let Some((k, v)) = line.split_once('=') {
            cmd.env(k.trim(), v.trim());
        }
    }

    cmd.arg("run").arg(&config.game);

    match cmd.spawn() {
        Ok(_) => Ok("游戏进程已启动".into()),
        Err(e) => Err(format!("启动失败: {}", e)),
    }
}