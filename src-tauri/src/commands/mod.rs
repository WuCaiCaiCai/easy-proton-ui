// 重构说明：命令拆分为配置/启动/进程三个模块，统一在 mod 中导出，方便 Builder 注册。
pub mod config;
pub mod launcher;
pub mod process;

pub use config::{load_config, save_config};
pub use launcher::launch_proton;
pub use process::force_close_games;
