import type { GameRecord } from "../types";

interface Props {
  record: GameRecord;
  onClick: () => void;
}

export function GameCard({ record, onClick }: Props) {
  return (
    <div
      onClick={onClick}
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
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#5e81ac";
        e.currentTarget.style.transform = "translateY(-5px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2e3440";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
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
    </div>
  );
}