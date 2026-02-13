export interface AppConfig {
    proton: string;
    prefix: string;
    game: string;
}

export interface GameRecord extends AppConfig {
    name: string;    // 最终显示的名字
    time: number;
    icon?: string;   // 本地拷贝后的图标路径
    gamescope?: GamescopeConfig; // Gamescope配置
}

// Gamescope配置
export interface GamescopeConfig {
    enabled: boolean;          // 是否启用gamescope
    width?: number;            // 分辨率宽度
    height?: number;           // 分辨率高度
    use_fsr: boolean;          // 是否启用FSR
    fsr_mode?: 'fsr1' | 'fsr2' | 'fsr3' | 'fsr4'; // FSR模式
    fsr_sharpness?: number;    // FSR锐度 (0-10)
    fullscreen: boolean;       // 是否全屏
    borderless: boolean;       // 是否无边框
    vsync: boolean;            // 是否启用垂直同步
    fps_limit?: number;        // FPS限制
}

// 游戏启动配置
export interface GameLaunchConfig {
    proton: string;
    prefix: string;
    game: string;
    gamescope?: GamescopeConfig;
}

// 编辑模式状态
export interface EditMode {
    isEditing: boolean;
    recordId: string; // 使用 game 路径作为唯一ID
    field?: 'name' | 'game' | 'delete';
}
