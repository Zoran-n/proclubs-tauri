import { useState, useEffect, useRef, useMemo } from "react";
import { Download, ChevronDown, Search, Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getMatches } from "../../api/tauri";
import { ExportModal } from "../ui/ExportModal";
import { useT } from "../../i18n";
import type { Match } from "../../types";
import { MatchModal, formatDate } from "../modals/MatchModal";
import { useDebounce } from "../../hooks/useDebounce";

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
  const { currentClub, matches: leagueCache, matchCache, setMatchCache, persistSettings } = useAppStore();
  const lang = useAppStore((s) => s.language);
  const t = useT();
  const locale = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : lang === "pt" ? "pt-BR" : "en-US";

  const TYPES = [
    { value: "leagueMatch" as const,   label: t("matches.league"),   icon: "⚽" },
    { value: "playoffMatch" as const,  label: t("matches.playoff"),  icon: "🏆" },
    { value: "friendlyMatch" as const, label: t("matches.friendly"), icon: "🤝" },
  ];

  const RESULT_LABEL: Record<string, { text: string; color: string }> = {
    W: { text: t("match.win"),  color: "var(--green)" },
    D: { text: t("match.draw"), color: "#eab308" },
    L: { text: t("match.loss"), color: "var(--red)" },
  };

  const [type, setType] = useState<"leagueMatch" | "playoffMatch" | "friendlyMatch">("leagueMatch");
  const [pages, setPages] = useState<Partial<Record<string, Match[]>>>({ leagueMatch: leagueCache });
  const [cursors, setCursors] = useState<Partial<Record<string, string | null>>>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const [oppFilter, setOppFilter] = useState("");
  const debouncedOppFilter = useDebounce(oppFilter, 200);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPages((p) => ({ ...p, leagueMatch: leagueCache }));
    if (currentClub && leagueCache.length) {
      setMatchCache(`${currentClub.id}_${currentClub.platform}_leagueMatch`, leagueCache);
    }
  }, [leagueCache]);
  useEffect(() => { setPages({ leagueMatch: leagueCache }); setCursors({}); }, [currentClub?.id]);

  useEffect(() => {
    if (!currentClub || pages[type] !== undefined) return;
    const key = `${currentClub.id}_${currentClub.platform}_${type}`;
    const cached = matchCache[key];
    if (cached?.length) {
      setPages((p) => ({ ...p, [type]: cached }));
      setCursors((c) => ({ ...c, [type]: cached.length >= 10 ? oldestTimestamp(cached) : null }));
      return;
    }
    setLoading(true);
    getMatches(currentClub.id, currentClub.platform, type)
      .then((data) => {
        setPages((p) => ({ ...p, [type]: data }));
        setCursors((c) => ({ ...c, [type]: data.length >= 10 ? oldestTimestamp(data) : null }));
        setMatchCache(key, data);
        persistSettings();
      })
      .finally(() => setLoading(false));
  }, [type, currentClub]);

  const loadMore = () => {
    if (!currentClub || loading) return;
    const cursor = cursors[type];
    if (!cursor) return;
    setLoading(true);
    const key = `${currentClub.id}_${currentClub.platform}_${type}`;
    getMatches(currentClub.id, currentClub.platform, type, cursor)
      .then((data) => {
        const prev = pages[type] ?? [];
        const existing = new Set(prev.map((m) => m.matchId));
        const fresh = data.filter((m) => !existing.has(m.matchId));
        const combined = [...prev, ...fresh];
        setPages((p) => ({ ...p, [type]: combined }));
        setMatchCache(key, combined);
        persistSettings();
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

  const getOppName = (m: Match, fallback?: string) => {
    const myId = currentClub?.id ?? "";
    const opp = Object.entries(m.clubs).find(([k]) => k !== myId)?.[1] as Record<string, unknown> | undefined;
    const det = opp?.["details"] as Record<string, unknown> | undefined;
    return String(det?.["name"] ?? opp?.["name"] ?? (fallback || t("matches.opponent")));
  };

  // Filter by opponent name
  const list = useMemo(() => {
    if (!debouncedOppFilter.trim()) return allList;
    const q = debouncedOppFilter.toLowerCase();
    return allList.filter((m) => getOppName(m).toLowerCase().includes(q));
  }, [allList, debouncedOppFilter]);

  const csvHeaders = [t("matches.date"), t("matches.opponent"), t("matches.score"), t("matches.result"), t("matches.type")];
  const csvRows = list.map((m) => [
    formatDate(m.timestamp, locale), getOppName(m), getScore(m),
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
          {TYPES.map((tp) => {
            const active = type === tp.value;
            return (
              <button key={tp.value} onClick={() => setType(tp.value)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "rgba(0,212,255,0.08)" : "transparent",
                color: active ? "var(--accent)" : "var(--muted)",
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 1,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                <span>{tp.icon}</span>{tp.label}
              </button>
            );
          })}
          {loading && <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>{t("misc.loading")}</span>}
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
            placeholder={t("matches.opponentPlaceholder")}
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
          {viewMode === "list" ? t("matches.calendar") : t("matches.listView")}
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
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>{t("matches.noMatches")}</div>
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
                      {formatDate(m.timestamp, locale)}
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
                    {"▶ " + t("matches.details")}
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
                <ChevronDown size={14} /> {t("matches.loadMore")}
              </button>
            )}
            {!hasMore && !loading && list.length > 0 && cursors[type] === null && (
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", padding: "8px 0" }}>
                {t("matches.allShown")}
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
                {t(`months.${calMonth.month}`)} {calMonth.year}
              </span>
              <button onClick={() => setCalMonth((c) => {
                const d = new Date(c.year, c.month + 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })} style={{ ...BTN }}><ChevronRight size={13} /></button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {[t("days.mon"), t("days.tue"), t("days.wed"), t("days.thu"), t("days.fri"), t("days.sat"), t("days.sun")].map((d) => (
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

