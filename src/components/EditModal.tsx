import { useState, useEffect } from "react";
import type { GameRecord } from "../types";
import { PathSelector } from "./PathSelector";

interface Props {
  record: GameRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: GameRecord) => void;
  onDelete: (id: string) => void;
}

export function EditModal({ record, isOpen, onClose, onSave, onDelete }: Props) {
  const [edited, setEdited] = useState<GameRecord | null>(null);

  useEffect(() => {
    if (record) setEdited({ ...record });
  }, [record]);

  if (!isOpen || !record || !edited) return null;

  const handleSave = () => { onSave(edited); onClose(); };
  const handleDelete = () => {
    if (window.confirm(`确定要删除游戏 "${record.name}" 吗？`)) {
      onDelete(record.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>编辑游戏</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-preview">
          <div className="modal-preview-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent)" }}>
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 12h4M8 10v4M15 13v.01M18 11v.01" />
            </svg>
          </div>
          <div>
            <div className="modal-preview-name">{record.name}</div>
            <div className="modal-preview-file">{record.game.split(/[\\/]/).pop()}</div>
          </div>
        </div>

        <div className="modal-form">
          <div>
            <label className="modal-label">显示名称</label>
            <input
              className="modal-input"
              value={edited.name}
              onChange={(e) => setEdited({ ...edited, name: e.target.value })}
            />
          </div>
          <PathSelector
            label="游戏主程序"
            value={edited.game}
            placeholder="选择新的游戏 .exe 文件"
            onSelect={(p) => setEdited({ ...edited, game: p })}
          />
          <div>
            <label className="modal-label">Proton 路径（只读）</label>
            <div className="modal-readonly" title={edited.proton}>{edited.proton || "未设置"}</div>
          </div>
          <div>
            <label className="modal-label">Wine 前缀（只读）</label>
            <div className="modal-readonly" title={edited.prefix}>{edited.prefix || "未设置"}</div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-save" onClick={handleSave}>保存更改</button>
          <button className="modal-delete" onClick={handleDelete}>删除游戏</button>
        </div>

        <div className="modal-tip">Proton 和 Wine 前缀需要在主界面重新配置</div>
      </div>
    </div>
  );
}
