// 重构说明：集中导出 crate 模块、限制 unwrap，并将运行入口统一交给 app::launch，方便 main.rs 保持极薄。

pub mod app;
pub mod commands;
pub mod domain;
pub mod error;
pub mod services;
pub mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(err) = app::launch() {
        log::error!("EasyProtonUI failed to start: {err}");
        panic!("error while running tauri application: {err}");
    }
}
