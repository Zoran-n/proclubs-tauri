import { useState } from "react";
import { Check } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { THEMES } from "../../types";

export function SettingsTab() {
  const { theme, darkMode, showAnimations, showLogs, showIdSearch, fontSize,
    proxyUrl, setTheme, setDarkMode, setShowAnimations, setShowLogs,
    setShowIdSearch, setFontSize, persistSettings, applyProxy } = useAppStore();

  const [localProxy, setLocalProxy] = useState(proxyUrl);
  const [proxySaved, setProxySaved] = useState(false);

  const apply = (fn: () => void) => { fn(); persistSettings(); };

  const saveProxy = async () => {
    await applyProxy(localProxy);
    await persistSettings();
    setProxySaved(true);
    setTimeout(() => setProxySaved(false), 2000);
  };

  const Section = ({ label }: { label: string }) => (
    <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif",
      letterSpacing: "0.1em", marginTop: 18, marginBottom: 8 }}>
      {label}
    </div>
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>
      <div onClick={() => apply(() => onChange(!value))} style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, cursor: "pointer",
        background: value ? "var(--accent)" : "rgba(255,255,255,0.12)",
        position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          position: "absolute", top: 3, left: value ? 17 : 3,
          width: 14, height: 14, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 14px 20px" }}>

      {/* ── APPARENCE ── */}
      <Section label="APPARENCE" />
      <Toggle label="Mode sombre" value={darkMode} onChange={setDarkMode} />

      {/* ── THEME DE COULEUR ── */}
      <Section label="THEME DE COULEUR" />
      <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button key={t.id} title={t.label} onClick={() => apply(() => setTheme(t.id))} style={{
              width: 38, height: 38, borderRadius: 8, padding: 0, cursor: "pointer",
              border: active ? `2px solid ${t.color}` : "2px solid var(--border)",
              background: `linear-gradient(135deg, #0d1117 50%, ${t.color} 50%)`,
              transform: active ? "scale(1.12)" : "scale(1)",
              transition: "all 0.15s", flexShrink: 0,
              outline: active ? `2px solid ${t.color}` : "none",
              outlineOffset: 2,
            }} />
          );
        })}
      </div>

      {/* ── TAILLE DU TEXTE ── */}
      <Section label="TAILLE DU TEXTE" />
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        {(["small", "medium", "large"] as const).map((s, i) => {
          const active = fontSize === s;
          const sizes = [11, 14, 17];
          return (
            <button key={s} onClick={() => apply(() => setFontSize(s))} style={{
              flex: 1, padding: "8px 4px",
              background: active ? "var(--accent)" : "var(--card)",
              color: active ? "#000" : "var(--text)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 6, cursor: "pointer",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: sizes[i], lineHeight: 1,
              transition: "all 0.15s",
            }}>A</button>
          );
        })}
      </div>

      {/* ── EFFETS VISUELS ── */}
      <Section label="EFFETS VISUELS" />
      <Toggle label="Animations" value={showAnimations} onChange={setShowAnimations} />

      {/* ── INTERFACE ── */}
      <Section label="INTERFACE" />
      <Toggle label="Afficher les logs"  value={showLogs}     onChange={setShowLogs} />
      <Toggle label="Recherche par ID"   value={showIdSearch} onChange={setShowIdSearch} />

      {/* ── PROXY ── */}
      <Section label="PROXY HTTP/SOCKS5" />
      <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8, lineHeight: 1.6 }}>
        Contourne le blocage Akamai de l'API EA.<br />
        Ex: <span style={{ color: "var(--accent)", fontFamily: "monospace" }}>http://user:pass@host:port</span>
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={localProxy} onChange={(e) => setLocalProxy(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveProxy()}
          placeholder="http://... ou socks5://..."
          style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
            padding: "6px 8px", borderRadius: 4, fontSize: 11, outline: "none", fontFamily: "monospace" }}
        />
        <button onClick={saveProxy} style={{
          padding: "6px 10px", background: proxySaved ? "var(--green)" : "var(--accent)",
          color: "#000", border: "none", borderRadius: 4, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, fontSize: 11,
          transition: "background 0.2s", flexShrink: 0,
        }}>
          {proxySaved ? <><Check size={12} /> OK</> : "Appliquer"}
        </button>
      </div>
      {proxyUrl && (
        <p style={{ fontSize: 10, color: "var(--green)", marginTop: 6 }}>✓ Proxy actif</p>
      )}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, color: "var(--muted)" }}>ProClubs Stats v0.1.0</p>
        <p style={{ fontSize: 10, color: "var(--border)" }}>Tauri 2 · Rust · React</p>
      </div>
    </div>
  );
}
