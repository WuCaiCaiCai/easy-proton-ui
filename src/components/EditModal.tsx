/**
 * EditModal 组件
 * 
 * 用于编辑游戏记录：
 * - 修改游戏显示名称
 * - 修改游戏可执行文件路径
 * - 查看 Proton 和 Wine 前缀信息
 * - 删除游戏记录
 */

import { useState, useEffect } from "react";
import type { GameRecord } from "../types";
import { PathSelector } from "./PathSelector";

interface Props {
  record: GameRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: GameRecord) => void;
  onDelete: (recordId: string) => void;
}

export function EditModal({ record, isOpen, onClose, onSave, onDelete }: Props) {
  // ========================================
  // 状态定义
  // ========================================

  // 编辑中的记录副本
  const [editedRecord, setEditedRecord] = useState<GameRecord | null>(null);
  
  // 删除操作的加载状态
  const [isDeleting, setIsDeleting] = useState(false);

  // ========================================
  // 生命周期
  // ========================================

  /**
   * 当记录变化时重置编辑状态
   */
  useEffect(() => {
    if (record) {
      setEditedRecord({ ...record });
      setIsDeleting(false);
    }
  }, [record]);

  // 如果对话框未打开或没有记录，则不渲染任何内容
  if (!isOpen || !record || !editedRecord) return null;

  // ========================================
  // 事件处理
  // ========================================

  /**
   * 保存编辑内容
   */
  const handleSave = () => {
    if (editedRecord) {
      onSave(editedRecord);
      onClose();
    }
  };

  /**
   * 删除游戏记录
   */
  const handleDelete = () => {
    if (window.confirm(`确定要删除游戏 "${record.name}" 吗？`)) {
      setIsDeleting(true);
      onDelete(record.game);
      onClose();
    }
  };

  /**
   * 背景点击关闭对话框
   */
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ========================================
  // 渲染
  // ========================================

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--color-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
    >
      {/* 对话框容器 */}
      <div
        style={{
          backgroundColor: "var(--color-modal-bg)",
          backgroundImage: "linear-gradient(145deg, rgba(255, 255, 255, 0.04), transparent)",
          borderRadius: "20px",
          padding: "30px",
          width: "500px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          border: "2px solid var(--color-modal-border)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          color: "var(--color-text-primary)",
          backdropFilter: "blur(18px)",
        }}
      >
        {/* 标题栏 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--color-modal-border)",
            paddingBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "var(--color-accent-primary)",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            ✏️  编辑游戏
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-close-button)",
              fontSize: "28px",
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-close-button-hover)";
              e.currentTarget.style.backgroundColor = "var(--color-close-button-hover-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-close-button)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {/* 游戏信息预览 */}
        <div
          style={{
            backgroundColor: "var(--color-modal-section-bg)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid var(--color-modal-section-border)",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--color-accent-strong)", marginBottom: "8px", fontWeight: 500 }}>
            当前游戏
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "var(--color-card-icon-bg)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-accent)" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <line x1="1" y1="3" x2="23" y2="3"></line>
                <path d="M10 12l4 0M12 9l0 6"></path>
              </svg>
            </div>
            <div>
              <div>{record.name}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                {record.game.split(/[\\/]/).pop()}
              </div>
            </div>
          </div>
        </div>

        {/* 编辑表单 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* 游戏名称 */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-accent-strong)",
                marginBottom: "8px",
              }}
            >
              🎮 显示名称
            </label>
            <input
              value={editedRecord.name}
              onChange={(e) =>
                setEditedRecord({ ...editedRecord, name: e.target.value })
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-input-border)",
                backgroundColor: "var(--color-input-bg)",
                color: "var(--color-input-text)",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-button-primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-input-border)")}
            />
          </div>

          {/* 游戏 EXE 路径 */}
          <PathSelector
            label="🎯 游戏主程序"
            value={editedRecord.game}
            placeholder="选择新的游戏 .exe 文件"
            onSelect={(p) => setEditedRecord({ ...editedRecord, game: p })}
          />

          {/* Proton 路径（只读） */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-accent-strong)",
                marginBottom: "8px",
              }}
            >
              ⚙️  Proton 路径 (只读)
            </label>
            <div
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-modal-border)",
                backgroundColor: "var(--color-card-icon-bg)",
                color: "var(--color-text-secondary)",
                fontSize: "13px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={editedRecord.proton}
            >
              {editedRecord.proton || "未设置"}
            </div>
          </div>

          {/* Wine 前缀路径（只读） */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-accent-strong)",
                marginBottom: "8px",
              }}
            >
              📁 Wine 前缀 (只读)
            </label>
            <div
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-modal-border)",
                backgroundColor: "var(--color-card-icon-bg)",
                color: "var(--color-text-secondary)",
                fontSize: "13px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={editedRecord.prefix}
            >
              {editedRecord.prefix || "未设置"}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-modal-border)",
          }}
        >
          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "var(--color-button-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "var(--color-button-primary-shadow)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-button-primary-hover)";
              e.currentTarget.style.boxShadow = "var(--color-button-primary-shadow-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-button-primary)";
              e.currentTarget.style.boxShadow = "var(--color-button-primary-shadow)";
            }}
          >
            💾 保存更改
          </button>

          {/* 删除按钮 */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: "14px 20px",
              backgroundColor: isDeleting ? "var(--color-danger-muted)" : "var(--color-danger)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(191, 97, 106, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = "var(--color-danger-hover)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(191, 97, 106, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = "var(--color-danger)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(191, 97, 106, 0.3)";
              }
            }}
          >
            {isDeleting ? "🗑️  删除中..." : "🗑️  删除游戏"}
          </button>
        </div>

        {/* 提示信息 */}
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            textAlign: "center",
            fontStyle: "italic",
            paddingTop: "8px",
          }}
        >
          💡 Proton 和 Wine 前缀需要在主界面重新配置
        </div>
      </div>
    </div>
  );
}
