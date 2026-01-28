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
  const [editedRecord, setEditedRecord] = useState<GameRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 当记录变化时重置编辑状态
  useEffect(() => {
    if (record) {
      setEditedRecord({ ...record });
      setIsDeleting(false);
    }
  }, [record]);

  if (!isOpen || !record || !editedRecord) return null;

  const handleSave = () => {
    if (editedRecord) {
      onSave(editedRecord);
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除游戏 "${record.name}" 吗？`)) {
      setIsDeleting(true);
      onDelete(record.game);
      onClose();
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackgroundClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div 
        style={{
          backgroundColor: "#1e2233",
          borderRadius: "20px",
          padding: "30px",
          width: "500px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          border: "2px solid #2e3440",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* 标题栏 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #2e3440",
          paddingBottom: "16px",
          marginBottom: "8px",
        }}>
          <h2 style={{
            margin: 0,
            color: "#88c0d0",
            fontSize: "20px",
            fontWeight: 700,
          }}>
            编辑游戏
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#4c566a",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#bf616a"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#4c566a"}
          >
            ×
          </button>
        </div>

        {/* 游戏信息预览 */}
        <div style={{
          backgroundColor: "rgba(15, 17, 26, 0.4)",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid #2e3440",
        }}>
          <div style={{ fontSize: "12px", color: "#81a1c1", marginBottom: "8px" }}>当前游戏</div>
          <div style={{ 
            fontSize: "16px", 
            fontWeight: 600, 
            color: "#d8dee9",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#0f111a",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4c566a" strokeWidth="1.5">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h4M8 10v4M15 13v.01M18 11v.01" />
              </svg>
            </div>
            <div>
              <div>{record.name}</div>
              <div style={{ fontSize: "12px", color: "#4c566a", marginTop: "4px" }}>
                {record.game.split(/[\\/]/).pop()}
              </div>
            </div>
          </div>
        </div>

        {/* 编辑表单 */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          {/* 名称编辑 */}
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#81a1c1",
              marginBottom: "10px",
            }}>
              显示名称
            </label>
            <input
              value={editedRecord.name}
              onChange={(e) => setEditedRecord({ ...editedRecord, name: e.target.value })}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #3b4252",
                backgroundColor: "#0f111a",
                color: "#d8dee9",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#5e81ac"}
              onBlur={(e) => e.target.style.borderColor = "#3b4252"}
            />
            <div style={{
              fontSize: "11px",
              color: "#4c566a",
              marginTop: "6px",
              fontStyle: "italic",
            }}>
              修改游戏在列表中显示的名称
            </div>
          </div>

          {/* 游戏路径编辑 */}
          <div>
            <PathSelector
              label="游戏主程序"
              value={editedRecord.game}
              placeholder="选择新的游戏exe文件"
              onSelect={(p) => setEditedRecord({ ...editedRecord, game: p })}
            />
            <div style={{
              fontSize: "11px",
              color: "#4c566a",
              marginTop: "6px",
              fontStyle: "italic",
            }}>
              重新选择游戏的.exe可执行文件
            </div>
          </div>

          {/* Proton和前缀路径（只读显示） */}
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#81a1c1",
              marginBottom: "10px",
            }}>
              Proton路径
            </label>
            <div style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #2e3440",
              backgroundColor: "#0f111a",
              color: "#4c566a",
              fontSize: "14px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {editedRecord.proton || "未设置"}
            </div>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#81a1c1",
              marginBottom: "10px",
            }}>
              PFX容器目录
            </label>
            <div style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #2e3440",
              backgroundColor: "#0f111a",
              color: "#4c566a",
              fontSize: "14px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {editedRecord.prefix || "未设置"}
            </div>
          </div>
        </div>

        {/* 按钮组 */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
          paddingTop: "20px",
          borderTop: "1px solid #2e3440",
        }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "16px",
              backgroundColor: "#5e81ac",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(94, 129, 172, 0.3)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4c6793"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#5e81ac"}
          >
            保存更改
          </button>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: "16px 24px",
              backgroundColor: isDeleting ? "#434c5e" : "#bf616a",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(191, 97, 106, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = "#a5424a";
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = "#bf616a";
            }}
          >
            {isDeleting ? "删除中..." : "删除游戏"}
          </button>
        </div>

        {/* 提示信息 */}
        <div style={{
          fontSize: "11px",
          color: "#4c566a",
          textAlign: "center",
          marginTop: "8px",
          fontStyle: "italic",
        }}>
          提示：Proton和PFX路径需要在主界面重新设置
        </div>
      </div>
    </div>
  );
}