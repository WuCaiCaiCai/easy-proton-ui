/**
 * GameCard 组件
 * 
 * 显示单个游戏的快速启动卡片：
 * - 游戏名称和图标
 * - 最后运行时间
 * - 编辑按钮
 */

import { useState } from "react";
import type { GameRecord } from "../types";

interface Props {
  record: GameRecord;
  onClick: () => void;
  onEdit: () => void;
}

export function GameCard({ record, onClick, onEdit }: Props) {
  // ========================================
  // 状态定义
  // ========================================
  const [isHovered, setIsHovered] = useState(false);

  // ========================================
  // 渲染
  // ========================================
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: "140px",
        padding: "15px",
        backgroundColor: "var(--color-card-bg)",
        backgroundImage: "linear-gradient(140deg, rgba(255, 255, 255, 0.06), transparent)",
        borderRadius: "14px",
        cursor: "pointer",
        border: "1px solid var(--color-card-border)",
        transition: "all 0.2s ease-in-out",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered ? "var(--color-card-shadow-hover)" : "var(--color-card-shadow)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* 编辑按钮（Hover 时显示） */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "var(--color-edit-button-bg)",
            border: "1px solid var(--color-edit-button-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            transition: "all 0.2s",
            padding: "0",
            color: "var(--color-text-primary)",
          }}
          title="编辑游戏"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-edit-button-hover-bg)";
            e.currentTarget.style.boxShadow = "var(--color-edit-button-hover-shadow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-edit-button-bg)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}

      {/* 游戏图标 */}
      <div
        style={{
          width: "100px",
          height: "100px",
          marginBottom: "12px",
          backgroundColor: "var(--color-card-icon-bg)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--color-card-icon-border)",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-card-icon-stroke)" strokeWidth="1.5">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 12h4M8 10v4M15 13v.01M18 11v.01" />
        </svg>
      </div>

      {/* 游戏名称 */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: "600",
          color: "var(--color-text-primary)",
          width: "100%",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: "4px",
        }}
        title={record.name}
      >
        {record.name}
      </div>

      {/* 运行时间 */}
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-text-secondary)",
          width: "100%",
          textAlign: "center",
        }}
      >
        {new Date(record.time).toLocaleDateString("zh-CN")}
      </div>
    </div>
  );
}
