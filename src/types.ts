export interface AppConfig {
    proton: string;
    prefix: string;
    game: string;
}

export interface GameRecord extends AppConfig {
    name: string;    // 最终显示的名字
    time: number;
    icon?: string;   // 本地拷贝后的图标路径
}

// 编辑模式状态
export interface EditMode {
    isEditing: boolean;
    recordId: string; // 使用 game 路径作为唯一ID
    field?: 'name' | 'game' | 'delete';
}
