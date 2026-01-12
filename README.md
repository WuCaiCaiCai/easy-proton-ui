# 🚀 Easy Proton UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Built%20with-Rust-orange)](https://www.rust-lang.org/)

**Easy Proton UI** 是一个为 Linux 用户设计的轻量级、开源 Proton 启动器。它专注于简化非 Steam 游戏的运行流程，尤其是 Galgame 等需要复杂环境配置和汉化补丁加载的游戏。

---

## ✨ 功能特性

- 🛠️ **环境解耦**：为每个游戏指定独立的 Proton 版本和 Prefix 路径。
- 🏮 **补丁注入**：自动配置 `WINEDLLOVERRIDES`，确保汉化 DLL 优先加载。
- 🌍 **本地化预设**：默认启用 `zh_CN.UTF-8`，解决游戏乱码问题。
- ⚡ **极速响应**：基于 Tauri 2.0 + Rust 架构，启动快且占用内存低。
- 💾 **智能记忆**：自动保存游戏配置，实现“配置一次，终身运行”。

---

## 🛠️ 安装与编译

从源码构建的步骤如下：

```bash
# 安装依赖 (以 Debian/Ubuntu 为例)
sudo apt update && sudo apt install -y \
    libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# 克隆仓库
git clone https://github.com/WuCaiCaiCai/easy-proton-ui.git
cd easy-proton-ui

# 安装依赖并运行
npm install
npm run tauri dev
```



# ToDo

- [x] 最近游戏功能（logo显示有问题，改用svg统一图标）
- [ ] 界面优化
- [ ] 版本号发行自动更新
