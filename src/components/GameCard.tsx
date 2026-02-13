import { useState } from "react";
import type { GameRecord } from "../types";

interface Props {
  record: GameRecord;
  onClick: () => void;
  onEdit: () => void;
}

export function GameCard({ record, onClick, onEdit }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  // 检查是否有gamescope配置
  const hasGamescope = record.gamescope?.enabled;
  const hasFSR = record.gamescope?.use_fsr;
  const fsrMode = record.gamescope?.fsr_mode;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: "140px",
        padding: "15px",
        backgroundColor: "#1e2233",
        borderRadius: "14px",
        cursor: "pointer",
        border: "1px solid #2e3440",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* 编辑按钮 */}
      {isHovered && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "rgba(46, 52, 64, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            border: "1px solid #4c566a",
          }}
          title="编辑游戏"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#81a1c1" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      )}

      {/* Gamescope状态指示器 */}
      {hasGamescope && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: hasFSR ? "rgba(163, 190, 140, 0.2)" : "rgba(94, 129, 172, 0.2)",
            border: `1px solid ${hasFSR ? "#a3be8c" : "#5e81ac"}`,
            fontSize: "9px",
            color: hasFSR ? "#a3be8c" : "#5e81ac",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            zIndex: 5,
          }}
          title={`Gamescope${hasFSR ? ` + ${fsrMode?.toUpperCase() || 'FSR'}` : ''}`}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="4" />
            <path d="M8 12h8M12 8v8" />
          </svg>
          {hasFSR ? (fsrMode?.toUpperCase() || 'FSR') : 'GS'}
        </div>
      )}

      <div
        style={{
          width: "100px",
          height: "100px",
          marginBottom: "12px",
          backgroundColor: "#0f111a",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 使用更符合软件质感的 SVG 图标替代 Emoji */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4c566a" strokeWidth="1.5">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 12h4M8 10v4M15 13v.01M18 11v.01" />
        </svg>
      </div>

      <div style={{
        fontSize: "13px",
        fontWeight: "600",
        color: "#d8dee9",
        width: "100%",
        textAlign: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }}>
        {record.name}
      </div>

      {/* 分辨率显示 */}
      {hasGamescope && record.gamescope?.width && record.gamescope?.height && (
        <div style={{
          fontSize: "10px",
          color: "#81a1c1",
          marginTop: "2px",
          backgroundColor: "rgba(46, 52, 64, 0.3)",
          padding: "2px 6px",
          borderRadius: "4px",
        }}>
          {record.gamescope.width}×{record.gamescope.height}
        </div>
      )}

      <div style={{
        fontSize: "10px",
        color: "#4c566a",
        marginTop: "4px",
        width: "100%",
        textAlign: "center"
      }}>
        {new Date(record.time).toLocaleDateString()}
      </div>
    </div>
  );
}
