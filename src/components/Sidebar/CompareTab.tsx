import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Download, Trash2, Clock, Users, Plus, X, BarChart3, GitCompare, Activity } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, ResponsiveContainer,
} from "recharts";
import { searchClub, loadClub, getLogo, getMatches } from "../../api/tauri";
import { useAppStore } from "../../store/useAppStore";
import { ExportModal } from "../ui/ExportModal";
import type { Club, ClubData, Player, Match } from "../../types";

// Position helpers
const POS_LABELS: Record<string, string> = {
  "0":"GK","1":"RB","2":"RB","3":"CB","4":"CB","5":"LB","6":"LB",
  "7":"CDM","8":"CM","9":"CM","10":"CAM","11":"RM","12":"LM",
  "13":"RW","14":"LW","15":"RF","16":"CF","17":"LF","18":"ST","19":"ST",
  "20":"ST","25":"CF","26":"CAM",
};
const POS_GROUPS: Record<string, string[]> = {
  GK:  ["GK"],
  DEF: ["RB","CB","LB"],
  MIL: ["CDM","CM","CAM","RM","LM"],
  ATT: ["RW","LW","RF","CF","LF","ST"],
};
const GROUP_LABELS: Record<string, string> = { GK:"Gardien", DEF:"Défenseur", MIL:"Milieu", ATT:"Attaquant" };

// Per-slot colors (var + hex for Recharts)
const COLORS     = ["var(--accent)", "#8b5cf6", "#ff6b35", "#57f287"] as const;
const COLORS_HEX = ["#00d4ff",       "#8b5cf6", "#ff6b35", "#57f287"] as const;
const MAX_CLUBS = 4;

