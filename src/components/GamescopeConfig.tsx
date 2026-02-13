import { useState } from "react";
import type { GamescopeConfig } from "../types";

interface Props {
  config: GamescopeConfig;
  onChange: (config: GamescopeConfig) => void;
}

export function GamescopeConfig({ config, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    onChange({ ...config, enabled: !config.enabled });
  };

  const handleResolutionChange = (field: 'width' | 'height', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onChange({ 
      ...config, 
      [field]: numValue && numValue > 0 ? numValue : undefined 
    });
  };

  const handleFsrModeChange = (mode: 'fsr1' | 'fsr2' | 'fsr3' | 'fsr4') => {
    onChange({ ...config, fsr_mode: mode });
  };

  const handleFsrSharpnessChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onChange({ 
      ...config, 
      fsr_sharpness: numValue !== undefined && numValue >= 0 && numValue <= 10 ? numValue : undefined 
    });
  };

  const handleFpsLimitChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onChange({ 
      ...config, 
      fps_limit: numValue && numValue > 0 ? numValue : undefined 
    });
  };

  const handleBooleanChange = (field: keyof GamescopeConfig, value: boolean) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div style={{
      backgroundColor: "rgba(15, 17, 26, 0.4)",
      borderRadius: "12px",
      padding: "16px",
      border: "1px solid #2e3440",
      marginTop: "16px",
    }}>
      {/* 标题和开关 */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: isExpanded ? "20px" : "0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#0f111a",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={config.enabled ? "#a3be8c" : "#4c566a"} strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="4" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#d8dee9" }}>
              Gamescope 设置
            </div>
            <div style={{ fontSize: "11px", color: "#4c566a", marginTop: "2px" }}>
              使用 Gamescope 进行游戏合成和缩放
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "none",
              border: "none",
              color: "#81a1c1",
              fontSize: "12px",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "rgba(46, 52, 64, 0.5)",
            }}
          >
            {isExpanded ? "收起" : "展开"}
          </button>
          
          <div style={{
            position: "relative",
            width: "44px",
            height: "24px",
          }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleToggle}
              style={{
                opacity: 0,
                width: 0,
                height: 0,
                position: "absolute",
              }}
              id="gamescope-toggle"
            />
            <label
              htmlFor="gamescope-toggle"
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: config.enabled ? "#5e81ac" : "#434c5e",
                borderRadius: "12px",
                transition: "background-color 0.2s",
              }}
            >
              <span style={{
                position: "absolute",
                content: "",
                height: "18px",
                width: "18px",
                left: config.enabled ? "22px" : "4px",
                bottom: "3px",
                backgroundColor: "#fff",
                borderRadius: "50%",
                transition: "left 0.2s",
              }} />
            </label>
          </div>
        </div>
      </div>

      {/* 展开的设置区域 */}
      {isExpanded && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          paddingTop: "16px",
          borderTop: "1px solid #2e3440",
        }}>
          {/* 分辨率设置 */}
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#81a1c1",
              marginBottom: "10px",
            }}>
              分辨率
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  min="1"
                  placeholder="宽度"
                  value={config.width || ""}
                  onChange={(e) => handleResolutionChange('width', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #3b4252",
                    backgroundColor: "#0f111a",
                    color: "#d8dee9",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                color: "#4c566a",
                fontSize: "14px",
              }}>
                ×
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  min="1"
                  placeholder="高度"
                  value={config.height || ""}
                  onChange={(e) => handleResolutionChange('height', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #3b4252",
                    backgroundColor: "#0f111a",
                    color: "#d8dee9",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <div style={{
              fontSize: "11px",
              color: "#4c566a",
              marginTop: "6px",
              fontStyle: "italic",
            }}>
              留空则使用游戏原生分辨率
            </div>
          </div>

          {/* FSR设置 */}
          <div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}>
              <label style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#81a1c1",
              }}>
                FSR 超分辨率
              </label>
              <div style={{
                position: "relative",
                width: "44px",
                height: "24px",
              }}>
                <input
                  type="checkbox"
                  checked={config.use_fsr}
                  onChange={(e) => handleBooleanChange('use_fsr', e.target.checked)}
                  style={{
                    opacity: 0,
                    width: 0,
                    height: 0,
                    position: "absolute",
                  }}
                  id="fsr-toggle"
                />
                <label
                  htmlFor="fsr-toggle"
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: config.use_fsr ? "#a3be8c" : "#434c5e",
                    borderRadius: "12px",
                    transition: "background-color 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute",
                    content: "",
                    height: "18px",
                    width: "18px",
                    left: config.use_fsr ? "22px" : "4px",
                    bottom: "3px",
                    backgroundColor: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.2s",
                  }} />
                </label>
              </div>
            </div>

            {config.use_fsr && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* FSR模式选择 */}
                <div>
                  <div style={{
                    fontSize: "12px",
                    color: "#81a1c1",
                    marginBottom: "8px",
                  }}>
                    FSR 版本
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {(['fsr1', 'fsr2', 'fsr3', 'fsr4'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleFsrModeChange(mode)}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: config.fsr_mode === mode ? "#5e81ac" : "#2e3440",
                          color: "#d8dee9",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FSR锐度 */}
                <div>
                  <div style={{
                    fontSize: "12px",
                    color: "#81a1c1",
                    marginBottom: "8px",
                  }}>
                    FSR 锐度 (0-10)
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={config.fsr_sharpness || 5}
                    onChange={(e) => handleFsrSharpnessChange(e.target.value)}
                    style={{
                      width: "100%",
                      height: "6px",
                      borderRadius: "3px",
                      backgroundColor: "#2e3440",
                      outline: "none",
                      WebkitAppearance: "none",
                    }}
                  />
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#4c566a",
                    marginTop: "4px",
                  }}>
                    <span>柔和 (0)</span>
                    <span>当前: {config.fsr_sharpness || 5}</span>
                    <span>锐利 (10)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 显示设置 */}
          <div>
            <div style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#81a1c1",
              marginBottom: "10px",
            }}>
              显示设置
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={config.fullscreen}
                  onChange={(e) => handleBooleanChange('fullscreen', e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "13px", color: "#d8dee9" }}>全屏</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={config.borderless}
                  onChange={(e) => handleBooleanChange('borderless', e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "13px", color: "#d8dee9" }}>无边框</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={config.vsync}
                  onChange={(e) => handleBooleanChange('vsync', e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "13px", color: "#d8dee9" }}>垂直同步</span>
              </label>
            </div>
          </div>

          {/* FPS限制 */}
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#81a1c1",
              marginBottom: "10px",
            }}>
              FPS 限制
            </label>
            <input
              type="number"
              min="1"
              placeholder="例如: 60, 120, 144"
              value={config.fps_limit || ""}
              onChange={(e) => handleFpsLimitChange(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #3b4252",
                backgroundColor: "#0f111a",
                color: "#d8dee9",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <div style={{
              fontSize: "11px",
              color: "#4c566a",
              marginTop: "6px",
              fontStyle: "italic",
            }}>
              留空则不限制FPS
            </div>
          </div>

          {/* 提示信息 */}
          <div style={{
            fontSize: "11px",
            color: "#4c566a",
            padding: "12px",
            backgroundColor: "rgba(46, 52, 64, 0.3)",
            borderRadius: "8px",
            borderLeft: "3px solid #5e81ac",
          }}>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>提示：</div>
            <div>• Gamescope 需要在系统中安装才能使用</div>
            <div>• FSR 4 需要最新的 Gamescope 版本支持</div>
            <div>• 建议为性能要求高的游戏启用 FSR</div>
          </div>
        </div>
      )}
    </div>
  );
}
