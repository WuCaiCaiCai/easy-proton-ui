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
    const selected = await open({ directory: isDirectory, multiple: false });
    if (selected && typeof selected === "string") onSelect(selected);
  };

  return (
    <div className="path-selector">
      <label className="field-label">{label}</label>
      <div className="path-row">
        <input className="path-input" value={value} readOnly placeholder={placeholder} />
        <button className="path-btn" onClick={handleSelect}>选择</button>
      </div>
    </div>
  );
}