// ─── ClubLogo ────────────────────────────────────────────────────────────────
function ClubLogo({ club, size = 32 }: { club: Club; size?: number }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (club.crestAssetId) getLogo(club.crestAssetId).then(setLogo).catch(() => {});
  }, [club.crestAssetId]);
  const initial = (club.name || "?")[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: "var(--bg)",
      border: "1px solid var(--border)", flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {logo
        ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span style={{ fontFamily: "'Bebas Neue', sans-serif",
            fontSize: size * 0.42, color: "var(--accent)", lineHeight: 1 }}>{initial}</span>}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClubSlot { query: string; results: Club[]; data: ClubData | null; loading: boolean; }
const initSlot = (): ClubSlot => ({ query: "", results: [], data: null, loading: false });
type Section = "stats" | "radar" | "h2h" | "players";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getPlayerPos(p: Player) { return POS_LABELS[p.position] || p.position || "—"; }
function getPlayerGroup(p: Player): string {
  const pos = getPlayerPos(p);
  for (const [group, positions] of Object.entries(POS_GROUPS)) {
    if (positions.includes(pos)) return group;
  }
  return "ATT";
}

function computeClubRadarStats(data: ClubData) {
  const totalGames = data.club.wins + data.club.losses + data.club.ties;
  const n = data.players.length;
  return {
    winPct:       totalGames > 0 ? (data.club.wins / totalGames) * 100 : 0,
    goalsPerGame: totalGames > 0 ? data.club.goals / totalGames : 0,
    avgAssists:   n > 0 ? data.players.reduce((s, p) => s + p.assists,     0) / n : 0,
    avgTackles:   n > 0 ? data.players.reduce((s, p) => s + p.tacklesMade, 0) / n : 0,
    avgRating:    n > 0 ? data.players.reduce((s, p) => s + p.rating,      0) / n : 0,
    totalMotm:         data.players.reduce((s, p) => s + p.motm, 0),
  };
}

const BTN: React.CSSProperties = {
  padding: "5px 9px", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 5, cursor: "pointer", color: "var(--muted)", fontSize: 11,
  display: "flex", alignItems: "center", gap: 4,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function CompareTab() {
  const { compareHistory, addCompareEntry, deleteCompareEntry, persistSettings } = useAppStore();
  const [slots, setSlots]       = useState<ClubSlot[]>([initSlot(), initSlot()]);
  const [section, setSection]   = useState<Section>("stats");
  const [h2hMatches, setH2h]    = useState<Match[] | null>(null);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Derived: loaded slots
  const loadedData = slots.filter(s => s.data).map(s => s.data!);
  const loadedIds  = loadedData.map(d => d.club.id).join(",");

  // ── Slot mutations ──────────────────────────────────────────────────────────
  const updateSlot = (idx: number, patch: Partial<ClubSlot>) =>
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

  const doSearch = async (idx: number) => {
    const q = slots[idx].query.trim();
    if (!q) return;
    const clubs = await searchClub(q).catch(() => [] as Club[]);
    const seen = new Set<string>();
    updateSlot(idx, { results: clubs.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; }) });
  };

  const pick = async (club: Club, idx: number) => {
    updateSlot(idx, { results: [], loading: true });
    const data = await loadClub(club.id, club.platform).catch(() => null);
    updateSlot(idx, { data, loading: false });
  };

  const resetSlot  = (idx: number) => updateSlot(idx, initSlot());
  const addSlot    = () => { if (slots.length < MAX_CLUBS) setSlots(p => [...p, initSlot()]); };
  const removeSlot = (idx: number) => { if (slots.length > 2) setSlots(p => p.filter((_, i) => i !== idx)); };

  // ── Save compare history (2-club only) ────────────────────────────────────
  useEffect(() => {
    if (loadedData.length !== 2) return;
    const [dA, dB] = loadedData;
    addCompareEntry({
      id: [dA.club.id, dB.club.id].sort().join("-"),
      date: new Date().toISOString(),
      clubA: { id: dA.club.id, name: dA.club.name, platform: dA.club.platform },
      clubB: { id: dB.club.id, name: dB.club.name, platform: dB.club.platform },
    });
    persistSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedIds]);

  // ── H2H: load matches when exactly 2 clubs ────────────────────────────────
  useEffect(() => {
    if (loadedData.length !== 2) { setH2h(null); return; }
    const [dA, dB] = loadedData;
    setH2hLoading(true);
    setH2h(null);
    getMatches(dA.club.id, dA.club.platform, "leagueMatch")
      .then(matches => setH2h(matches.filter(m => dB.club.id in m.clubs)))
      .catch(() => setH2h([]))
      .finally(() => setH2hLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedIds]);

  // ── Radar data (normalized 0-100 per stat) ────────────────────────────────
  const radarData = useMemo(() => {
    if (loadedData.length < 2) return null;
    const statsList = loadedData.map(computeClubRadarStats);
    const STAT_KEYS: { key: keyof ReturnType<typeof computeClubRadarStats>; label: string }[] = [
      { key: "winPct",       label: "V%" },
      { key: "goalsPerGame", label: "Buts/Match" },
      { key: "avgAssists",   label: "Passes/J" },
      { key: "avgTackles",   label: "Tacles/J" },
      { key: "avgRating",    label: "Note Moy" },
      { key: "totalMotm",    label: "MOTM" },
    ];
    return STAT_KEYS.map(({ key, label }) => {
      const rawVals = statsList.map(s => s[key] as number);
      const maxVal  = Math.max(...rawVals);
      const row: Record<string, unknown> = { stat: label };
      loadedData.forEach((_, i) => { row[`c${i}`] = maxVal > 0 ? Math.round((rawVals[i] / maxVal) * 100) : 0; });
      return row;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedIds]);

  // ── Best players by position group ────────────────────────────────────────
  const bestByPosition = useMemo(() => {
    if (loadedData.length < 2) return null;
    const groups: Record<string, (Player | null)[]> = {};
    for (const group of Object.keys(POS_GROUPS)) {
      groups[group] = loadedData.map(d => {
        const filtered = d.players.filter(p => getPlayerGroup(p) === group);
        return filtered.length > 0 ? filtered.reduce((best, p) => p.rating > best.rating ? p : best) : null;
      });
    }
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedIds]);

  // ── Load from history ─────────────────────────────────────────────────────
  const loadFromHistory = async (entry: typeof compareHistory[0]) => {
    setSlots([initSlot(), initSlot()].map(s => ({ ...s, loading: true })));
    const [dataA, dataB] = await Promise.all([
      loadClub(entry.clubA.id, entry.clubA.platform).catch(() => null),
      loadClub(entry.clubB.id, entry.clubB.platform).catch(() => null),
    ]);
    setSlots([
      { query: "", results: [], data: dataA, loading: false },
      { query: "", results: [], data: dataB, loading: false },
    ]);
  };

  // ── CSV ───────────────────────────────────────────────────────────────────
  const dateStr    = new Date().toISOString().slice(0, 10);
  const csvHeaders = ["Stat", ...loadedData.map(d => d.club.name)];
  const csvRows    = loadedData.length >= 2 ? [
    ["SR",        ...loadedData.map(d => d.club.skillRating ?? "—")],
    ["Victoires", ...loadedData.map(d => d.club.wins)],
    ["Nuls",      ...loadedData.map(d => d.club.ties)],
    ["Défaites",  ...loadedData.map(d => d.club.losses)],
    ["V%",        ...loadedData.map(d => {
      const t = d.club.wins + d.club.losses + d.club.ties;
      return t > 0 ? ((d.club.wins / t) * 100).toFixed(1) + "%" : "—";
    })],
    ["Buts",      ...loadedData.map(d => d.club.goals)],
    ["Joueurs",   ...loadedData.map(d => d.players.length)],
  ] : [];

  // ── Stat table rows definition ────────────────────────────────────────────
  type StatRowDef = [string, (d: ClubData) => string | number, boolean?];
  const statRowDefs: StatRowDef[] = [
    ["SR",        d => d.club.skillRating ?? "—"],
    ["VICTOIRES", d => d.club.wins],
    ["NULS",      d => d.club.ties],
    ["DÉFAITES",  d => d.club.losses, true],
    ["V%",        d => {
      const t = d.club.wins + d.club.losses + d.club.ties;
      return t > 0 ? ((d.club.wins / t) * 100).toFixed(1) + "%" : "—";
    }],
    ["BUTS",      d => d.club.goals],
    ["JOUEURS",   d => d.players.length],
  ];

  // ── Section tab config ────────────────────────────────────────────────────
  const sectionTabs: { id: Section; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: "stats",   label: "Stats",   icon: <BarChart3   size={11} /> },
    { id: "radar",   label: "Radar",   icon: <Activity    size={11} /> },
    { id: "h2h",     label: "H2H",     icon: <GitCompare  size={11} />, disabled: loadedData.length !== 2 },
    { id: "players", label: "Joueurs", icon: <Users       size={11} />, disabled: loadedData.length < 2 },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: 16,
      display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Club selection row ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
        {slots.map((slot, idx) => (
          <div key={idx} style={{ flex: "1 1 170px", minWidth: 155, background: "var(--card)",
            border: "1px solid var(--border)", borderRadius: 10, padding: 13,
            display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Slot header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13,
                letterSpacing: "0.1em", color: COLORS[idx], margin: 0 }}>CLUB {idx + 1}</p>
              {slots.length > 2 && (
                <button onClick={() => removeSlot(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted)", padding: 2, lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                  <X size={12} />
                </button>
              )}
            </div>

            {slot.data ? (
              /* Club loaded */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <ClubLogo club={slot.data.club} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slot.data.club.name}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>
                      SR {slot.data.club.skillRating ?? "—"}
                    </p>
                  </div>
                </div>
                <button onClick={() => resetSlot(idx)} style={{ fontSize: 10, color: "var(--muted)",
                  background: "none", border: "1px solid var(--border)", borderRadius: 4,
                  cursor: "pointer", padding: "2px 7px" }}>Changer</button>
              </div>
            ) : slot.loading ? (
              <p style={{ fontSize: 11, color: "var(--muted)" }}>Chargement…</p>
            ) : (
              /* Search form */
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={slot.query}
                  onChange={e => updateSlot(idx, { query: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && doSearch(idx)}
                  placeholder="Nom du club…"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)",
                    color: "var(--text)", padding: "6px 9px", borderRadius: 5, fontSize: 12, outline: "none" }}
                  onFocus={e => (e.target.style.borderColor = COLORS[idx])}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button onClick={() => doSearch(idx)} style={{ padding: "7px",
                  background: COLORS[idx], color: "#000", border: "none", borderRadius: 5,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: "0.08em",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Search size={11} /> RECHERCHER
                </button>
                {slot.results.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 130, overflowY: "auto" }}>
                    {slot.results.map(c => (
                      <div key={c.id} onClick={() => pick(c, idx)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                        borderRadius: 5, cursor: "pointer", background: "var(--bg)",
                        border: "1px solid var(--border)", transition: "border-color 0.12s" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = COLORS[idx])}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                        <ClubLogo club={c} size={22} />
                        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.name || `#${c.id}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add club button */}
        {slots.length < MAX_CLUBS && (
          <button onClick={addSlot} style={{ flex: "0 0 52px", minWidth: 52,
            background: "var(--card)", border: "1px dashed var(--border)", borderRadius: 10,
            cursor: "pointer", color: "var(--muted)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 4, padding: 12 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
            <Plus size={18} />
            <span style={{ fontSize: 9, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}>AJOUTER</span>
          </button>
        )}
      </div>

      {/* ── Sections (2+ clubs loaded) ── */}
      {loadedData.length >= 2 && (
        <>
          {/* Section tab bar + export */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 2, background: "var(--surface)",
              borderRadius: 8, padding: 3, border: "1px solid var(--border)" }}>
              {sectionTabs.map(tab => (
                <button key={tab.id} onClick={() => !tab.disabled && setSection(tab.id)}
                  disabled={tab.disabled}
                  style={{ display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 6, border: "none",
                    cursor: tab.disabled ? "default" : "pointer",
                    fontSize: 11, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.07em",
                    background: section === tab.id ? "var(--card)" : "transparent",
                    color: tab.disabled ? "var(--muted)" : section === tab.id ? "var(--accent)" : "var(--muted)",
                    opacity: tab.disabled ? 0.4 : 1,
                    boxShadow: section === tab.id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                    transition: "all 0.12s ease" }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setExportModal("png")} style={BTN}><Download size={11} /> PNG</button>
              <button onClick={() => setExportModal("csv")} style={BTN}><Download size={11} /> CSV</button>
            </div>
          </div>

          {/* ── STATS TABLE ── */}
          {section === "stats" && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "9px 12px", fontSize: 10, color: "var(--muted)",
                      fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
                      textAlign: "left", minWidth: 72 }}>STAT</th>
                    {loadedData.map((d, i) => (
                      <th key={i} style={{ textAlign: "center", padding: "9px 10px",
                        fontSize: 12, color: COLORS[i],
                        fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}>
                        {d.club.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statRowDefs.map(([label, getter, lowerBetter]) => {
                    const values = loadedData.map(d => getter(d));
                    const nums   = values.map(v => parseFloat(String(v).replace("%", "")));
                    const allNum = nums.every(n => !isNaN(n));
                    const maxVal = allNum ? Math.max(...nums) : null;
                    const minVal = allNum ? Math.min(...nums) : null;
                    return (
                      <tr key={String(label)} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "5px 12px", color: "var(--muted)", fontSize: 10,
                          fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
                          background: "var(--surface)", whiteSpace: "nowrap" }}>{String(label)}</td>
                        {values.map((v, i) => {
                          const n = nums[i];
                          const wins = allNum && !isNaN(n) && maxVal !== minVal && (
                            lowerBetter ? n === minVal : n === maxVal
                          );
                          return (
                            <td key={i} style={{ textAlign: "center", padding: "5px 10px",
                              fontSize: 13, color: wins ? COLORS[i] : "var(--text)",
                              fontWeight: wins ? 700 : "normal" }}>{v}</td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── RADAR CHART ── */}
          {section === "radar" && radarData && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                fontFamily: "'Bebas Neue', sans-serif", margin: "0 0 10px" }}>
                RADAR — STATS CLÉS (normalisées sur 100)
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="stat"
                    tick={{ fill: "var(--muted)", fontSize: 10,
                      fontFamily: "'Bebas Neue', sans-serif" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  {loadedData.map((d, i) => (
                    <Radar key={d.club.id} name={d.club.name} dataKey={`c${i}`}
                      stroke={COLORS_HEX[i]} fill={COLORS_HEX[i]} fillOpacity={0.18} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Bebas Neue', sans-serif" }}
                    formatter={(value: string) => (
                      <span style={{ color: "var(--text)" }}>{value}</span>
                    )} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── H2H MATCHES ── */}
          {section === "h2h" && loadedData.length === 2 && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <GitCompare size={13} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                  fontFamily: "'Bebas Neue', sans-serif" }}>
                  CONFRONTATIONS — {loadedData[0].club.name} vs {loadedData[1].club.name}
                </span>
              </div>

              {h2hLoading ? (
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Chargement…</p>
              ) : !h2hMatches ? (
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>—</p>
              ) : h2hMatches.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                  Aucune confrontation directe trouvée
                </p>
              ) : (
                <>
                  {/* Summary counters */}
                  {(() => {
                    const aId = loadedData[0].club.id;
                    const bId = loadedData[1].club.id;
                    let wins = 0, losses = 0, draws = 0;
                    h2hMatches.forEach(m => {
                      const gA = parseInt((m.clubs[aId]?.goals as string) ?? "0") || 0;
                      const gB = parseInt((m.clubs[bId]?.goals as string) ?? "0") || 0;
                      if (gA > gB) wins++;
                      else if (gA < gB) losses++;
                      else draws++;
                    });
                    return (
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        {[
                          { label: "VICTOIRES",  val: wins,   color: "var(--green)" },
                          { label: "NULS",       val: draws,  color: "var(--muted)" },
                          { label: "DÉFAITES",   val: losses, color: "var(--red)" },
                          { label: "MATCHS",     val: h2hMatches.length, color: "var(--accent)" },
                        ].map(({ label, val, color }) => (
                          <div key={label} style={{ flex: 1, textAlign: "center", padding: "8px 4px",
                            background: "var(--bg)", borderRadius: 6, border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 22, fontFamily: "'Bebas Neue', sans-serif", color }}>{val}</div>
                            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.07em" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Match list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4,
                    maxHeight: 300, overflowY: "auto" }}>
                    {[...h2hMatches]
                      .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
                      .map(m => {
                        const aId = loadedData[0].club.id;
                        const bId = loadedData[1].club.id;
                        const gA = parseInt((m.clubs[aId]?.goals as string) ?? "0") || 0;
                        const gB = parseInt((m.clubs[bId]?.goals as string) ?? "0") || 0;
                        const result      = gA > gB ? "V" : gA < gB ? "D" : "N";
                        const resultColor = result === "V" ? "var(--green)" : result === "D" ? "var(--red)" : "var(--muted)";
                        const ts   = parseInt(m.timestamp);
                        const date = !isNaN(ts)
                          ? new Date(ts * 1000).toLocaleDateString()
                          : new Date(m.timestamp).toLocaleDateString();
                        return (
                          <div key={m.matchId} style={{ display: "grid",
                            gridTemplateColumns: "1fr 60px 1fr 36px",
                            gap: 6, padding: "7px 10px",
                            background: "var(--bg)", borderRadius: 6,
                            border: "1px solid var(--border)", alignItems: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 600,
                              color: COLORS[0], textAlign: "right",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {loadedData[0].club.name}
                            </div>
                            <div style={{ textAlign: "center",
                              fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
                              color: "var(--text)", letterSpacing: "0.05em" }}>
                              {gA} – {gB}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600,
                              color: COLORS[1],
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {loadedData[1].club.name}
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 12, fontFamily: "'Bebas Neue', sans-serif",
                                color: resultColor }}>{result}</div>
                              <div style={{ fontSize: 9, color: "var(--muted)" }}>{date}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── BEST PLAYERS BY POSITION ── */}
          {section === "players" && bestByPosition && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Users size={13} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                  fontFamily: "'Bebas Neue', sans-serif" }}>MEILLEURS JOUEURS PAR POSTE</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "7px 10px", fontSize: 10, color: "var(--muted)",
                        fontFamily: "'Bebas Neue', sans-serif", textAlign: "left", width: 80 }}>POSTE</th>
                      {loadedData.map((d, i) => (
                        <th key={i} style={{ padding: "7px 10px", fontSize: 11, color: COLORS[i],
                          fontFamily: "'Bebas Neue', sans-serif", textAlign: "center" }}>
                          {d.club.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bestByPosition).map(([group, players]) => {
                      const ratings  = players.map(p => p?.rating ?? 0);
                      const maxRating = Math.max(...ratings);
                      return (
                        <tr key={group} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "6px 10px", fontSize: 10, color: "var(--muted)",
                            fontFamily: "'Bebas Neue', sans-serif", background: "var(--surface)",
                            whiteSpace: "nowrap" }}>{GROUP_LABELS[group].toUpperCase()}</td>
                          {players.map((p, i) => {
                            const isWinner = p !== null && p.rating === maxRating && maxRating > 0 &&
                              ratings.filter(r => r === maxRating).length === 1;
                            return (
                              <td key={i} style={{ padding: "6px 10px", textAlign: "center" }}>
                                {p ? (
                                  <>
                                    <div style={{ fontSize: 12, fontWeight: 600,
                                      color: isWinner ? COLORS[i] : "var(--text)" }}>{p.name}</div>
                                    <div style={{ fontSize: 10, color: "var(--muted)" }}>
                                      {getPlayerPos(p)} · {p.rating > 0 ? p.rating.toFixed(1) : "—"} · {p.goals}G {p.assists}PD
                                    </div>
                                  </>
                                ) : <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Prompt when only one club loaded */}
      {loadedData.length === 1 && (
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, margin: 0 }}>
          Sélectionnez un deuxième club pour comparer
        </p>
      )}

      {/* ── Compare history ── */}
      {compareHistory.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Clock size={13} style={{ color: "var(--muted)" }} />
            <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif" }}>COMPARAISONS RÉCENTES</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {compareHistory.map(entry => (
              <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 6, cursor: "pointer", transition: "border-color 0.15s" }}
                onClick={() => loadFromHistory(entry)}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.clubA.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>vs</span> {entry.clubB.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteCompareEntry(entry.id); persistSettings(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Export modals ── */}
      {exportModal === "png" && (
        <ExportModal type="png" pngSourceEl={contentRef.current}
          defaultFilename={`comparaison-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
      {exportModal === "csv" && (
        <ExportModal type="csv" csvHeaders={csvHeaders} csvRows={csvRows}
          defaultFilename={`comparaison-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
    </div>
  );
}
