/**
 * 应用全局配置类型定义
 * 包含 Proton、Wine 前缀和游戏路径
 */
export interface AppConfig {
    proton: string;      // Proton 可执行文件路径
    prefix: string;      // Wine 前缀路径（兼容数据目录）
    game: string;        // 游戏可执行文件路径
}

/**
 * 游戏历史记录类型定义
 * 扩展 AppConfig，添加元数据
 */
export interface GameRecord extends AppConfig {
    id: string;          // 稳定唯一 ID，不随路径变化
    name: string;        // 游戏显示名称
    time: number;        // 记录时间戳
    icon?: string;       // 游戏图标本地路径
}

/**
 * 游戏启动配置类型定义
 * 用于 IPC 通信，传递启动参数
 */
export interface GameLaunchConfig extends AppConfig {
    // 启动相关配置（可在此扩展）
}

/**
 * UI 编辑模式状态类型定义
 */
export interface EditMode {
    isEditing: boolean;
    recordId: string;    // 使用游戏路径作为唯一ID
    field?: 'name' | 'game' | 'delete';
}
