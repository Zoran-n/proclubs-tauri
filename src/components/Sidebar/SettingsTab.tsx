import { useAppStore } from "../../store/useAppStore";
import { THEMES } from "../../types";

export function SettingsTab() {
  const { theme, darkMode, showGrid, showAnimations, showLogs, showIdSearch, fontSize,
    setTheme, setDarkMode, setShowGrid, setShowAnimations, setShowLogs, setShowIdSearch,
    setFontSize, persistSettings } = useAppStore();

  const apply = (fn: () => void) => { fn(); persistSettings(); };

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
      <span style={{ fontSize: 12, color: "var(--text)" }}>{label}</span>
      <div onClick={() => apply(() => onChange(!value))}
        style={{ width: 32, height: 18, borderRadius: 9, background: value ? "var(--accent)" : "var(--border)", position: "relative", transition: "background 0.2s", cursor: "pointer" }}>
        <div style={{ position: "absolute", top: 2, left: value ? 14 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </div>
    </label>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
      <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 10 }}>
        THÈME COULEUR
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {THEMES.map((t) => (
          <button key={t.id} title={t.label} onClick={() => apply(() => setTheme(t.id))}
            style={{ width: 28, height: 28, borderRadius: "50%", background: t.color, border: theme === t.id ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", transform: theme === t.id ? "scale(1.15)" : "scale(1)", transition: "all 0.15s" }} />
        ))}
      </div>

      <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
        TAILLE DE POLICE
      </label>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["small", "medium", "large"] as const).map((s) => (
          <button key={s} onClick={() => apply(() => setFontSize(s))}
            style={{ flex: 1, padding: "5px", background: fontSize === s ? "var(--accent)" : "var(--card)", color: fontSize === s ? "#000" : "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
            {s === "small" ? "S" : s === "medium" ? "M" : "L"}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
        OPTIONS
      </label>
      <Toggle label="Mode sombre" value={darkMode} onChange={setDarkMode} />
      <Toggle label="Grille en arrière-plan" value={showGrid} onChange={setShowGrid} />
      <Toggle label="Animations" value={showAnimations} onChange={setShowAnimations} />
      <Toggle label="Afficher les logs" value={showLogs} onChange={setShowLogs} />
      <Toggle label="Recherche par ID" value={showIdSearch} onChange={setShowIdSearch} />

      <div style={{ marginTop: 20, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, color: "var(--muted)" }}>ProClubs Stats v0.1.0</p>
        <p style={{ fontSize: 10, color: "var(--border)" }}>Tauri 2 · Rust · React</p>
      </div>
    </div>
  );
}
