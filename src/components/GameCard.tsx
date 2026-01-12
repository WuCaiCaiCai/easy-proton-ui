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
                minWidth: '130px', padding: '15px', backgroundColor: '#2e3440',
                borderRadius: '8px', cursor: 'pointer', border: '1px solid #3b4252',
                textAlign: 'center', transition: 'transform 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
            <div style={{ fontSize: '30px', marginBottom: '8px' }}>🎮</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.name}
            </div>
            <div style={{ fontSize: '10px', color: '#88c0d0', marginTop: '5px' }}>
                {new Date(record.time).toLocaleDateString()}
            </div>
        </div>
    );
}