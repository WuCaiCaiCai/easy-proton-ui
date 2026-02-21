// 重构说明：Builder 装配集中在此，统一插件、日志、全局状态注入，让 lib.rs 不再堆积初始化细节。
use crate::{commands, error::AppResult, state::AppState};
use tauri::Manager;

pub fn launch() -> AppResult<()> {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: None,
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                ])
                .build(),
        )
        .setup(|app| {
            let handle = app.handle();
            let state = AppState::try_new(&handle)?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::launcher::launch_proton,
            commands::config::save_config,
            commands::config::load_config,
            commands::process::force_close_games
        ])
        .run(tauri::generate_context!())
        .map_err(Into::into)
}
