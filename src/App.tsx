/**
 * EasyProton - 主应用组件
 * 
 * 功能：
 * - 管理游戏配置（Proton 路径、前缀、游戏路径）
 * - 游戏历史和快速启动
 * - 游戏进程管理
 * - 配置持久化
 */

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { getCurrentWindow } from "@tauri-apps/api/window";

import type { AppConfig, GameRecord, GameLaunchConfig } from "./types";
import { GameCard } from "./components/GameCard";
import { EditModal } from "./components/EditModal";
import { PathSelector } from "./components/PathSelector";

// 持久化存储（JSON 文件）
const store = new LazyStore(".proton_history.json");
const THEME_STORAGE_KEY = "easy-proton-theme";
type ThemeMode = "light" | "dark";

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  }
  return "dark";
};

/**
 * 应用主组件
 */
function App() {
  // ========================================
  // 状态定义
  // ========================================

  // 当前配置（默认值）
  const [config, setConfig] = useState<AppConfig>({
    proton: "",
    prefix: "",
    game: "",
  });

  // 游戏历史记录
  const [history, setHistory] = useState<GameRecord[]>([]);

  // 系统日志
  const [logs, setLogs] = useState<string[]>([]);

  // UI 状态
  const [isLoading, setIsLoading] = useState(false);
  const [customName, setCustomName] = useState("");
  const [editingRecord, setEditingRecord] = useState<GameRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [hasWindowControls, setHasWindowControls] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // ========================================
  // 生命周期
  // ========================================

  /**
   * 组件初始化：加载保存的配置和历史记录
   */
  useEffect(() => {
    // 加载默认配置
    invoke("load_config")
      .then((res: any) => {
        if (res?.proton || res?.prefix || res?.game) {
          setConfig(res);
        }
      })
      .catch((err) => {
        addLog(`❌ 加载配置失败: ${err}`);
      });

    // 加载游戏历史
    store.get<GameRecord[]>("history").then((data) => {
      if (data) {
        setHistory(data);
        addLog(`✅ 已加载 ${data.length} 条游戏记录`);
      }
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hasTauri = Boolean((window as any).__TAURI_INTERNALS__);
    setHasWindowControls(hasTauri);
    if (!hasTauri) {
      return;
    }
    let unlisten: (() => void) | undefined;
    const windowHandle = getCurrentWindow();
    windowHandle
      .isMaximized()
      .then(setIsMaximized)
      .catch(() => {});
    windowHandle
      .onResized(async () => {
        try {
          const maximized = await windowHandle.isMaximized();
          setIsMaximized(maximized);
        } catch {
          // ignore
        }
      })
      .then((fn: () => void) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => {
      unlisten?.();
    };
  }, []);

  // ========================================
  // 事件处理器
  // ========================================

  /**
   * 添加日志消息
   */
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  /**
   * 启动游戏（通过 Proton）
   * 
   * @param override - 可选的历史记录覆盖（从历史卡片启动）
   */
  const handleLaunch = async (override?: GameRecord) => {
    // 确定要使用的配置（覆盖或当前）
    const target = override
      ? { proton: override.proton, prefix: override.prefix, game: override.game }
      : config;

    // 验证必要参数
    if (!target.proton || !target.game) {
      addLog("❌ 错误: 请先选择 Proton 路径和游戏主程序");
      return;
    }

    setIsLoading(true);
    try {
      // 构建启动配置
      const launchConfig: GameLaunchConfig = target;

      // 调用后端启动命令
      const result = await invoke("launch_proton", { config: launchConfig });
      addLog(`${result}`);

      // 计算游戏显示名称
      const fileName = target.game.split(/[\\/]/).pop()?.replace(".exe", "") || "Unknown";
      const finalName = override ? override.name : (customName || fileName);

      // 构造新的历史记录
      const newRecord: GameRecord = {
        ...target,
        name: finalName,
        time: Date.now(),
      };

      // 更新历史（去重、置顶、限制条数）
      const newHistory = [
        newRecord,
        ...history.filter((h) => h.game !== target.game),
      ].slice(0, 10); // 最多保留 10 条

      // 保存到本地存储
      setHistory(newHistory);
      await store.set("history", newHistory);
      await store.save();

      // 保存为默认配置
      await invoke("save_config", { config: target });

      // 清空自定义名称
      setCustomName("");
    } catch (err: any) {
      addLog(`❌ 启动失败: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 打开编辑对话框
   */
  const handleEditRecord = (record: GameRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  /**
   * 保存编辑后的游戏记录
   */
  const handleSaveEdit = (updatedRecord: GameRecord) => {
    const newHistory = history.map((record) =>
      record.game === updatedRecord.game
        ? { ...updatedRecord, time: Date.now() }
        : record
    );
    setHistory(newHistory);
    store.set("history", newHistory);
    store.save();
    addLog(`✅ 已更新游戏: ${updatedRecord.name}`);
  };

  /**
   * 删除游戏记录
   */
  const handleDeleteRecord = (recordId: string) => {
    const recordToDelete = history.find((r) => r.game === recordId);
    const newHistory = history.filter((record) => record.game !== recordId);
    setHistory(newHistory);
    store.set("history", newHistory);
    store.save();
    if (recordToDelete) {
      addLog(`✅ 已删除游戏: ${recordToDelete.name}`);
    }
  };

  /**
   * 关闭编辑对话框
   */
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  /**
   * 强制关闭所有游戏进程
   */
  const handleForceClose = async () => {
    try {
      const result = await invoke("force_close_games");
      addLog(`${result}`);
    } catch (err: any) {
      addLog(`❌ 强制关闭失败: ${err}`);
    }
  };

  /**
   * 自定义窗口控制
   */
  const handleMinimizeWindow = async () => {
    if (!hasWindowControls) return;
    try {
      await getCurrentWindow().minimize();
    } catch (err) {
      addLog(`❌ 窗口操作失败: ${err}`);
    }
  };

  const handleToggleMaximize = async () => {
    if (!hasWindowControls) return;
    try {
      const windowHandle = getCurrentWindow();
      await windowHandle.toggleMaximize();
      const maximized = await windowHandle.isMaximized();
      setIsMaximized(maximized);
    } catch (err) {
      addLog(`❌ 窗口操作失败: ${err}`);
    }
  };

  const handleCloseWindow = async () => {
    if (!hasWindowControls) return;
    try {
      await getCurrentWindow().close();
    } catch (err) {
      addLog(`❌ 窗口操作失败: ${err}`);
    }
  };

  /**
   * 主题切换
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // ========================================
  // 渲染
  // ========================================

  const themeIcon = theme === "dark" ? "🌙" : "☀️";
  const nextThemeLabel = theme === "dark" ? "浅色模式" : "深色模式";
  const windowTitle = isMaximized ? "EasyProton · 全屏" : "EasyProton";

  return (
    <div className="main-layout">
      {/* 全局样式 */}
      <style>{`
        .main-layout {
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at top right, var(--color-gradient-start), var(--color-gradient-end));
          color: var(--color-text-primary);
          overflow-y: auto;
          overflow-x: hidden;
          padding: 30px;
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .window-frame {
          width: min(980px, calc(100% - 32px));
          margin: 0 auto 28px;
          padding: 12px 18px;
          border-radius: 22px;
          background: var(--color-titlebar-bg);
          border: 1px solid var(--color-titlebar-border);
          color: var(--color-titlebar-text);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          -webkit-app-region: drag;
          box-shadow: var(--color-titlebar-shadow);
          backdrop-filter: blur(24px);
          position: relative;
          overflow: hidden;
        }

        .window-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15), transparent 55%);
          mix-blend-mode: screen;
        }

        .window-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-weight: 600;
          letter-spacing: 0.4px;
        }

        .window-pill {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #b16bff, #ffb6ff);
          box-shadow: 0 12px 30px rgba(177, 107, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #1c082b;
        }

        .window-title-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 1;
        }

        .window-title-text {
          font-size: 16px;
          letter-spacing: 0.6px;
        }

        .window-title-sub {
          font-size: 11px;
          color: var(--color-titlebar-subtext);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .window-actions {
          display: flex;
          gap: 10px;
        }

        .window-btn {
          width: 38px;
          height: 32px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--color-titlebar-icon);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
          -webkit-app-region: no-drag;
        }

        .window-btn svg {
          pointer-events: none;
        }

        .window-btn:hover {
          background: var(--color-titlebar-btn-hover);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .window-btn.close {
          color: var(--color-titlebar-btn-close);
        }

        .window-btn.close:hover {
          background: var(--color-titlebar-btn-hover);
          color: var(--color-titlebar-btn-close-hover);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .main-layout::-webkit-scrollbar { width: 6px; }
        .main-layout::-webkit-scrollbar-track { background: transparent; }
        .main-layout::-webkit-scrollbar-thumb { background: var(--color-scrollbar-thumb); border-radius: 10px; }
        .main-layout::-webkit-scrollbar-thumb:hover { background: var(--color-scrollbar-thumb-hover); }

        .container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header h1 {
          font-size: 28px;
          color: var(--color-accent-primary);
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--color-text-primary);
          background: linear-gradient(120deg, rgba(255, 255, 255, 0.15), transparent);
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin-bottom: 12px;
        }

        .header p {
          color: var(--color-text-secondary);
          margin: 8px 0 0;
          font-size: 14px;
        }

        .section-title {
          font-size: 12px;
          color: var(--color-accent-strong);
          font-weight: 600;
          margin-bottom: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .history-section {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 12px;
        }

        .history-section::-webkit-scrollbar { height: 4px; }
        .history-section::-webkit-scrollbar-thumb { background: var(--color-scrollbar-thumb); border-radius: 10px; }
        .history-section::-webkit-scrollbar-thumb:hover { background: var(--color-scrollbar-thumb-hover); }

        .history-empty {
          color: var(--color-text-placeholder);
          font-size: 13px;
          padding: 10px;
        }

        .form-card {
          background: var(--color-panel-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--color-panel-border);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: var(--color-panel-shadow);
        }

        .input-box {
          width: 100%;
          padding: 12px;
          background: var(--color-input-bg);
          border: 1px solid var(--color-input-border);
          border-radius: 8px;
          color: var(--color-input-text);
          outline: none;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .input-box::placeholder {
          color: var(--color-text-placeholder);
        }

        .input-box:focus {
          border-color: var(--color-button-primary);
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .btn-launch {
          flex: 1;
          padding: 16px;
          background-color: var(--color-button-primary);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--color-button-primary-shadow);
        }

        .btn-launch:hover:not(:disabled) {
          background-color: var(--color-button-primary-hover);
          box-shadow: var(--color-button-primary-shadow-hover);
        }

        .btn-launch:disabled {
          background-color: var(--color-button-disabled);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-close {
          padding: 16px 24px;
          background-color: var(--color-button-secondary);
          color: var(--color-text-primary);
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--color-button-secondary-shadow);
        }

        .btn-close:hover:not(:disabled) {
          background-color: var(--color-button-secondary-hover);
          box-shadow: var(--color-button-secondary-shadow-hover);
          color: #fff;
        }

        .btn-close:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .log-terminal {
          background: var(--color-log-bg);
          border-radius: 12px;
          border: 1px solid var(--color-log-border);
          padding: 15px;
          font-family: 'Fira Code', 'Monaco', monospace;
          font-size: 12px;
          height: 160px;
          overflow-y: auto;
          color: var(--color-log-text);
          line-height: 1.6;
        }

        .log-terminal::-webkit-scrollbar { width: 6px; }
        .log-terminal::-webkit-scrollbar-thumb { background: var(--color-scrollbar-thumb); border-radius: 4px; }

        .log-title {
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-log-border);
          margin-bottom: 8px;
          padding-bottom: 4px;
          font-weight: 600;
        }

        .log-item {
          display: flex;
          gap: 8px;
          color: var(--color-text-primary);
        }

        .log-prefix {
          color: var(--color-log-prefix);
          user-select: none;
          flex-shrink: 0;
        }

        .theme-toggle {
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: linear-gradient(120deg, rgba(255, 255, 255, 0.15), transparent);
          color: var(--color-toggle-text);
          border-radius: 999px;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .theme-toggle span {
          font-size: 18px;
        }

        .theme-toggle:hover {
          background: linear-gradient(120deg, var(--color-toggle-hover), transparent);
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25);
        }
      `}</style>

      {hasWindowControls && (
        <div className="window-frame" data-tauri-drag-region>
          <div className="window-meta" data-tauri-drag-region>
            <div className="window-pill" aria-hidden="true">EP</div>
            <div className="window-title-stack">
              <span className="window-title-text">{windowTitle}</span>
              <span className="window-title-sub">Nebula Surface · Custom Shell</span>
            </div>
          </div>
          <div className="window-actions">
            <button
              type="button"
              className="window-btn"
              onClick={handleMinimizeWindow}
              aria-label="最小化窗口"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6">
                <line x1="2" y1="9" x2="10" y2="9" />
              </svg>
            </button>
            <button
              type="button"
              className="window-btn"
              onClick={handleToggleMaximize}
              aria-label={isMaximized ? "还原窗口" : "最大化窗口"}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.4" fill="none">
                <rect x="3" y="3" width="6" height="6" />
              </svg>
            </button>
            <button
              type="button"
              className="window-btn close"
              onClick={handleCloseWindow}
              aria-label="关闭窗口"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.4">
                <line x1="3" y1="3" x2="9" y2="9" />
                <line x1="9" y1="3" x2="3" y2="9" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="container">
        {/* 应用标题 */}
        <header className="header">
          <div>
            <div className="status-chip">Nebula Deck</div>
            <h1>⚡ EasyProton</h1>
            <p>Windows 游戏快速启动工具 • Proton Launcher</p>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`切换到${nextThemeLabel}`}
            title={`切换到${nextThemeLabel}`}
          >
            <span>{themeIcon}</span>
            切换到{nextThemeLabel}
          </button>
        </header>

        {/* 游戏历史记录 */}
        <section>
          <div className="section-title">📋 最近运行</div>
          <div className="history-section">
            {history.length > 0 ? (
              history.map((record) => (
                <GameCard
                  key={record.game}
                  record={record}
                  onClick={() => handleLaunch(record)}
                  onEdit={() => handleEditRecord(record)}
                />
              ))
            ) : (
              <div style={{ color: "var(--color-text-placeholder)", fontSize: "13px", padding: "10px" }}>
                暂无游戏记录
              </div>
            )}
          </div>
        </section>

        {/* 配置表单 */}
        <section className="form-card">
          {/* 自定义游戏名称 */}
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--color-accent-strong)", marginBottom: "8px", fontWeight: 500 }}>
              🎮 游戏显示名称
            </label>
            <input
              className="input-box"
              type="text"
              placeholder="留空则自动使用 EXE 文件名"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          {/* Proton 路径选择 */}
          <PathSelector
            label="⚙️  Proton 脚本路径"
            value={config.proton}
            placeholder="选择 proton 可执行文件的路径"
            onSelect={(p) => setConfig({ ...config, proton: p })}
          />

          {/* Wine 前缀选择 */}
          <PathSelector
            label="📁 Wine 前缀 (Compatdata)"
            value={config.prefix}
            isDirectory
            placeholder="选择该游戏的 Wine 运行环境目录"
            onSelect={(p) => setConfig({ ...config, prefix: p })}
          />

          {/* 游戏 EXE 选择 */}
          <PathSelector
            label="🎯 游戏主程序 (EXE)"
            value={config.game}
            placeholder="选择游戏的 exe 可执行文件"
            onSelect={(p) => setConfig({ ...config, game: p })}
          />
        </section>

        {/* 操作按钮 */}
        <div className="button-group">
          <button
            className="btn-launch"
            onClick={() => handleLaunch()}
            disabled={isLoading}
          >
            {isLoading ? "🔄 正在启动..." : "▶️  启动游戏"}
          </button>

          <button
            className="btn-close"
            onClick={handleForceClose}
            disabled={isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            强制关闭
          </button>
        </div>

        {/* 系统日志输出 */}
        <div className="log-terminal">
          <div className="log-title">📋 系统日志</div>
          {logs.length === 0 ? (
            <div style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>等待命令执行...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="log-item">
                <span className="log-prefix">&gt;</span>
                <span>{log}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 编辑游戏记录弹窗 */}
      <EditModal
        record={editingRecord}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        onDelete={handleDeleteRecord}
      />
    </div>
  );
}

export default App;
