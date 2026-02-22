import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { getCurrentWindow } from "@tauri-apps/api/window";

import type { AppConfig, GameRecord } from "./types";
import { GameCard } from "./components/GameCard";
import { EditModal } from "./components/EditModal";
import { PathSelector } from "./components/PathSelector";

const store = new LazyStore(".proton_history.json");
const THEME_KEY = "easy-proton-theme";
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function App() {
  const [config, setConfig] = useState<AppConfig>({ proton: "", prefix: "", game: "" });
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customName, setCustomName] = useState("");
  const [editingRecord, setEditingRecord] = useState<GameRecord | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isMaximized, setIsMaximized] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 检测是否在 Tauri 环境中
  const isTauri = Boolean((window as any).__TAURI_INTERNALS__);

  useEffect(() => {
    invoke<AppConfig>("load_config")
      .then((res) => { if (res?.proton || res?.game) setConfig(res); })
      .catch((err) => addLog(`❌ 加载配置失败: ${err}`));

    store.get<GameRecord[]>("history").then((data) => {
      if (data) { setHistory(data); addLog(`✅ 已加载 ${data.length} 条游戏记录`); }
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!isTauri) return;
    const win = getCurrentWindow();
    win.isMaximized().then(setIsMaximized).catch(() => {});
    let unlisten: (() => void) | undefined;
    win.onResized(async () => {
      try { setIsMaximized(await win.isMaximized()); } catch {}
    }).then((fn) => { unlisten = fn; }).catch(() => {});
    return () => unlisten?.();
  }, []);

  // 日志自动滚动到底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const saveHistory = async (next: GameRecord[]) => {
    setHistory(next);
    await store.set("history", next);
    await store.save();
  };

  const handleLaunch = async (override?: GameRecord) => {
    const target = override ?? config;
    if (!target.proton || !target.game) {
      addLog("❌ 请先选择 Proton 路径和游戏主程序");
      return;
    }
    setIsLoading(true);
    try {
      const result = await invoke<string>("launch_proton", { config: target });
      addLog(result);

      const fileName = target.game.split(/[\\/]/).pop()?.replace(/\.exe$/i, "") ?? "Unknown";
      const name = override ? override.name : (customName || fileName);
      const newRecord: GameRecord = {
        ...target,
        id: override?.id ?? crypto.randomUUID(),
        name,
        time: Date.now(),
      };
      await saveHistory([newRecord, ...history.filter((h) => h.game !== target.game)].slice(0, 10));
      await invoke("save_config", { config: target });
      setCustomName("");
    } catch (err) {
      addLog(`❌ 启动失败: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async (updated: GameRecord) => {
    // 用稳定 id 匹配，不依赖可变的 game 路径
    const next = history.map((r) => r.id === updated.id ? { ...updated, time: Date.now() } : r);
    await saveHistory(next);
    addLog(`✅ 已更新游戏: ${updated.name}`);
  };

  const handleDeleteRecord = async (id: string) => {
    const target = history.find((r) => r.id === id);
    await saveHistory(history.filter((r) => r.id !== id));
    if (target) addLog(`✅ 已删除游戏: ${target.name}`);
  };

  const handleForceClose = async () => {
    try {
      addLog(await invoke<string>("force_close_games"));
    } catch (err) {
      addLog(`❌ 强制关闭失败: ${err}`);
    }
  };

  const handleMinimize = () => { if (isTauri) getCurrentWindow().minimize().catch(() => {}); };
  const handleMaximize = () => { if (isTauri) getCurrentWindow().toggleMaximize().catch(() => {}); };
  const handleClose    = () => { if (isTauri) getCurrentWindow().close().catch(() => {}); };

  return (
    <div className="main-layout">
      {/* 标题栏 */}
      {isTauri && (
        <div className="titlebar" data-tauri-drag-region>
          <div className="titlebar-left" data-tauri-drag-region>
            <div className="titlebar-icon">EP</div>
            <span className="titlebar-title">EasyProton{isMaximized ? " · 全屏" : ""}</span>
          </div>
          <div className="titlebar-actions">
            <button className="titlebar-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="切换主题">
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button className="titlebar-btn" onClick={handleMinimize} aria-label="最小化">
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="8" x2="9" y2="8"/></svg>
            </button>
            <button className="titlebar-btn" onClick={handleMaximize} aria-label={isMaximized ? "还原" : "最大化"}>
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5" fill="none"><rect x="2" y="2" width="6" height="6"/></svg>
            </button>
            <button className="titlebar-btn danger" onClick={handleClose} aria-label="关闭">
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="scroll-area">
        <div className="container">
          {/* 页头 */}
          <header className="page-header">
            <div>
              <h1>EasyProton</h1>
              <p>Windows 游戏快速启动工具 · Proton Launcher</p>
            </div>
            {!isTauri && (
              <button className="theme-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="切换主题">
                {theme === "dark" ? "☀" : "☾"}
              </button>
            )}
          </header>

          {/* 历史记录 */}
          <section>
            <div className="section-label">最近运行</div>
            <div className="history-row">
              {history.length > 0
                ? history.map((r) => (
                    <GameCard key={r.id} record={r} onClick={() => handleLaunch(r)} onEdit={() => setEditingRecord(r)} />
                  ))
                : <div className="history-empty">暂无游戏记录</div>
              }
            </div>
          </section>

          {/* 配置表单 */}
          <section className="form-panel">
            <div>
              <label className="field-label">游戏显示名称</label>
              <input
                className="input-box"
                type="text"
                placeholder="留空则自动使用 EXE 文件名"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <PathSelector label="Proton 脚本路径" value={config.proton} placeholder="选择 proton 可执行文件" onSelect={(p) => setConfig({ ...config, proton: p })} />
            <PathSelector label="Wine 前缀 (Compatdata)" value={config.prefix} placeholder="选择 Wine 运行环境目录" isDirectory onSelect={(p) => setConfig({ ...config, prefix: p })} />
            <PathSelector label="游戏主程序 (EXE)" value={config.game} placeholder="选择游戏 .exe 文件" onSelect={(p) => setConfig({ ...config, game: p })} />
          </section>

          {/* 操作按钮 */}
          <div className="btn-row">
            <button className="btn-primary" onClick={() => handleLaunch()} disabled={isLoading}>
              {isLoading ? "正在启动..." : "▶  启动游戏"}
            </button>
            <button className="btn-secondary" onClick={handleForceClose} disabled={isLoading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              强制关闭
            </button>
          </div>

          {/* 日志 */}
          <div className="log-box">
            <div className="log-header">系统日志</div>
            {logs.length === 0
              ? <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>等待命令执行...</span>
              : logs.map((log, i) => (
                  <div key={i} className="log-line">
                    <span className="log-prompt">&gt;</span>
                    <span className="log-text">{log}</span>
                  </div>
                ))
            }
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <EditModal
        record={editingRecord}
        isOpen={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteRecord}
      />
    </div>
  );
}

export default App;
