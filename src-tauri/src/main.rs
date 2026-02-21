#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // 调用 lib.rs 里的 run 函数
    easy_proton_ui_lib::run();
}
