# 🚀 Easy Proton UI

**Easy Proton UI** 是一个基于 Tauri 和 Rust 构建的轻量级 Linux 游戏启动器。它专为解决 Linux 玩家在运行非 Steam 游戏（尤其是 Galgame）时遇到的 Proton 配置繁琐、汉化补丁失效、路径管理乱等痛点而生。

---

## ✨ 功能特性 (Features)

- 🛠️ **一键配置 (Simple Setup)**: 轻松指定不同的 Proton 版本和独立的环境容器 (Prefix)。
- 🏮 **汉化补丁支持 (Translation Patch Support)**: 自动配置 `WINEDLLOVERRIDES`，完美加载 `dinput8.dll`, `dsound.dll` 等常见汉化插件。
- 🌍 **本地化优化 (Locale Optimization)**: 预设 `zh_CN.UTF-8` 环境，告别游戏内乱码。
- 🚀 **极速启动 (High Performance)**: 基于 Rust 后端，几乎不占系统资源。
- 💾 **自动保存 (Auto-save)**: 自动记忆上次运行的配置，下次启动只需一键。

---

## 📸 屏幕截图 (Screenshots)

*(此处可以上传一张你软件运行时的截图)*
![App Screenshot](https://via.placeholder.com/800x450?text=Easy+Proton+UI+Running)

---

## 🛠️ 安装与运行 (Installation)

### 环境要求
- [Rust](https://www.rust-lang.org/) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Tauri CLI](https://tauri.app/v2/guides/getting-started/beginning-tutorial/)

### 开始使用
1. **克隆仓库**:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/easy-proton-ui.git](https://github.com/YOUR_USERNAME/easy-proton-ui.git)
   cd easy-proton-ui
