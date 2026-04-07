import { useState, useMemo, useRef } from "react";
import { Search, Download, ChevronUp, ChevronDown, Users, Filter, AlertTriangle } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { ExportModal } from "../ui/ExportModal";
import { useT } from "../../i18n";
import type { Player } from "../../types";
import { PlayerModal, POS_LABELS, PlayerAvatar, ratingColor } from "../modals/PlayerModal";
import { CompareModal } from "../modals/CompareModal";
import { useDebounce } from "../../hooks/useDebounce";

type SortKey = keyof Player | "score";

function compositeScore(p: Player) {
  return p.goals * 3 + p.assists * 2 + p.motm * 5 + Math.round(p.rating * 10);
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 52, H = 18;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = values[values.length - 1];
  const dotColor = last >= 7.5 ? "var(--green)" : last >= 6.5 ? "#eab308" : "var(--red)";
  const lastX = W, lastY = H - ((last - min) / range) * (H - 2) - 1;
  return (
    <svg width={W} height={H} style={{ overflow: "visible", flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={1.5}
        strokeLinejoin="round" opacity={0.7} />
      <circle cx={lastX} cy={lastY} r={3} fill={dotColor} />
    </svg>
  );
}

function RatingBadge({ r }: { r: number }) {
  const color = ratingColor(r);
  if (r === 0) return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 42, padding: "3px 8px", borderRadius: 12,
      background: `${color}18`, border: `1px solid ${color}55`,
      color, fontSize: 13, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif",
      letterSpacing: "0.04em",
    }}>
      {r.toFixed(1)}
    </span>
  );
}

const BTN: React.CSSProperties = {
  padding: "6px 10px", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 6, cursor: "pointer", color: "var(--muted)", fontSize: 11,
  display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
};

