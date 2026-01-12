export interface AppConfig {
    proton: string;
    prefix: string;
    game: string;
}

export interface GameRecord extends AppConfig {
    name: string;
    time: number;
}