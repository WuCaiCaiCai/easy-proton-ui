import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

function App() {
  const [config, setConfig] = useState({ proton: "", prefix: "", game: "" });
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 初始化加载配置
  useEffect(() => {
    invoke("load_config")
      .then((res: any) => setConfig(res))
      .catch(() => console.log("未找到预存配置"));
  }, []);

  const selectPath = async (target: 'proton' | 'prefix' | 'game') => {
    const selected = await open({
      directory: target === 'prefix',
      multiple: false,
    });
    if (selected && typeof selected === 'string') {
      const newConfig = { ...config, [target]: selected };
      setConfig(newConfig);
      // 选择后自动保存一次
      invoke("save_config", { config: newConfig }).catch(console.error);
    }
  };

  const handleLaunch = async () => {
    setIsLoading(true);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 准备启动...`]);
    try {
      const result = await invoke<string>("launch_proton", { config, envs: "" });
      setLogs(prev => [...prev, `[INFO] ${result}`]);
    } catch (err) {
      setLogs(prev => [...prev, `[ERROR] ${err}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      backgroundColor: '#0f111a', color: '#eceff4', fontFamily: 'sans-serif',
      boxSizing: 'border-box', overflow: 'hidden'
    }}>
      {/* 顶部标题栏 */}
      <div style={{ padding: '20px 30px', background: '#1a1c25', borderBottom: '1px solid #2e3440' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#88c0d0' }}>EasyProton 🚀</h1>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#d8dee9', opacity: 0.6 }}>现代化的 Proton 游戏启动方案</p>
      </div>

      {/* 主体区域 */}
      <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {[
          { label: 'Proton 脚本 (proton)', key: 'proton' },
          { label: 'Prefix 容器 (pfx)', key: 'prefix' },
          { label: '游戏程序 (exe)', key: 'game' },
        ].map((item) => (
          <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#81a1c1' }}>{item.label}</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                value={(config as any)[item.key]} 
                readOnly 
                placeholder="点击右侧选择路径..."
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #3b4252',
                  backgroundColor: '#2e3440', color: '#eceff4', outline: 'none'
                }} 
              />
              <button 
                onClick={() => selectPath(item.key as any)}
                style={{ 
                  padding: '0 20px', borderRadius: '6px', border: 'none', 
                  backgroundColor: '#4c566a', color: '#fff', cursor: 'pointer', transition: '0.2s'
                }}
              >选择</button>
            </div>
          </div>
        ))}

        <button 
          onClick={handleLaunch}
          disabled={isLoading}
          style={{ 
            marginTop: '10px', padding: '16px', borderRadius: '8px', border: 'none',
            backgroundColor: isLoading ? '#4c566a' : '#5e81ac', 
            color: '#fff', fontSize: '16px', fontWeight: 'bold', 
            cursor: isLoading ? 'not-allowed' : 'pointer', transition: '0.3s'
          }}
        >
          {isLoading ? "游戏运行中..." : "运行游戏"}
        </button>

        {/* 日志框 */}
        <div style={{ flex: 1, minHeight: '150px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>实时日志</span>
            <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', color: '#81a1c1', cursor: 'pointer', fontSize: '12px' }}>清空日志</button>
          </div>
          <div style={{ 
            flex: 1, backgroundColor: '#000', borderRadius: '8px', padding: '15px',
            fontSize: '13px', color: '#a3be8c', border: '1px solid #2e3440',
            overflowY: 'auto', whiteSpace: 'pre-wrap'
          }}>
            {logs.length === 0 ? <span style={{ color: '#4c566a' }}>等待输入...</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;