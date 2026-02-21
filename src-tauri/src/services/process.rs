// 重构说明：进程处理逻辑统一集中于此，命令层只需获得 CloseSummary，方便未来扩展黑名单与灰名单。
use crate::error::AppResult;
use sysinfo::System;

pub struct CloseSummary {
    closed: usize,
}

impl CloseSummary {
    pub fn into_user_message(self) -> String {
        if self.closed > 0 {
            format!("✅ 已强制关闭 {} 个游戏进程", self.closed)
        } else {
            "ℹ️ 未找到需要关闭的游戏进程".into()
        }
    }
}

pub struct ProcessManager;

impl ProcessManager {
    pub fn force_close_games() -> AppResult<CloseSummary> {
        let mut system = System::new_all();
        system.refresh_all();

        let mut closed_count = 0;
        let current_pid = std::process::id();

        for (pid, process) in system.processes() {
            if pid.as_u32() == current_pid {
                continue;
            }

            let name = process.name().to_lowercase();

            if is_system_process(&name) {
                continue;
            }

            if is_game_process(&name) && process.kill() {
                closed_count += 1;
                log::info!("已关闭游戏进程: {} (PID: {})", name, pid);
            }
        }

        Ok(CloseSummary {
            closed: closed_count,
        })
    }
}

fn is_system_process(name: &str) -> bool {
    matches!(
        name.split('-').next().unwrap_or(""),
        "systemd"
            | "dbus"
            | "pulseaudio"
            | "xorg"
            | "gnome"
            | "kde"
            | "easy-proton"
            | "tauri"
            | "thread"
            | "kworker"
    ) || name.contains("gnome")
        || name.contains("kde")
        || name.contains("easy-proton")
        || name.contains("tauri")
}

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
