// 声明模块
pub mod models;
pub mod commands;

use commands::*; // 引入 commands 里所有的函数
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build()) // 记得加上 Store 插件
        .invoke_handler(tauri::generate_handler![
            launch_proton,
            save_config,
            load_config,
            force_close_games
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}