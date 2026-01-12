import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";

// 引入我们拆分出去的模块
import type { AppConfig, GameRecord } from "./types";
import { GameCard } from "./components/GameCard";
import { PathSelector } from "./components/PathSelector";


const store = new LazyStore(".proton_history.json");

function App() {
  const [config, setConfig] = useState<AppConfig>({ proton: "", prefix: "", game: "" });
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载配置和历史
  useEffect(() => {
    invoke("load_config").then((res: any) => res && setConfig(res)).catch(console.error);
    store.get<GameRecord[]>("history").then(data => data && setHistory(data));
  }, []);

  const handleLaunch = async (overrideConfig?: AppConfig) => {
    const target = overrideConfig || config;
    if (!target.proton || !target.prefix || !target.game) {
      alert("路径不完整");
      return;
    }

    setIsLoading(true);
    setLogs(p => [...p, `正在启动: ${target.game}`]);

    try {
      // 注意：这里调用的是 Rust 里的 launch_proton
      await invoke("launch_proton", { config: target, envs: "" });
      
      // 保存到历史记录
      const name = target.game.split(/[\\/]/).pop()?.replace(".exe", "") || "未知";
      const newRecord: GameRecord = { ...target, name, time: Date.now() };
      
      // 更新历史 (去重)
      const newHistory = [newRecord, ...history.filter(h => h.game !== target.game)];
      setHistory(newHistory);
      store.set("history", newHistory);
      store.save();
      
      // 保存最后一次配置
      invoke("save_config", { config: target });

    } catch (err: any) {
      setLogs(p => [...p, `[错误] ${err}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '30px', height: '100vh', boxSizing: 'border-box',
      backgroundColor: '#0f111a', color: '#eceff4', fontFamily: 'sans-serif',
      display: 'flex', flexDirection: 'column', gap: '20px'
    }}>
      <h1 style={{ color: '#88c0d0', margin: 0 }}>EasyProton 🚀</h1>

      {/* 游戏库区域 */}
      <div>
        <h3 style={{ fontSize: '14px', color: '#666' }}>最近游戏</h3>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '5px' }}>
          {history.length === 0 && <span style={{fontSize: '12px'}}>暂无记录</span>}
          {history.map(record => (
            <GameCard 
              key={record.game} 
              record={record} 
              onClick={() => { setConfig(record); handleLaunch(record); }} 
            />
          ))}
        </div>
      </div>

      <hr style={{ borderColor: '#2e3440' }} />

      {/* 路径选择区域 */}
      <PathSelector 
        label="Proton 路径 (runner)" 
        placeholder="选择 proton 文件" 
        value={config.proton} 
        onSelect={(p) => setConfig(prev => ({...prev, proton: p}))} 
      />
      <PathSelector 
        label="Prefix 容器 (pfx)" 
        placeholder="选择 pfx 文件夹" 
        value={config.prefix} 
        isDirectory={true}
        onSelect={(p) => setConfig(prev => ({...prev, prefix: p}))} 
      />
      <PathSelector 
        label="游戏执行文件 (exe)" 
        placeholder="选择游戏 exe" 
        value={config.game} 
        onSelect={(p) => setConfig(prev => ({...prev, game: p}))} 
      />

      {/* 启动按钮 */}
      <button 
        onClick={() => handleLaunch()}
        disabled={isLoading}
        style={{
          padding: '15px', backgroundColor: isLoading ? '#4c566a' : '#5e81ac',
          color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
        }}
      >
        {isLoading ? "运行中..." : "启动游戏"}
      </button>

      {/* 简易日志 */}
      <div style={{ flex: 1, backgroundColor: 'black', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#a3be8c', overflowY: 'auto' }}>
         {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

export default App;