// 重构说明：封装 Proton 启动流程并引入 LaunchSummary，命令层无需再手动拼装 Command。
use crate::{
    domain::config::GameLaunchConfig,
    error::{AppError, AppResult},
};
use std::{path::Path, process::Command};

pub struct LaunchSummary {
    pid: u32,
}

impl LaunchSummary {
    pub fn into_user_message(self) -> String {
        format!("✅ 游戏已启动 (PID: {})", self.pid)
    }
}

pub struct ProtonLauncher;

impl ProtonLauncher {
    pub fn launch(config: GameLaunchConfig) -> AppResult<LaunchSummary> {
        config.validate()?;

        let game_path = Path::new(&config.game);
        let game_dir = game_path
            .parent()
            .ok_or_else(|| AppError::InvalidInput("无法解析游戏所在目录".into()))?;

        let mut cmd = Command::new(&config.proton);
        cmd.current_dir(game_dir);

        // Proton/Wine 环境变量
        cmd.env("STEAM_COMPAT_DATA_PATH", &config.prefix);
        cmd.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "~/.steam/root");
        cmd.env("WINEPREFIX", &config.prefix);
        cmd.env("LC_ALL", "zh_CN.UTF-8");

        // 输入法
        cmd.env("GTK_IM_MODULE", "fcitx");
        cmd.env("QT_IM_MODULE", "fcitx");
        cmd.env("XMODIFIERS", "@im=fcitx");
        cmd.env("SDL_IM_MODULE", "fcitx");
        cmd.env("GLFW_IM_MODULE", "ibus");

        // 显示会话
        cmd.env("WAYLAND_DISPLAY", "wayland-0");
        cmd.env("XDG_SESSION_TYPE", "wayland");
        cmd.env("DBUS_SESSION_BUS_ADDRESS", "unix:path=/run/user/1000/bus");

        cmd.arg("run");
        cmd.arg(&config.game);

        let child = cmd
            .spawn()
            .map_err(|err| AppError::Process(format!("启动游戏失败: {err}")))?;

        let pid = child.id();
        log::info!("游戏启动成功，PID={pid}");
        std::mem::forget(child);
        Ok(LaunchSummary { pid })
    }
}
