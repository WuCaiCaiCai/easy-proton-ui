use crate::models::{AppConfig, GameLaunchConfig};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::Manager;
use sysinfo::System;

// ============================================================================
// 游戏启动命令
// ============================================================================

/// 启动 Proton 游戏
/// 
/// # 参数
/// - `config`: 游戏启动配置（Proton 路径、前缀、游戏路径）
/// 
/// # 返回
/// - 成功时返回启动消息
/// - 失败时返回错误信息
#[tauri::command]
pub async fn launch_proton(config: GameLaunchConfig) -> Result<String, String> {
    let game_path = Path::new(&config.game);
    let game_dir = game_path.parent().ok_or("❌ 无法解析游戏目录")?;

    // 创建 Proton 启动命令
    let mut cmd = Command::new(&config.proton);
    cmd.current_dir(game_dir);

    // ========================================
    // 环境变量配置
    // ========================================

    // Proton/Wine 核心环境变量
    cmd.env("STEAM_COMPAT_DATA_PATH", &config.prefix);
    cmd.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "~/.steam/root");
    cmd.env("WINEPREFIX", &config.prefix);
    cmd.env("LC_ALL", "zh_CN.UTF-8");

    // 输入法支持（fcitx5）
    cmd.env("GTK_IM_MODULE", "fcitx");
    cmd.env("QT_IM_MODULE", "fcitx");
    cmd.env("XMODIFIERS", "@im=fcitx");
    cmd.env("SDL_IM_MODULE", "fcitx");
    cmd.env("GLFW_IM_MODULE", "ibus");

    // 显示服务器配置
    cmd.env("WAYLAND_DISPLAY", "wayland-0");
    cmd.env("XDG_SESSION_TYPE", "wayland");
    cmd.env("DBUS_SESSION_BUS_ADDRESS", "unix:path=/run/user/1000/bus");

    // ========================================
    // 启动命令构建
    // ========================================
    cmd.arg("run");
    cmd.arg(&config.game);

    // 执行启动
    match cmd.spawn() {
        Ok(child) => {
            let pid = child.id();
            log::info!("✅ 游戏启动成功 - PID: {}", pid);
            std::mem::forget(child);
            Ok(format!("✅ 游戏已启动 (PID: {})", pid))
        }
        Err(e) => {
            log::error!("❌ 游戏启动失败: {}", e);
            Err(format!("❌ 启动失败: {}", e))
        }
    }
}

// ============================================================================
// 配置管理命令
// ============================================================================

/// 保存应用配置到文件
/// 
/// # 参数
/// - `handle`: Tauri 应用句柄
/// - `config`: 应用配置（Proton 路径、前缀、游戏路径）
#[tauri::command]
pub async fn save_config(handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let config_dir = handle.path().app_config_dir()
        .map_err(|e| format!("❌ 获取配置目录失败: {}", e))?;
    
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("❌ 创建配置目录失败: {}", e))?;

    let config_path = config_dir.join("config.json");
    let json = serde_json::to_string(&config)
        .map_err(|e| format!("❌ 序列化配置失败: {}", e))?;
    
    fs::write(&config_path, json)
        .map_err(|e| format!("❌ 保存配置失败: {}", e))?;

    log::info!("✅ 配置已保存: {:?}", config_path);
    Ok(())
}

/// 从文件加载应用配置
/// 
/// # 参数
/// - `handle`: Tauri 应用句柄
/// 
/// # 返回
/// - 已保存的配置，如果不存在则返回空配置
#[tauri::command]
pub async fn load_config(handle: tauri::AppHandle) -> Result<AppConfig, String> {
    let config_dir = handle.path().app_config_dir()
        .map_err(|e| format!("❌ 获取配置目录失败: {}", e))?;
    
    let config_path = config_dir.join("config.json");

    // 如果配置文件不存在，返回空配置
    if !config_path.exists() {
        log::info!("ℹ️  配置文件不存在，返回空配置");
        return Ok(AppConfig {
            proton: String::new(),
            prefix: String::new(),
            game: String::new(),
        });
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("❌ 读取配置失败: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("❌ 解析配置失败: {}", e))
}

// ============================================================================
// 进程管理命令
// ============================================================================

/// 强制关闭所有游戏进程
/// 
/// 扫描系统进程，识别游戏相关进程并关闭
/// 
/// # 返回
/// - 关闭的进程数和状态信息
#[tauri::command]
pub async fn force_close_games() -> Result<String, String> {
    let mut system = System::new_all();
    system.refresh_all();

    let mut closed_count = 0;
    let current_pid = std::process::id();

    // 遍历所有进程
    for (pid, process) in system.processes() {
        // 跳过当前进程
        if pid.as_u32() == current_pid {
            continue;
        }

        let name = process.name().to_lowercase();

        // 排除系统关键进程
        if self::is_system_process(&name) {
            continue;
        }

        // 检查是否为游戏进程
        if self::is_game_process(&name) {
            if process.kill() {
                closed_count += 1;
                log::info!("✅ 已关闭游戏进程: {} (PID: {})", name, pid);
            } else {
                log::warn!("⚠️  无法关闭进程: {} (PID: {})", name, pid);
            }
        }
    }

    if closed_count > 0 {
        let msg = format!("✅ 已强制关闭 {} 个游戏进程", closed_count);
        log::info!("{}", msg);
        Ok(msg)
    } else {
        let msg = "ℹ️  未找到需要关闭的游戏进程".to_string();
        log::info!("{}", msg);
        Ok(msg)
    }
}

// ============================================================================
// 辅助函数
// ============================================================================

/// 检查是否为系统进程
fn is_system_process(name: &str) -> bool {
    matches!(name.split('-').next().unwrap_or(""),
        "systemd" | "dbus" | "pulseaudio" | "xorg" | "gnome" | "kde" |
        "easy-proton" | "tauri" | "thread" | "kworker"
    ) || name.contains("gnome") || name.contains("kde") || 
       name.contains("easy-proton") || name.contains("tauri")
}

/// 检查是否为游戏进程
fn is_game_process(name: &str) -> bool {
    name.ends_with(".exe")
        || (name.contains("wine") && !name.contains("wineserver"))
        || name.contains("proton")
        || (name.contains("steam") && name.contains("game"))
        || name.contains("game")
        || name.contains("hl2")
        || name.contains("dota")
        || name.contains("csgo")
        || name.contains("tf2")
        || (name.ends_with("64") && name.len() > 2)
        || (name.ends_with("32") && name.len() > 2)
}