export function PlayersTab() {
  const t = useT();
  const players = useAppStore((s) => s.players);
  const matchCache = useAppStore((s) => s.matchCache);
  const currentClub = useAppStore((s) => s.currentClub);
  const compactMode = useAppStore((s) => s.compactMode);

  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Player | null>(null);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter, 200);
  const [filterPos, setFilterPos] = useState<string>("all");
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [filterMinGames, setFilterMinGames] = useState<number>(0);
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Player[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const COLS: { key: SortKey; label: string }[] = useMemo(() => [
    { key: "score",       label: "🏆 Score" },
    { key: "gamesPlayed", label: t("players.games") },
    { key: "goals",       label: t("players.goals") },
    { key: "assists",     label: t("players.assists") },
    { key: "passesMade",  label: t("players.passes") },
    { key: "tacklesMade", label: t("players.tackles") },
    { key: "motm",        label: t("session.motm") },
    { key: "rating",      label: t("players.rating") },
  ], [t]);

  const positions = useMemo(() => {
    const set = new Set(players.map((p) => POS_LABELS[p.position] || p.position || "—"));
    return Array.from(set).sort();
  }, [players]);

  // Per-player recent rating history from matchCache (last 10 matches, newest→oldest)
  const playerRecentRatings = useMemo(() => {
    if (!currentClub) return new Map<string, number[]>();
    const key = `${currentClub.id}_${currentClub.platform}_leagueMatch`;
    const cached = matchCache[key] ?? [];
    const byTime = [...cached].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    const map = new Map<string, number[]>();
    for (const m of byTime) {
      const clubPlayers = m.players[currentClub.id] as Record<string, Record<string, unknown>> | undefined;
      if (!clubPlayers) continue;
      for (const p of Object.values(clubPlayers)) {
        const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? "");
        if (!name) continue;
        const rating = Number(p["rating"] ?? p["ratingAve"] ?? 0);
        if (!rating) continue;
        if (!map.has(name)) map.set(name, []);
        const arr = map.get(name)!;
        if (arr.length < 10) arr.push(rating);
      }
    }
    return map;
  }, [matchCache, currentClub?.id]);

  // Returns sparkline values (oldest→newest) for a player
  const sparklineFor = (name: string): number[] => {
    const arr = playerRecentRatings.get(name) ?? [];
    return [...arr].reverse();
  };

  // Returns true if avg of last 5 rated matches < 6.5 (minimum 3 datapoints)
  const isUnderperforming = (name: string): boolean => {
    const arr = playerRecentRatings.get(name) ?? [];
    if (arr.length < 3) return false;
    const recent = arr.slice(0, 5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    return avg < 6.5;
  };

  const sorted = useMemo(() => [...players]
    .filter((p) => {
      if (!p.name.toLowerCase().includes(debouncedFilter.toLowerCase())) return false;
      if (filterPos !== "all" && (POS_LABELS[p.position] || p.position || "—") !== filterPos) return false;
      if (filterMinRating > 0 && p.rating < filterMinRating) return false;
      if (filterMinGames > 0 && p.gamesPlayed < filterMinGames) return false;
      if (filterAlertsOnly && !isUnderperforming(p.name)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "score") {
        const sa = compositeScore(a), sb = compositeScore(b);
        return sortDir === "desc" ? sb - sa : sa - sb;
      }
      const av = a[sortKey as keyof Player], bv = b[sortKey as keyof Player];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
      return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    }), [players, sortKey, sortDir, debouncedFilter, filterPos, filterMinRating, filterMinGames, filterAlertsOnly, playerRecentRatings]);

  const csvHeaders = [t("players.playerCount"), t("players.pos"), t("players.gp"), t("players.goals"), t("players.assistsShort"), t("players.passes"), t("players.tackles"), t("session.motm"), t("players.rating"), "Score"];
  const csvRows = sorted.map((p) => [
    p.name, POS_LABELS[p.position] || p.position || "—",
    p.gamesPlayed, p.goals, p.assists, p.passesMade, p.tacklesMade, p.motm,
    p.rating.toFixed(1), compositeScore(p),
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);

  const handleCardClick = (p: Player) => {
    if (compareMode) {
      setCompareSelected((prev) => {
        if (prev.some((pp) => pp.name === p.name)) return prev.filter((pp) => pp.name !== p.name);
        if (prev.length >= 4) return [...prev.slice(1), p]; // replace oldest when at max
        return [...prev, p];
      });
    } else {
      setSelected(p);
    }
  };

  const isCompareSelected = (p: Player) => compareSelected.some((pp) => pp.name === p.name);
  const compareIdx = (p: Player) => compareSelected.findIndex((pp) => pp.name === p.name);

  const COMPARE_COLORS = ["var(--accent)", "#8b5cf6", "#ff6b35", "#57f287"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 140px", minWidth: 120 }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", pointerEvents: "none" }} />
          <input value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder={t("players.filterPlaceholder")}
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
              padding: "6px 10px 6px 28px", borderRadius: 6, fontSize: 12, outline: "none", width: "100%",
              transition: "border-color 0.15s" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
          {sorted.length} {t("players.playerCount")}
        </span>

        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
            padding: "6px 8px", borderRadius: 6, fontSize: 11, outline: "none", cursor: "pointer", flexShrink: 0 }}>
          {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
          style={{ ...BTN, color: "var(--accent)" }}>
          {sortDir === "desc" ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>

        <button onClick={() => setShowFilters((v) => !v)}
          style={{ ...BTN, color: showFilters || filterPos !== "all" || filterMinRating > 0 || filterMinGames > 0 || filterAlertsOnly ? "var(--accent)" : "var(--muted)",
            borderColor: showFilters ? "var(--accent)" : "var(--border)" }}>
          <Filter size={11} /> {t("players.filter")}
        </button>

        <button onClick={() => { setCompareMode(!compareMode); setCompareSelected([]); setShowCompareModal(false); }}
          style={{ ...BTN, color: compareMode ? "#000" : "var(--muted)",
            background: compareMode ? "var(--accent)" : "var(--card)",
            borderColor: compareMode ? "var(--accent)" : "var(--border)" }}>
          <Users size={11} /> {t("players.compare")}
        </button>

        <button onClick={() => setExportModal("png")} style={{ ...BTN }}>
          <Download size={11} /> PNG
        </button>
        <button onClick={() => setExportModal("csv")} style={{ ...BTN }}>
          <Download size={11} /> CSV
        </button>
      </div>

      {/* Compare mode banner */}
      {compareMode && (
        <div style={{ padding: "6px 16px", background: "var(--card)", borderBottom: "1px solid var(--border)",
          fontSize: 11, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Users size={11} style={{ color: "var(--accent)", flexShrink: 0 }} />
          {compareSelected.length === 0 && (
            <span style={{ color: "var(--muted)" }}>Sélectionne 2 à 4 joueurs à comparer</span>
          )}
          {compareSelected.map((p, i) => (
            <span key={p.name} style={{
              padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
              background: `${COMPARE_COLORS[i]}18`, border: `1px solid ${COMPARE_COLORS[i]}55`,
              color: COMPARE_COLORS[i],
            }}>
              {p.name}
            </span>
          ))}
          {compareSelected.length >= 2 && (
            <button onClick={() => setShowCompareModal(true)}
              style={{ ...BTN, color: "#000", background: "var(--accent)",
                borderColor: "var(--accent)", padding: "4px 10px", fontSize: 11, marginLeft: "auto" }}>
              <Users size={11} /> Comparer ({compareSelected.length})
            </button>
          )}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div style={{ padding: "8px 16px", background: "var(--card)", borderBottom: "1px solid var(--border)",
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{t("players.pos")}</span>
            <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)}
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                padding: "4px 6px", borderRadius: 4, fontSize: 11, outline: "none", cursor: "pointer" }}>
              <option value="all">{t("players.allPositions")}</option>
              {positions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{t("players.minRating")}</span>
            <input type="number" min={0} max={10} step={0.5} value={filterMinRating || ""}
              onChange={(e) => setFilterMinRating(Number(e.target.value) || 0)}
              placeholder="0"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                padding: "4px 6px", borderRadius: 4, fontSize: 11, outline: "none", width: 50 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{t("players.minGames")}</span>
            <input type="number" min={0} step={1} value={filterMinGames || ""}
              onChange={(e) => setFilterMinGames(Number(e.target.value) || 0)}
              placeholder="0"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                padding: "4px 6px", borderRadius: 4, fontSize: 11, outline: "none", width: 50 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <AlertTriangle size={11} style={{ color: "var(--red)" }} />
            <span style={{ fontSize: 10, color: "var(--muted)" }}>Alertes seulement</span>
            <div onClick={() => setFilterAlertsOnly((v) => !v)} style={{
              width: 32, height: 18, borderRadius: 9, cursor: "pointer", flexShrink: 0,
              background: filterAlertsOnly ? "var(--red)" : "var(--border)",
              position: "relative", transition: "background 0.15s",
            }}>
              <div style={{
                position: "absolute", top: 2, left: filterAlertsOnly ? 15 : 2,
                width: 14, height: 14, borderRadius: "50%", background: "#fff",
                transition: "left 0.15s",
              }} />
            </div>
          </div>
          {(filterPos !== "all" || filterMinRating > 0 || filterMinGames > 0 || filterAlertsOnly) && (
            <button onClick={() => { setFilterPos("all"); setFilterMinRating(0); setFilterMinGames(0); setFilterAlertsOnly(false); }}
              style={{ ...BTN, fontSize: 10, color: "var(--red)" }}>
              {t("players.reset")}
            </button>
          )}
        </div>
      )}

      {/* Cards list */}
      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "10px 16px",
        display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((p, i) => {
          const posLabel = POS_LABELS[p.position] || p.position || "—";
          const sel = compareMode && isCompareSelected(p);
          const cIdx = compareIdx(p);
          const sparkline = sparklineFor(p.name);
          const alert = isUnderperforming(p.name);
          const score = compositeScore(p);
          return (
            <div key={`${p.name}-${i}`} onClick={() => handleCardClick(p)}
              className="compact-row"
              style={{
                display: "flex", alignItems: "center", gap: compactMode ? 8 : 12,
                padding: compactMode ? "6px 10px" : "12px 16px",
                background: sel ? `${COMPARE_COLORS[cIdx]}08` : "var(--card)",
                border: `1px solid ${sel ? COMPARE_COLORS[cIdx] : alert ? "rgba(218,55,60,0.35)" : "var(--border)"}`,
                borderRadius: 8, cursor: "pointer", transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = alert ? "rgba(218,55,60,0.35)" : "var(--border)"; }}
            >
              {/* Rank + Avatar */}
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3b" : "var(--muted)",
                width: 18, textAlign: "center", flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <PlayerAvatar name={p.name} size={32} />

              {/* Name + position + alert */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  {alert && (
                    <span title="Note moyenne récente < 6.5">
                      <AlertTriangle size={11} style={{ color: "var(--red)", flexShrink: 0 }} />
                    </span>
                  )}
                </div>
                <span style={{
                  display: "inline-block", marginTop: 3, padding: "1px 6px", borderRadius: 3,
                  background: "var(--bg)", border: "1px solid var(--border)",
                  fontSize: 9, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.04em",
                }}>
                  {posLabel}
                </span>
              </div>

              {/* Sparkline */}
              {sparkline.length >= 2 && (
                <div style={{ flexShrink: 0 }} title={`Dernières notes: ${sparkline.map((v) => v.toFixed(1)).join(", ")}`}>
                  <MiniSparkline values={sparkline} />
                </div>
              )}

              {/* Stats chips */}
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
                {[
                  { label: t("players.gp"),        value: p.gamesPlayed,             color: "var(--text)" },
                  { label: t("players.goalsShort"), value: p.goals    || "—",         color: "var(--accent)" },
                  { label: t("players.assistsShort"), value: p.assists || "—",        color: "var(--text)" },
                  { label: t("session.motm"),       value: p.motm > 0 ? p.motm : "—", color: "#ffd700" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: "center", minWidth: 30 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color, lineHeight: 1 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", marginTop: 2 }}>
                      {label}
                    </div>
                  </div>
                ))}
                <RatingBadge r={p.rating} />
                {sortKey === "score" && (
                  <div style={{ textAlign: "center", minWidth: 36 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: "#ffd700", lineHeight: 1 }}>
                      {score}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", marginTop: 2 }}>
                      Score
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            {t("players.noPlayers")}
          </div>
        )}
      </div>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
      {showCompareModal && compareSelected.length >= 2 && (
        <CompareModal players={compareSelected} allPlayers={players}
          onClose={() => setShowCompareModal(false)} />
      )}
      {exportModal === "png" && (
        <ExportModal type="png" pngSourceEl={contentRef.current}
          defaultFilename={`joueurs-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
      {exportModal === "csv" && (
        <ExportModal type="csv" csvHeaders={csvHeaders} csvRows={csvRows}
          defaultFilename={`joueurs-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
    </div>
  );
}
