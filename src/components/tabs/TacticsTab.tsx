import { useState } from "react";
import { Save, Trash2, Plus, RefreshCw } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getClubInfo } from "../../api/tauri";
import { FORMATIONS, type Tactic } from "../../types";
import { useT } from "../../i18n";

// Keys must match FORMATIONS values exactly (no dashes)
const FORMATION_POSITIONS: Record<string, { x: number; y: number; role: string }[]> = {
  "442": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 15, y: 45, role: "LM" }, { x: 37, y: 45, role: "CM" }, { x: 63, y: 45, role: "CM" }, { x: 85, y: 45, role: "RM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "433": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 25, y: 45, role: "CM" }, { x: 50, y: 45, role: "CDM" }, { x: 75, y: 45, role: "CM" },
    { x: 15, y: 20, role: "LW" }, { x: 50, y: 20, role: "ST" }, { x: 85, y: 20, role: "RW" },
  ],
  "4231": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 35, y: 55, role: "CDM" }, { x: 65, y: 55, role: "CDM" },
    { x: 15, y: 35, role: "LM" }, { x: 50, y: 35, role: "CAM" }, { x: 85, y: 35, role: "RM" },
    { x: 50, y: 15, role: "ST" },
  ],
  "4141": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 70, role: "LB" }, { x: 37, y: 70, role: "CB" }, { x: 63, y: 70, role: "CB" }, { x: 85, y: 70, role: "RB" },
    { x: 50, y: 57, role: "CDM" },
    { x: 15, y: 43, role: "LM" }, { x: 37, y: 43, role: "CM" }, { x: 63, y: 43, role: "CM" }, { x: 85, y: 43, role: "RM" },
    { x: 50, y: 18, role: "ST" },
  ],
  "4321": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 70, role: "LB" }, { x: 37, y: 70, role: "CB" }, { x: 63, y: 70, role: "CB" }, { x: 85, y: 70, role: "RB" },
    { x: 25, y: 52, role: "CM" }, { x: 50, y: 52, role: "CM" }, { x: 75, y: 52, role: "CM" },
    { x: 33, y: 33, role: "CAM" }, { x: 67, y: 33, role: "CAM" },
    { x: 50, y: 15, role: "ST" },
  ],
  "352": [
    { x: 50, y: 90, role: "GK" },
    { x: 25, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 75, y: 68, role: "CB" },
    { x: 10, y: 45, role: "LM" }, { x: 30, y: 45, role: "CM" }, { x: 50, y: 45, role: "CDM" }, { x: 70, y: 45, role: "CM" }, { x: 90, y: 45, role: "RM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "343": [
    { x: 50, y: 90, role: "GK" },
    { x: 25, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 75, y: 68, role: "CB" },
    { x: 15, y: 48, role: "LM" }, { x: 37, y: 48, role: "CM" }, { x: 63, y: 48, role: "CM" }, { x: 85, y: 48, role: "RM" },
    { x: 15, y: 20, role: "LW" }, { x: 50, y: 20, role: "ST" }, { x: 85, y: 20, role: "RW" },
  ],
  "532": [
    { x: 50, y: 90, role: "GK" },
    { x: 10, y: 68, role: "LWB" }, { x: 28, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 72, y: 68, role: "CB" }, { x: 90, y: 68, role: "RWB" },
    { x: 25, y: 45, role: "CM" }, { x: 50, y: 45, role: "CM" }, { x: 75, y: 45, role: "CM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "541": [
    { x: 50, y: 90, role: "GK" },
    { x: 10, y: 68, role: "LWB" }, { x: 28, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 72, y: 68, role: "CB" }, { x: 90, y: 68, role: "RWB" },
    { x: 15, y: 45, role: "LM" }, { x: 34, y: 45, role: "CM" }, { x: 50, y: 45, role: "CDM" }, { x: 66, y: 45, role: "CM" }, { x: 85, y: 45, role: "RM" },
    { x: 50, y: 18, role: "ST" },
  ],
};

const SLIDERS = [
  { key: "defensiveStyle", labelKey: "tactics.defStyle" },
  { key: "defensiveWidth", labelKey: "tactics.defWidth" },
  { key: "defensiveDepth", labelKey: "tactics.depth" },
  { key: "offensiveStyle", labelKey: "tactics.offStyle" },
  { key: "offensiveWidth", labelKey: "tactics.offWidth" },
  { key: "playersInBox",   labelKey: "tactics.playersInBox" },
];

const defaultTactic = (t: (k: string) => string): Tactic => ({
  id: Date.now().toString(),
  name: t("tactics.newTactic"),
  formation: "433",
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

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function TacticsTab() {
  const t = useT();
  const { tactics, saveTactic, deleteTactic, persistSettings, currentClub } = useAppStore();
  const [current, setCurrent] = useState<Tactic>(defaultTactic(t));
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleSave = () => { saveTactic(current); persistSettings(); };
  const handleLoad = (tc: Tactic) => setCurrent({ ...tc });
  const handleDelete = (id: string) => {
    deleteTactic(id);
    persistSettings();
    if (current.id === id) setCurrent(defaultTactic(t));
  };

  const handleImport = async () => {
    if (!currentClub) { setImportMsg(t("tactics.noClub")); return; }
    setImporting(true);
    setImportMsg(null);
    try {
      const info = await getClubInfo(currentClub.id, currentClub.platform) as Record<string, unknown> | null;
      if (!info) { setImportMsg(t("tactics.noData")); return; }

      // EA response: { clubId: { name, customKit, tactics?: { clubFormation, ... } } }
      const clubObj = (info[currentClub.id] ?? Object.values(info)[0]) as Record<string, unknown> | undefined;
      if (!clubObj) { setImportMsg(t("tactics.unknownStruct")); return; }

      const tactics = clubObj["tactics"] as Record<string, unknown> | undefined;
      const rawFormation = (
        tactics?.["clubFormation"] ?? tactics?.["formation"] ?? clubObj["formation"]
      ) as string | undefined;

      // Normalize: remove dashes, lowercase to match our keys
      const formation = rawFormation?.replace(/-/g, "") ?? null;

      const updates: Partial<Tactic> = {};
      if (formation && FORMATION_POSITIONS[formation]) {
        updates.formation = formation;
      }

      // Try slider values if available
      if (tactics) {
        const sliderMap: Record<string, string> = {
          defensiveStyle: "defensiveStyle",
          defensiveWidth: "defensiveWidth",
          defensiveDepth: "defensiveDepth",
          offensiveStyle: "offensiveStyle",
          offensiveWidth: "offensiveWidth",
          playersInBox: "playersInBox",
        };
        const newSliders: Record<string, number> = { ...current.sliders };
        let found = false;
        for (const [key, apiKey] of Object.entries(sliderMap)) {
          const val = tactics[apiKey];
          if (val !== undefined) {
            newSliders[key] = Number(val);
            found = true;
          }
        }
        if (found) updates.sliders = newSliders;
      }

      if (Object.keys(updates).length === 0) {
        setImportMsg(t("tactics.noTacticFound"));
      } else {
        setCurrent((c) => ({ ...c, ...updates }));
        setImportMsg(`${t("tactics.imported")} : ${updates.formation ?? current.formation}`);
      }
    } catch {
      setImportMsg(t("tactics.fetchError"));
    } finally {
      setImporting(false);
    }
  };

  const positions = FORMATION_POSITIONS[current.formation] ?? FORMATION_POSITIONS["433"];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Left: pitch ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 12,
        overflow: "hidden", minWidth: 0 }}>

        {/* Formation dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <label style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em",
            fontFamily: "'Bebas Neue', sans-serif", whiteSpace: "nowrap" }}>
            {t("tactics.formation")}
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

        {/* Import from current club */}
        {currentClub && (
          <button onClick={handleImport} disabled={importing} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 14px", background: "rgba(0,212,255,0.06)",
            border: "1px solid var(--border)", borderRadius: 6,
            color: importing ? "var(--muted)" : "var(--accent)", fontSize: 11, cursor: importing ? "default" : "pointer",
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
          }}>
            <RefreshCw size={11} style={{ animation: importing ? "spin 1s linear infinite" : "none" }} />
            {importing ? t("tactics.importing") : t("tactics.importFromClub")}
          </button>
        )}
        {importMsg && (
          <p style={{ fontSize: 10, color: "var(--muted)", margin: 0, textAlign: "center",
            fontStyle: "italic" }}>{importMsg}</p>
        )}

        {/* Tactic name */}
        <input value={current.name}
          onChange={(e) => setCurrent((c) => ({ ...c, name: e.target.value }))}
          placeholder={t("tactics.tacticName")}
          style={INPUT}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        {/* Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{t(s.labelKey)}</span>
                <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>
                  {Math.round(current.sliders[s.key] ?? 50)}
                </span>
              </div>
              <input type="range" min={0} max={100} value={current.sliders[s.key] ?? 50}
                onChange={(e) => setCurrent((c) => ({
                  ...c, sliders: { ...c.sliders, [s.key]: Number(e.target.value) },
                }))}
                style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
              />
            </div>
          ))}
        </div>

        {/* EA Code */}
        <div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>{t("tactics.eaCode")}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={current.eaCode ?? ""}
              onChange={(e) => setCurrent((c) => ({ ...c, eaCode: e.target.value.toUpperCase() }))}
              placeholder={t("tactics.chars")}
              maxLength={8}
              style={{ ...INPUT, textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.12em" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button onClick={() => setCurrent((c) => ({ ...c, eaCode: genCode() }))}
              title={t("tactics.genCode")}
              style={{ padding: "0 10px", background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 6, color: "var(--accent)", cursor: "pointer", fontSize: 10,
                flexShrink: 0, fontFamily: "'Bebas Neue', sans-serif" }}>
              GEN
            </button>
          </div>
          {current.eaCode && current.eaCode.length === 8 && (
            <div style={{ marginTop: 6, padding: "6px 10px", background: "var(--bg)",
              border: "1px solid var(--border)", borderRadius: 6, textAlign: "center",
              fontFamily: "monospace", fontSize: 16, letterSpacing: "0.18em",
              color: "var(--accent)", fontWeight: 700 }}>
              {current.eaCode}
            </div>
          )}
        </div>

        {/* Notes */}
        <textarea value={current.notes}
          onChange={(e) => setCurrent((c) => ({ ...c, notes: e.target.value }))}
          placeholder={t("tactics.notes")} rows={3}
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
          <Save size={13} /> {t("tactics.save")}
        </button>

        {/* Saved tactics list */}
        {tactics.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>
              {t("tactics.saved")}
            </p>
            {tactics.map((tc) => (
              <div key={tc.id} style={{ display: "flex", alignItems: "center", gap: 4,
                padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <button onClick={() => handleLoad(tc)} style={{
                  flex: 1, textAlign: "left", background: "none", border: "none",
                  cursor: "pointer", padding: 0,
                }}>
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{tc.name}</span>
                  <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 6 }}>{tc.formation}</span>
                </button>
                <button onClick={() => handleDelete(tc.id)} style={{
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
        <button onClick={() => setCurrent(defaultTactic(t))} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "6px 14px", background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 6, color: "var(--muted)", fontSize: 11, cursor: "pointer",
        }}>
          <Plus size={11} /> {t("tactics.new")}
        </button>
      </div>
    </div>
  );
}
