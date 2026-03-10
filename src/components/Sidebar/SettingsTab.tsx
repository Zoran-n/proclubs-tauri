import { useAppStore } from "../../store/useAppStore";
import { THEMES, THEME_COLORS } from "../../types";

export function SettingsTab() {
  const { theme, setTheme, persistSettings } = useAppStore();

  const handleTheme = (t: string) => {
    setTheme(t);
    persistSettings();
  };

  return (
    <div className="flex flex-col p-3 gap-4">
      {/* Color theme */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Thème couleur</p>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              title={t}
              onClick={() => handleTheme(t)}
              style={{ backgroundColor: THEME_COLORS[t] }}
              className={`w-7 h-7 rounded-full transition-all ${
                theme === t ? "ring-2 ring-white ring-offset-2 ring-offset-[#0d1117] scale-110" : "opacity-60 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Taille de police</p>
        <div className="flex gap-2">
          {[
            { label: "S", size: "14px" },
            { label: "M", size: "16px" },
            { label: "L", size: "18px" },
          ].map(({ label, size }) => (
            <button
              key={size}
              onClick={() => { document.documentElement.style.fontSize = size; }}
              className="px-3 py-1 text-sm bg-[#111820] text-slate-300 rounded border border-white/10 hover:border-[var(--accent)]/50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <p className="text-[10px] text-slate-600">ProClubs Stats v0.1.0</p>
        <p className="text-[10px] text-slate-700">Tauri 2 · React · Rust</p>
      </div>
    </div>
  );
}
