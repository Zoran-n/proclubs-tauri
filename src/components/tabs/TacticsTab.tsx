import { useState } from "react";
import { Save, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { FORMATIONS, type Tactic } from "../../types";

const FORMATION_POSITIONS: Record<string, { x: number; y: number; role: string }[]> = {
  "4-4-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 15, y: 45, role: "LM" }, { x: 37, y: 45, role: "CM" }, { x: 63, y: 45, role: "CM" }, { x: 85, y: 45, role: "RM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "4-3-3": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 25, y: 45, role: "CM" }, { x: 50, y: 45, role: "CDM" }, { x: 75, y: 45, role: "CM" },
    { x: 15, y: 20, role: "LW" }, { x: 50, y: 20, role: "ST" }, { x: 85, y: 20, role: "RW" },
  ],
  "4-2-3-1": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 35, y: 55, role: "CDM" }, { x: 65, y: 55, role: "CDM" },
    { x: 15, y: 35, role: "LM" }, { x: 50, y: 35, role: "CAM" }, { x: 85, y: 35, role: "RM" },
    { x: 50, y: 15, role: "ST" },
  ],
  "3-5-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 25, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 75, y: 68, role: "CB" },
    { x: 10, y: 45, role: "LM" }, { x: 30, y: 45, role: "CM" }, { x: 50, y: 45, role: "CDM" }, { x: 70, y: 45, role: "CM" }, { x: 90, y: 45, role: "RM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "4-1-2-1-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 70, role: "LB" }, { x: 37, y: 70, role: "CB" }, { x: 63, y: 70, role: "CB" }, { x: 85, y: 70, role: "RB" },
    { x: 50, y: 57, role: "CDM" },
    { x: 25, y: 43, role: "CM" }, { x: 75, y: 43, role: "CM" },
    { x: 50, y: 30, role: "CAM" },
    { x: 30, y: 15, role: "ST" }, { x: 70, y: 15, role: "ST" },
  ],
  "5-3-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 10, y: 68, role: "LWB" }, { x: 28, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 72, y: 68, role: "CB" }, { x: 90, y: 68, role: "RWB" },
    { x: 25, y: 45, role: "CM" }, { x: 50, y: 45, role: "CM" }, { x: 75, y: 45, role: "CM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "4-5-1": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 10, y: 45, role: "LM" }, { x: 30, y: 45, role: "CM" }, { x: 50, y: 45, role: "CM" }, { x: 70, y: 45, role: "CM" }, { x: 90, y: 45, role: "RM" },
    { x: 50, y: 18, role: "ST" },
  ],
  "3-4-3": [
    { x: 50, y: 90, role: "GK" },
    { x: 25, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 75, y: 68, role: "CB" },
    { x: 15, y: 48, role: "LM" }, { x: 37, y: 48, role: "CM" }, { x: 63, y: 48, role: "CM" }, { x: 85, y: 48, role: "RM" },
    { x: 15, y: 20, role: "LW" }, { x: 50, y: 20, role: "ST" }, { x: 85, y: 20, role: "RW" },
  ],
  "4-2-2-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 35, y: 52, role: "CDM" }, { x: 65, y: 52, role: "CDM" },
    { x: 25, y: 33, role: "CAM" }, { x: 75, y: 33, role: "CAM" },
    { x: 35, y: 15, role: "ST" }, { x: 65, y: 15, role: "ST" },
  ],
};

const SLIDERS = [
  { key: "defensiveStyle", label: "Style défensif" },
  { key: "defensiveWidth", label: "Largeur déf." },
  { key: "defensiveDepth", label: "Profondeur" },
  { key: "offensiveStyle", label: "Style offensif" },
  { key: "offensiveWidth", label: "Largeur off." },
  { key: "playersInBox",   label: "Joueurs ds la boîte" },
];

const defaultTactic = (): Tactic => ({
  id: Date.now().toString(),
  name: "Nouvelle tactique",
  formation: "4-3-3",
  sliders: Object.fromEntries(SLIDERS.map((s) => [s.key, 50])),
  notes: "",
  eaCode: "",
});

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  padding: "7px 10px",
  borderRadius: 6,
  fontSize: 12,
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

