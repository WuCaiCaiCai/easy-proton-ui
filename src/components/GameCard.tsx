import type { GameRecord } from "../types";

interface Props {
  record: GameRecord;
  onClick: () => void;
  onEdit: () => void;
}

export function GameCard({ record, onClick, onEdit }: Props) {
  return (
    <div className="game-card" onClick={onClick}>
      <button
        className="game-card-edit"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="编辑游戏"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <div className="game-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 12h4M8 10v4M15 13v.01M18 11v.01" />
        </svg>
      </div>
      <div className="game-card-name" title={record.name}>{record.name}</div>
      <div className="game-card-date">{new Date(record.time).toLocaleDateString("zh-CN")}</div>
    </div>
  );
}
