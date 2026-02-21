import { open } from "@tauri-apps/plugin-dialog";

interface Props {
    label: string;
    value: string;
    placeholder: string;
    isDirectory?: boolean;
    onSelect: (path: string) => void;
}

export function PathSelector({ label, value, placeholder, isDirectory, onSelect }: Props) {
    const handleSelect = async () => {
        const selected = await open({
            directory: isDirectory,
            multiple: false,
        });
        if (selected && typeof selected === 'string') {
            onSelect(selected);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-strong)' }}>{label}</label>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                    value={value} readOnly placeholder={placeholder}
                    style={{ 
                        flex: 1, padding: '10px', borderRadius: '6px', 
                        border: '1px solid var(--color-input-border)', backgroundColor: 'var(--color-input-bg)', 
                        color: 'var(--color-input-text)', fontSize: '13px',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.25)'
                    }} 
                />
                <button 
                    onClick={handleSelect}
                    style={{ 
                        padding: '0 15px', borderRadius: '6px', border: 'none', 
                        backgroundImage: 'linear-gradient(120deg, var(--color-button-primary), var(--color-button-secondary-hover))',
                        color: '#fff', cursor: 'pointer',
                        transition: 'background 0.2s ease, transform 0.2s ease',
                        boxShadow: 'var(--color-button-secondary-shadow)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = 'var(--color-button-secondary-shadow-hover)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--color-button-secondary-shadow)';
                    }}
                >
                    选择
                </button>
            </div>
        </div>
    );
}
