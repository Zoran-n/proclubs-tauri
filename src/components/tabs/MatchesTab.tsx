import { useState, useEffect, useRef, useMemo } from "react";
import { Download, ChevronDown, Search, Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getMatches } from "../../api/tauri";
import { ExportModal } from "../ui/ExportModal";
import type { Match } from "../../types";

const TYPES = [
  { value: "leagueMatch",   label: "CHAMPIONNAT", icon: "⚽" },
  { value: "playoffMatch",  label: "PLAYOFF",     icon: "🏆" },
  { value: "friendlyMatch", label: "AMICAL",      icon: "🤝" },
] as const;

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
  W: { text: "VICTOIRE", color: "var(--green)" },
  D: { text: "NUL",      color: "#eab308" },
  L: { text: "DEFAITE",  color: "var(--red)" },
};

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function formatDate(ts: string | number) {
  const n = Number(ts) * 1000 || Number(ts);
  const d = new Date(isNaN(n) ? ts : n);
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDuration(secs?: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}min ${s}s`;
}

function oldestTimestamp(list: Match[]): string | null {
  if (list.length === 0) return null;
  const oldest = [...list].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))[0];
  return oldest?.timestamp ?? null;
}

function matchDate(m: Match): Date {
  const n = Number(m.timestamp);
  return new Date(n > 1e12 ? n : n * 1000);
}

const BTN: React.CSSProperties = {
  padding: "6px 10px", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 6, cursor: "pointer", color: "var(--muted)", fontSize: 11,
  display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
};

export function MatchesTab() {
  const { currentClub, matches: leagueCache } = useAppStore();
  const [type, setType] = useState<"leagueMatch" | "playoffMatch" | "friendlyMatch">("leagueMatch");
  const [pages, setPages] = useState<Partial<Record<string, Match[]>>>({ leagueMatch: leagueCache });
  const [cursors, setCursors] = useState<Partial<Record<string, string | null>>>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const [oppFilter, setOppFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPages((p) => ({ ...p, leagueMatch: leagueCache })); }, [leagueCache]);
  useEffect(() => { setPages({ leagueMatch: leagueCache }); setCursors({}); }, [currentClub?.id]);

  useEffect(() => {
    if (!currentClub || pages[type] !== undefined) return;
    setLoading(true);
    getMatches(currentClub.id, currentClub.platform, type)
      .then((data) => {
        setPages((p) => ({ ...p, [type]: data }));
        setCursors((c) => ({ ...c, [type]: data.length >= 10 ? oldestTimestamp(data) : null }));
      })
      .finally(() => setLoading(false));
  }, [type, currentClub]);

  const loadMore = () => {
    if (!currentClub || loading) return;
    const cursor = cursors[type];
    if (!cursor) return;
    setLoading(true);
    getMatches(currentClub.id, currentClub.platform, type, cursor)
      .then((data) => {
        setPages((p) => {
          const prev = p[type] ?? [];
          const existing = new Set(prev.map((m) => m.matchId));
          const fresh = data.filter((m) => !existing.has(m.matchId));
          return { ...p, [type]: [...prev, ...fresh] };
        });
        setCursors((c) => ({ ...c, [type]: data.length >= 10 ? oldestTimestamp(data) : null }));
      })
      .finally(() => setLoading(false));
  };

  const allList = pages[type] ?? [];
  const hasMore = (cursors[type] ?? null) !== null && !loading;

  const getResult = (m: Match): "W" | "D" | "L" => {
    const c = m.clubs[currentClub?.id ?? ""] as Record<string, unknown> | undefined;
    if (c?.["wins"] === "1") return "W";
    if (c?.["losses"] === "1") return "L";
    return "D";
  };

  const getScore = (m: Match) => {
    const myId = currentClub?.id ?? "";
    const my  = m.clubs[myId] as Record<string, unknown> | undefined;
    const opp = Object.entries(m.clubs).find(([k]) => k !== myId)?.[1] as Record<string, unknown> | undefined;
    return `${my?.["goals"] ?? "?"}-${opp?.["goals"] ?? "?"}`;
  };

  const getOppName = (m: Match) => {
    const myId = currentClub?.id ?? "";
    const opp = Object.entries(m.clubs).find(([k]) => k !== myId)?.[1] as Record<string, unknown> | undefined;
    const det = opp?.["details"] as Record<string, unknown> | undefined;
    return String(det?.["name"] ?? opp?.["name"] ?? "Adversaire");
  };

  // Filter by opponent name
  const list = useMemo(() => {
    if (!oppFilter.trim()) return allList;
    const q = oppFilter.toLowerCase();
    return allList.filter((m) => getOppName(m).toLowerCase().includes(q));
  }, [allList, oppFilter]);

  const csvHeaders = ["Date", "Adversaire", "Score", "Résultat", "Type"];
  const csvRows = list.map((m) => [
    formatDate(m.timestamp), getOppName(m), getScore(m),
    RESULT_LABEL[getResult(m)].text, type,
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);

  // Calendar data
  const calendarDays = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
    const days: { day: number; matches: Match[] }[] = [];
    for (let i = 0; i < offset; i++) days.push({ day: 0, matches: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const dayMatches = list.filter((m) => {
        const md = matchDate(m);
        return md.getFullYear() === year && md.getMonth() === month && md.getDate() === d;
      });
      days.push({ day: d, matches: dayMatches });
    }
    return days;
  }, [calMonth, list]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" }}>

      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
        flexShrink: 0, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          {TYPES.map((t) => {
            const active = type === t.value;
            return (
              <button key={t.value} onClick={() => setType(t.value)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "rgba(0,212,255,0.08)" : "transparent",
                color: active ? "var(--accent)" : "var(--muted)",
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 1,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                <span>{t.icon}</span>{t.label}
              </button>
            );
          })}
          {loading && <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>Chargement…</span>}
          {!loading && list.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>
              {list.length} match{list.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Opponent filter */}
        <div style={{ position: "relative", minWidth: 120 }}>
          <Search size={11} style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", pointerEvents: "none" }} />
          <input value={oppFilter} onChange={(e) => setOppFilter(e.target.value)}
            placeholder="Adversaire…"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
              padding: "5px 8px 5px 24px", borderRadius: 5, fontSize: 11, outline: "none", width: "100%",
              transition: "border-color 0.15s" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* View toggle */}
        <button onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          style={{ ...BTN, color: viewMode === "calendar" ? "var(--accent)" : "var(--muted)" }}>
          {viewMode === "list" ? <Calendar size={11} /> : <List size={11} />}
          {viewMode === "list" ? "Calendrier" : "Liste"}
        </button>

        <button onClick={() => setExportModal("png")} style={BTN}>
          <Download size={11} /> PNG
        </button>
        <button onClick={() => setExportModal("csv")} style={BTN}>
          <Download size={11} /> CSV
        </button>
      </div>

      {/* Content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
        gap: 6, padding: "10px 16px 16px" }}>

        {viewMode === "list" ? (
          <>
            {!loading && list.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Aucun match</div>
            )}
            {list.map((m) => {
              const res = getResult(m);
              const rl  = RESULT_LABEL[res];
              return (
                <div key={m.matchId} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
                  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
                  transition: "border-color 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26,
                    color: "#eab308", minWidth: 56, flexShrink: 0, letterSpacing: 1 }}>
                    {getScore(m)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      vs {getOppName(m)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {formatDate(m.timestamp)}
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14,
                    color: rl.color, letterSpacing: 1, minWidth: 72, textAlign: "center" }}>
                    {rl.text}
                  </span>
                  <button onClick={() => setSelected(m)} style={{
                    background: "none", border: "none", color: "var(--muted)",
                    fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", padding: "4px 8px", borderRadius: 4,
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                  >
                    ▶ détails
                  </button>
                </div>
              );
            })}

            {hasMore && (
              <button onClick={loadMore}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px", background: "var(--card)", border: "1px dashed var(--border)",
                  borderRadius: 8, cursor: "pointer", color: "var(--muted)", fontSize: 12,
                  marginTop: 4, width: "100%",
                }}>
                <ChevronDown size={14} /> Charger les 10 matchs suivants
              </button>
            )}
            {!hasMore && !loading && list.length > 0 && cursors[type] === null && (
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", padding: "8px 0" }}>
                Tous les matchs affichés
              </div>
            )}
          </>
        ) : (
          /* Calendar view */
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
              <button onClick={() => setCalMonth((c) => {
                const d = new Date(c.year, c.month - 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })} style={{ ...BTN }}><ChevronLeft size={13} /></button>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--text)",
                letterSpacing: "0.06em", minWidth: 160, textAlign: "center" }}>
                {MONTHS_FR[calMonth.month]} {calMonth.year}
              </span>
              <button onClick={() => setCalMonth((c) => {
                const d = new Date(c.year, c.month + 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })} style={{ ...BTN }}><ChevronRight size={13} /></button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 9, color: "var(--muted)",
                  fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em", padding: 4 }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {calendarDays.map((cell, i) => (
                <div key={i} style={{
                  minHeight: 64, padding: 4, borderRadius: 4,
                  background: cell.day === 0 ? "transparent" : "var(--card)",
                  border: cell.day === 0 ? "none" : "1px solid var(--border)",
                }}>
                  {cell.day > 0 && (
                    <>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{cell.day}</div>
                      {cell.matches.map((m) => {
                        const res = getResult(m);
                        const color = RESULT_LABEL[res].color;
                        return (
                          <div key={m.matchId} onClick={() => setSelected(m)}
                            style={{
                              fontSize: 9, padding: "1px 3px", borderRadius: 3, marginBottom: 1,
                              background: `${color}22`, color, cursor: "pointer", fontWeight: 600,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                            {getScore(m)}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <MatchModal match={selected} clubId={currentClub?.id ?? ""} onClose={() => setSelected(null)} />
      )}
      {exportModal === "png" && (
        <ExportModal type="png" pngSourceEl={contentRef.current}
          defaultFilename={`matchs-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
      {exportModal === "csv" && (
        <ExportModal type="csv" csvHeaders={csvHeaders} csvRows={csvRows}
          defaultFilename={`matchs-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
    </div>
  );
}

/* ─── Team stats helpers ─── */

interface TeamStat { label: string; my: string | number; opp: string | number }

function extractTeamStats(match: Match, clubId: string): TeamStat[] {
  const myData  = match.clubs[clubId] as Record<string, unknown> | undefined;
  const oppEntry = Object.entries(match.clubs).find(([k]) => k !== clubId);
  const oppData = oppEntry?.[1] as Record<string, unknown> | undefined;
  if (!myData || !oppData) return [];

  const statKeys: [string, string][] = [
    ["possession", "Possession"],
    ["shots", "Tirs"],
    ["shotsOnTarget", "Tirs cadrés"],
    ["corners", "Corners"],
    ["passesAttempted", "Passes tentées"],
    ["passesCompleted", "Passes réussies"],
    ["fouls", "Fautes"],
    ["offsides", "Hors-jeu"],
    ["tackles", "Tacles"],
  ];

  const stats: TeamStat[] = [];
  for (const [key, label] of statKeys) {
    // EA API uses various casings
    const myVal  = myData[key]  ?? myData[key.toLowerCase()];
    const oppVal = oppData[key] ?? oppData[key.toLowerCase()];
    if (myVal !== undefined || oppVal !== undefined) {
      const fmt = (v: unknown) => {
        if (v === undefined || v === null) return "—";
        if (key === "possession") return `${v}%`;
        return String(v);
      };
      stats.push({ label, my: fmt(myVal), opp: fmt(oppVal) });
    }
  }
  return stats;
}

/* ─── Match events (recap) ─── */

interface MatchEvent { type: "goal" | "assist" | "card" | "motm"; player: string; detail?: string }

function extractMatchEvents(match: Match, clubId: string): MatchEvent[] {
  const clubPlayers = match.players[clubId] as Record<string, Record<string, unknown>> | undefined;
  if (!clubPlayers) return [];

  const events: MatchEvent[] = [];
  for (const p of Object.values(clubPlayers)) {
    const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? "—");
    const goals = Number(p["goals"] ?? 0);
    for (let i = 0; i < goals; i++) events.push({ type: "goal", player: name });
    const assists = Number(p["assists"] ?? 0);
    for (let i = 0; i < assists; i++) events.push({ type: "assist", player: name });
    const yc = Number(p["yellowCards"] ?? p["yellowcards"] ?? 0);
    const rc = Number(p["redCards"] ?? p["redcards"] ?? 0);
    if (yc > 0) events.push({ type: "card", player: name, detail: `🟨 ${yc}` });
    if (rc > 0) events.push({ type: "card", player: name, detail: `🟥 ${rc}` });
    if (p["mom"] === "1" || p["manofthematch"] === "1") events.push({ type: "motm", player: name });
  }
  // Sort: goals first, then assists, cards, motm
  const order = { goal: 0, assist: 1, card: 2, motm: 3 };
  events.sort((a, b) => order[a.type] - order[b.type]);
  return events;
}

function MatchModal({ match, clubId, onClose }: { match: Match; clubId: string; onClose: () => void }) {
  const myData   = match.clubs[clubId] as Record<string, unknown> | undefined;
  const oppEntry = Object.entries(match.clubs).find(([k]) => k !== clubId);
  const oppData  = oppEntry?.[1] as Record<string, unknown> | undefined;
  const oppDet   = oppData?.["details"] as Record<string, unknown> | undefined;
  const oppName  = String(oppDet?.["name"] ?? oppData?.["name"] ?? "Adversaire");

  const myPlayers = Object.entries(
    (match.players[clubId] ?? {}) as Record<string, Record<string, unknown>>
  ).map(([, p]) => ({
    name:          String(p["name"] ?? p["playername"] ?? "—"),
    goals:         Number(p["goals"]   ?? 0),
    assists:       Number(p["assists"] ?? 0),
    passes:        Number(p["passesMade"] ?? p["passesmade"] ?? 0),
    tackles:       Number(p["tacklesMade"] ?? p["tacklesmade"] ?? 0),
    interceptions: Number(p["interceptions"] ?? 0),
    fouls:         Number(p["foulsCommited"] ?? p["foulscommited"] ?? 0),
    yellowCards:   Number(p["yellowCards"] ?? p["yellowcards"] ?? 0),
    redCards:      Number(p["redCards"] ?? p["redcards"] ?? 0),
    rating:        Number(p["rating"] ?? p["ratingAve"] ?? 0),
    motm:          p["mom"] === "1" || p["manofthematch"] === "1",
  })).sort((a, b) => b.rating - a.rating);

  const myGoals  = String(myData?.["goals"]  ?? "?");
  const oppGoals = String(oppData?.["goals"] ?? "?");
  const res = myData?.["wins"] === "1" ? "W" : myData?.["losses"] === "1" ? "L" : "D";
  const rl  = RESULT_LABEL[res];

  const hasInterceptions = myPlayers.some((p) => p.interceptions > 0);
  const hasTackles       = myPlayers.some((p) => p.tackles > 0);
  const hasFouls         = myPlayers.some((p) => p.fouls > 0);
  const hasCards         = myPlayers.some((p) => p.yellowCards > 0 || p.redCards > 0);

  const teamStats = extractTeamStats(match, clubId);
  const events = extractMatchEvents(match, clubId);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 720,
        maxHeight: "88vh", overflowY: "auto", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#eab308", letterSpacing: 2 }}>
              {myGoals} — {oppGoals}
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 2 }}>vs {oppName}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {formatDate(match.timestamp)}
              {match.matchDuration ? ` · ${formatDuration(match.matchDuration)}` : ""}
              <span style={{ color: rl.color, fontFamily: "'Bebas Neue', sans-serif", marginLeft: 10, letterSpacing: 1 }}>{rl.text}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Match events recap */}
        {events.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14,
            padding: "10px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
            {events.map((ev, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 12, fontSize: 11,
                background: ev.type === "goal" ? "rgba(0,212,255,0.1)" :
                  ev.type === "assist" ? "rgba(255,215,0,0.1)" :
                  ev.type === "motm" ? "rgba(255,215,0,0.15)" :
                  "rgba(255,255,255,0.05)",
                color: ev.type === "goal" ? "var(--accent)" :
                  ev.type === "assist" ? "#eab308" :
                  ev.type === "motm" ? "#ffd700" : "var(--text)",
                fontWeight: 600,
              }}>
                {ev.type === "goal" && "⚽"}
                {ev.type === "assist" && "🅰️"}
                {ev.type === "motm" && "★"}
                {ev.type === "card" && ev.detail}
                {ev.type !== "card" && ev.player}
                {ev.type === "card" && ` ${ev.player}`}
              </span>
            ))}
          </div>
        )}

        {/* Team stats comparison */}
        {teamStats.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>STATS ÉQUIPE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "4px 10px",
              padding: "10px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
              {teamStats.map(({ label, my, opp }) => {
                const nMy = Number(String(my).replace("%", "")), nOpp = Number(String(opp).replace("%", ""));
                const myWins = !isNaN(nMy) && !isNaN(nOpp) && nMy > nOpp;
                const oppWins = !isNaN(nMy) && !isNaN(nOpp) && nOpp > nMy;
                return (
                  <div key={label} style={{ display: "contents" }}>
                    <div style={{ textAlign: "right", fontSize: 13, fontFamily: "'Bebas Neue', sans-serif",
                      color: myWins ? "var(--accent)" : "var(--text)" }}>{my}</div>
                    <div style={{ textAlign: "center", fontSize: 9, color: "var(--muted)",
                      fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em", alignSelf: "center" }}>{label.toUpperCase()}</div>
                    <div style={{ textAlign: "left", fontSize: 13, fontFamily: "'Bebas Neue', sans-serif",
                      color: oppWins ? "var(--red)" : "var(--text)" }}>{opp}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player stats table */}
        {myPlayers.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>JOUEURS</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Joueur", "Note", "Buts", "PD", "Passes",
                    ...(hasTackles       ? ["Tacles"]  : []),
                    ...(hasInterceptions ? ["Interc."] : []),
                    ...(hasFouls         ? ["Fautes"]  : []),
                    ...(hasCards         ? ["Cartons"] : []),
                    "MOTM",
                  ].map((h) => (
                    <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 10,
                      color: "var(--muted)", fontWeight: "normal", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myPlayers.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.name}</td>
                    <td style={{ padding: "6px 8px", fontWeight: "bold",
                      color: p.rating >= 7.5 ? "var(--green)" : p.rating >= 6 ? "#eab308" : "var(--red)" }}>
                      {p.rating.toFixed(1)}
                    </td>
                    <td style={{ padding: "6px 8px", color: "var(--accent)" }}>{p.goals || "—"}</td>
                    <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.assists || "—"}</td>
                    <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.passes}</td>
                    {hasTackles       && <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.tackles || "—"}</td>}
                    {hasInterceptions && <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.interceptions || "—"}</td>}
                    {hasFouls         && <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.fouls || "—"}</td>}
                    {hasCards && (
                      <td style={{ padding: "6px 8px" }}>
                        {p.yellowCards > 0 && <span style={{ marginRight: 2 }}>🟨{p.yellowCards}</span>}
                        {p.redCards    > 0 && <span>🟥{p.redCards}</span>}
                        {!p.yellowCards && !p.redCards && <span style={{ color: "var(--muted)" }}>—</span>}
                      </td>
                    )}
                    <td style={{ padding: "6px 8px", color: "#ffd700" }}>{p.motm ? "★" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 16 }}>Pas de stats joueurs</p>
        )}
      </div>
    </div>
  );
}
