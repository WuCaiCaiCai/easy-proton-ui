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
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#81a1c1' }}>{label}</label>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                    value={value} readOnly placeholder={placeholder}
                    style={{ 
                        flex: 1, padding: '10px', borderRadius: '6px', 
                        border: '1px solid #3b4252', backgroundColor: '#2e3440', 
                        color: '#eceff4', fontSize: '13px' 
                    }} 
                />
                <button 
                    onClick={handleSelect}
                    style={{ 
                        padding: '0 15px', borderRadius: '6px', border: 'none', 
                        backgroundColor: '#4c566a', color: '#fff', cursor: 'pointer' 
                    }}
                >
                    选择
                </button>
            </div>
        </div>
    );
}