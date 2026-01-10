// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
struct AppConfig {
    proton: String, // Proton 脚本路径 (例如 .../proton)
    prefix: String, // PFX 容器目录
    game: String,   // 游戏 EXE 路径
}

// 1. 获取配置文件的存储路径
fn get_config_path(app_handle: &tauri::AppHandle) -> std::path::PathBuf {
    app_handle
        .path()
        .app_config_dir()
        .expect("无法获取配置目录")
        .join("config.json")
}

// 2. 暴露给前端的：保存配置
#[tauri::command]
async fn save_config(handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = get_config_path(&handle);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

// 3. 暴露给前端的：读取配置
#[tauri::command]
async fn load_config(handle: tauri::AppHandle) -> Result<AppConfig, String> {
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

// 4. 【核心功能】启动 Proton
#[tauri::command]
async fn launch_proton(config: AppConfig, envs: String) -> Result<String, String> {
    let game_path = Path::new(&config.game);
    // 自动提取游戏所在的文件夹，解决汉化补丁无法找到资源的问题
    let game_dir = game_path.parent().ok_or("无法解析游戏目录")?;

    let mut cmd = Command::new(&config.proton);
    
    // --- 关键设置 ---
    
    // A. 设置运行目录为游戏本体目录
    cmd.current_dir(game_dir);

    // B. Proton 运行必需的环境变量
    cmd.env("STEAM_COMPAT_DATA_PATH", &config.prefix);
    // 即使没装 Steam，Proton 也需要这个路径来寻找 runtime，通常指向 .steam 根目录
    cmd.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "/home/wucai/.steam/root");

    // C. 解决中文乱码和补丁加载
    cmd.env("LC_ALL", "zh_CN.UTF-8");
    cmd.env("LANG", "zh_CN.UTF-8");
    // 强制加载同目录下的补丁 DLL (dinput8, dsound 等)
    cmd.env("WINEDLLOVERRIDES", "dinput8,dsound,winmm,version,dxgi=n,b");

    // D. 处理用户手动输入的环境变量 (每行一个 KEY=VALUE)
    for line in envs.lines() {
        if let Some((k, v)) = line.split_once('=') {
            cmd.env(k.trim(), v.trim());
        }
    }

    // 执行命令：proton run <exe_path>
    cmd.arg("run").arg(&config.game);

    // 启动并直接返回结果
    match cmd.spawn() {
        Ok(_child) => {
            // 这里加上下划线 _child 告诉编译器：
            // 我们成功启动了游戏，但不需要在 Rust 端继续控制这个进程句柄了
            Ok("游戏已启动".to_string())
        }
        Err(e) => Err(format!("启动失败: {}", e)),
    }
}

// 5. 自动检测 Steam 路径 (解决你之前的警告)
#[tauri::command]
fn detect_steam_root() -> String {
    let home = std::env::var("HOME").unwrap_or_default();
    let paths = [
        format!("{}/.steam/root", home),
        format!("{}/.local/share/Steam", home),
    ];
    for p in paths {
        if Path::new(&p).exists() {
            return p;
        }
    }
    "未找到 Steam".to_string()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            launch_proton,
            save_config,
            load_config,
            detect_steam_root
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}