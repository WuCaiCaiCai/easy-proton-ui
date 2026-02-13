/**
 * EasyProton - 主应用组件
 * 
 * 功能：
 * - 管理游戏配置（Proton 路径、前缀、游戏路径）
 * - 游戏历史和快速启动
 * - 游戏进程管理
 * - 配置持久化
 */

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";

import type { AppConfig, GameRecord, GameLaunchConfig } from "./types";
import { GameCard } from "./components/GameCard";
import { EditModal } from "./components/EditModal";
import { PathSelector } from "./components/PathSelector";

// 持久化存储（JSON 文件）
const store = new LazyStore(".proton_history.json");

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

  // ========================================
  // 渲染
  // ========================================

  return (
    <div className="main-layout">
      {/* 全局样式 */}
      <style>{`
        .main-layout {
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at top right, #1a1c25, #0f111a);
          color: #eceff4;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 30px;
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* 纵向滚动条 */
        .main-layout::-webkit-scrollbar { width: 6px; }
        .main-layout::-webkit-scrollbar-track { background: transparent; }
        .main-layout::-webkit-scrollbar-thumb { background: #2e3440; border-radius: 10px; }
        .main-layout::-webkit-scrollbar-thumb:hover { background: #434c5e; }

        .container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .header h1 {
          font-size: 28px;
          color: #88c0d0;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .header p {
          color: #4c566a;
          margin: 8px 0 0;
          font-size: 14px;
        }

        .section-title {
          font-size: 12px;
          color: #81a1c1;
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

        /* 横向滚动条 */
        .history-section::-webkit-scrollbar { height: 4px; }
        .history-section::-webkit-scrollbar-thumb { background: #2e3440; border-radius: 10px; }

        .form-card {
          background: rgba(46, 52, 64, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid #2e3440;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .input-box {
          width: 100%;
          padding: 12px;
          background: #0f111a;
          border: 1px solid #3b4252;
          border-radius: 8px;
          color: #d8dee9;
          outline: none;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .input-box:focus {
          border-color: #5e81ac;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .btn-launch {
          flex: 1;
          padding: 16px;
          background-color: #5e81ac;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(94, 129, 172, 0.3);
        }

        .btn-launch:hover:not(:disabled) {
          background-color: #81a1c1;
          box-shadow: 0 6px 24px rgba(94, 129, 172, 0.4);
        }

        .btn-launch:disabled {
          background-color: #4c566a;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-close {
          padding: 16px 24px;
          background-color: #434c5e;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(67, 76, 94, 0.3);
        }

        .btn-close:hover:not(:disabled) {
          background-color: #bf616a;
          box-shadow: 0 6px 20px rgba(191, 97, 106, 0.3);
        }

        .btn-close:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .log-terminal {
          background: #000;
          border-radius: 12px;
          border: 1px solid #1a1c25;
          padding: 15px;
          font-family: 'Fira Code', 'Monaco', monospace;
          font-size: 12px;
          height: 160px;
          overflow-y: auto;
          color: #a3be8c;
          line-height: 1.6;
        }

        .log-terminal::-webkit-scrollbar { width: 6px; }
        .log-terminal::-webkit-scrollbar-thumb { background: #2e3440; border-radius: 4px; }

        .log-title {
          color: #4c566a;
          border-bottom: 1px solid #1a1c25;
          margin-bottom: 8px;
          padding-bottom: 4px;
          font-weight: 600;
        }

        .log-item {
          display: flex;
          gap: 8px;
        }

        .log-prefix {
          color: #5e81ac;
          user-select: none;
          flex-shrink: 0;
        }
      `}</style>

      <div className="container">
        {/* 应用标题 */}
        <header className="header">
          <h1>⚡ EasyProton</h1>
          <p>Windows 游戏快速启动工具 • Proton Launcher</p>
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
              <div style={{ color: "#3b4252", fontSize: "13px", padding: "10px" }}>
                暂无游戏记录
              </div>
            )}
          </div>
        </section>

        {/* 配置表单 */}
        <section className="form-card">
          {/* 自定义游戏名称 */}
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#81a1c1", marginBottom: "8px", fontWeight: 500 }}>
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
            <div style={{ color: "#3b4252", fontSize: "12px" }}>等待命令执行...</div>
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