export function TacticsTab() {
  const { tactics, saveTactic, deleteTactic, persistSettings } = useAppStore();
  const [current, setCurrent] = useState<Tactic>(defaultTactic());

  const handleSave = () => { saveTactic(current); persistSettings(); };
  const handleLoad = (t: Tactic) => setCurrent({ ...t });
  const handleDelete = (id: string) => {
    deleteTactic(id);
    persistSettings();
    if (current.id === id) setCurrent(defaultTactic());
  };

  const positions = FORMATION_POSITIONS[current.formation] ?? FORMATION_POSITIONS["4-3-3"];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Left: pitch ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 12,
        overflow: "hidden", minWidth: 0 }}>

        {/* Formation dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <label style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em",
            fontFamily: "'Bebas Neue', sans-serif", whiteSpace: "nowrap" }}>
            FORMATION
          </label>
          <select
            value={current.formation}
            onChange={(e) => setCurrent((c) => ({ ...c, formation: e.target.value }))}
            style={{ ...INPUT, width: "auto", flex: 1, cursor: "pointer" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          >
            {FORMATIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* SVG pitch — fills remaining space */}
        <div style={{ flex: 1, background: "#0a1f0a", borderRadius: 10, border: "1px solid var(--border)",
          overflow: "hidden", minHeight: 0, display: "flex", alignItems: "stretch" }}>
          <svg viewBox="0 0 100 130" style={{ width: "100%", height: "100%", display: "block" }}
            preserveAspectRatio="xMidYMid meet">
            {/* Pitch background */}
            <rect x="0" y="0" width="100" height="130" fill="#0d2010" />
            {Array.from({ length: 7 }).map((_, i) => (
              <rect key={i} x="0" y={i * 18 + 5} width="100" height="9" fill="#0f2312" />
            ))}
            {/* Outer lines */}
            <rect x="5" y="5" width="90" height="120" fill="none" stroke="#1a4020" strokeWidth="0.8" />
            {/* Centre line */}
            <line x1="5" y1="65" x2="95" y2="65" stroke="#1a4020" strokeWidth="0.5" />
            <circle cx="50" cy="65" r="10" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            <circle cx="50" cy="65" r="0.8" fill="#1a4020" />
            {/* Top penalty area */}
            <rect x="22" y="5" width="56" height="18" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            <rect x="35" y="5" width="30" height="7" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            <circle cx="50" cy="16" r="0.8" fill="#1a4020" />
            {/* Bottom penalty area */}
            <rect x="22" y="107" width="56" height="18" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            <rect x="35" y="118" width="30" height="7" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            <circle cx="50" cy="114" r="0.8" fill="#1a4020" />

            {/* Player positions — remap y from 0-100 → 10-120 */}
            {positions.map((pos, i) => {
              const px = pos.x;
              const py = 10 + (pos.y / 100) * 110;
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r="5" fill="var(--accent)" opacity="0.92" />
                  <text x={px} y={py + 0.5} textAnchor="middle" dominantBaseline="middle"
                    fontSize="3" fill="#000" fontWeight="bold">
                    {pos.role}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Right: controls ──────────────────────────────────────── */}
      <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 10, padding: 14,
        borderLeft: "1px solid var(--border)", overflowY: "auto", background: "var(--surface)" }}>

        {/* Tactic name */}
        <input value={current.name}
          onChange={(e) => setCurrent((c) => ({ ...c, name: e.target.value }))}
          placeholder="Nom de la tactique"
          style={INPUT}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        {/* Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SLIDERS.map(({ key, label }) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{label}</span>
                <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>
                  {Math.round(current.sliders[key] ?? 50)}
                </span>
              </div>
              <input type="range" min={0} max={100} value={current.sliders[key] ?? 50}
                onChange={(e) => setCurrent((c) => ({
                  ...c, sliders: { ...c.sliders, [key]: Number(e.target.value) },
                }))}
                style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
              />
            </div>
          ))}
        </div>

        {/* EA Code */}
        <input value={current.eaCode ?? ""}
          onChange={(e) => setCurrent((c) => ({ ...c, eaCode: e.target.value }))}
          placeholder="Code EA (8 car.)" maxLength={8}
          style={{ ...INPUT, textTransform: "uppercase", fontFamily: "monospace" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        {/* Notes */}
        <textarea value={current.notes}
          onChange={(e) => setCurrent((c) => ({ ...c, notes: e.target.value }))}
          placeholder="Notes…" rows={3}
          style={{ ...INPUT, resize: "none", lineHeight: 1.5 }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        {/* Save button */}
        <button onClick={handleSave} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 14px", background: "rgba(0,212,255,0.12)",
          border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6,
          color: "var(--accent)", fontSize: 12, cursor: "pointer",
          fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
          transition: "background 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.12)")}
        >
          <Save size={13} /> SAUVEGARDER
        </button>

        {/* Saved tactics list */}
        {tactics.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>
              SAUVEGARDÉES
            </p>
            {tactics.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4,
                padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <button onClick={() => handleLoad(t)} style={{
                  flex: 1, textAlign: "left", background: "none", border: "none",
                  cursor: "pointer", padding: 0,
                }}>
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{t.name}</span>
                  <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 6 }}>{t.formation}</span>
                </button>
                <button onClick={() => handleDelete(t.id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--muted)", padding: 2, display: "flex",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New tactic button */}
        <button onClick={() => setCurrent(defaultTactic())} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "6px 14px", background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 6, color: "var(--muted)", fontSize: 11, cursor: "pointer",
        }}>
          <Plus size={11} /> Nouvelle
        </button>
      </div>
    </div>
  );
}
