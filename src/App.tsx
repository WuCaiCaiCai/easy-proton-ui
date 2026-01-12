import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";

import type { AppConfig, GameRecord } from "./types";
import { GameCard } from "./components/GameCard";
import { PathSelector } from "./components/PathSelector";

const store = new LazyStore(".proton_history.json");

function App() {
  const [config, setConfig] = useState<AppConfig>({
    proton: "",
    prefix: "",
    game: "",
  });

  const [history, setHistory] = useState<GameRecord[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customName, setCustomName] = useState("");

  // 1. 初始加载配置与历史记录
  useEffect(() => {
    invoke("load_config")
      .then((res: any) => res && setConfig(res))
      .catch((err) => setLogs((prev) => [...prev, `加载配置失败: ${err}`]));

    store.get<GameRecord[]>("history").then((data) => {
      if (data) setHistory(data);
    });
  }, []);

  // 2. 启动逻辑
  const handleLaunch = async (override?: GameRecord) => {
    // 如果是从历史记录卡片点击，则使用卡片的配置；否则使用当前输入框的配置
    const target = override
      ? { proton: override.proton, prefix: override.prefix, game: override.game }
      : config;

    if (!target.proton || !target.game) {
      setLogs((prev) => [...prev, "错误: 请先选择 Proton 路径和游戏主程序"]);
      return;
    }

    setIsLoading(true);
    try {
      await invoke("launch_proton", { config: target, envs: "" });

      // 计算显示名称：自定义名 > 历史记录名 > 文件名
      const fileName = target.game.split(/[\\/]/).pop()?.replace(".exe", "") || "Unknown Game";
      const finalName = override ? override.name : (customName || fileName);

      // 构造新记录（移除 icon 字段，因为 Rust 侧已不支持）
      const newRecord: GameRecord = {
        ...target,
        name: finalName,
        time: Date.now(),
      };

      // 更新历史（去重，置顶，限10条）
      const newHistory = [
        newRecord,
        ...history.filter((h) => h.game !== target.game),
      ].slice(0, 10);

      setHistory(newHistory);
      await store.set("history", newHistory);
      await store.save();
      
      // 保存当前配置为默认配置
      await invoke("save_config", { config: target });

      setLogs((prev) => [...prev, `启动成功: ${finalName}`]);
      setCustomName("");
    } catch (err: any) {
      setLogs((prev) => [...prev, `启动失败: ${err}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-layout">
      {/* 样式注入：解决滚动条和整体视觉设计 */}
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

        /* 纵向主滚动条美化 */
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

        .header h1 { font-size: 28px; color: #88c0d0; margin: 0; font-weight: 800; }
        .header p { color: #4c566a; margin: 5px 0 0; font-size: 14px; }

        .history-section {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 12px;
        }
        /* 横向滚动条美化 */
        .history-section::-webkit-scrollbar { height: 4px; }
        .history-section::-webkit-scrollbar-thumb { background: #2e3440; border-radius: 10px; }

        .form-card {
          background: rgba(46, 52, 64, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid #2e3440;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-box {
          width: 100%;
          padding: 12px;
          background: #0f111a;
          border: 1px solid #3b4252;
          border-radius: 8px;
          color: #d8dee9;
          outline: none;
        }
        .input-box:focus { border-color: #5e81ac; }

        .log-terminal {
          background: #000;
          border-radius: 12px;
          padding: 15px;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          height: 140px;
          overflow-y: auto;
          color: #a3be8c;
          border: 1px solid #1a1c25;
          line-height: 1.6;
        }
      `}</style>

      <div className="container">
        <header className="header">
          <h1>EasyProton</h1>
          <p>windows游戏快速启动工具</p>
        </header>

        {/* 最近运行 */}
        <section>
          <div style={{ fontSize: '12px', color: '#81a1c1', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1px' }}>最近运行</div>
          <div className="history-section">
            {history.length > 0 ? (
              history.map((record) => (
                <GameCard key={record.game} record={record} onClick={() => handleLaunch(record)} />
              ))
            ) : (
              <div style={{ color: '#3b4252', fontSize: '13px', padding: '10px' }}>暂无记录</div>
            )}
          </div>
        </section>

        {/* 配置区 */}
        <section className="form-card">
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#81a1c1', marginBottom: '8px' }}>自定义显示名称</label>
            <input 
              className="input-box" 
              placeholder="留空则自动抓取文件名" 
              value={customName} 
              onChange={(e) => setCustomName(e.target.value)} 
            />
          </div>

          <PathSelector 
            label="Proton 脚本路径" 
            value={config.proton} 
            placeholder="选择 proton 文件的绝对路径" 
            onSelect={(p) => setConfig({ ...config, proton: p })} 
          />
          <PathSelector 
            label="PFX 容器目录 (Compatdata)" 
            value={config.prefix} 
            isDirectory 
            placeholder="选择该游戏的运行环境目录" 
            onSelect={(p) => setConfig({ ...config, prefix: p })} 
          />
          <PathSelector 
            label="游戏主程序 (EXE)" 
            value={config.game} 
            placeholder="选择游戏的 exe 可执行文件" 
            onSelect={(p) => setConfig({ ...config, game: p })} 
          />
        </section>

        {/* 启动按钮 */}
        <button
          onClick={() => handleLaunch()}
          disabled={isLoading}
          style={{
            padding: "18px",
            backgroundColor: isLoading ? "#4c566a" : "#5e81ac",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: isLoading ? "not-allowed" : "pointer",
            boxShadow: '0 4px 15px rgba(94, 129, 172, 0.3)',
            transition: 'background 0.2s'
          }}
        >
          {isLoading ? "正在引导进程..." : "启动游戏"}
        </button>

        {/* 日志终端 */}
        <div className="log-terminal">
          <div style={{ color: '#4c566a', borderBottom: '1px solid #1a1c25', marginBottom: '8px', paddingBottom: '4px' }}>系统日志:</div>
          {logs.map((log, i) => (
            <div key={i}>
              <span style={{ color: '#5e81ac', marginRight: '8px' }}>{" > "}</span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;