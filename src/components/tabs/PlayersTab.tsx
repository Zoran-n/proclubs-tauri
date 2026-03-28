import { useState, useMemo, useRef } from "react";
import { Search, Download, ChevronUp, ChevronDown, Users, Filter } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { ExportModal } from "../ui/ExportModal";
import { useT } from "../../i18n";
import type { Player } from "../../types";
import { PlayerModal, POS_LABELS, PlayerAvatar, ratingColor } from "../modals/PlayerModal";
import { CompareModal } from "../modals/CompareModal";
import { useDebounce } from "../../hooks/useDebounce";

type Col = keyof Player;

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
  padding: "6px 10px",
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  cursor: "pointer",
  color: "var(--muted)",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
};

export function PlayersTab() {
  const t = useT();
  const players = useAppStore((s) => s.players);
  const [sortKey, setSortKey] = useState<Col>("goals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Player | null>(null);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter, 200);
  const [filterPos, setFilterPos] = useState<string>("all");
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [filterMinGames, setFilterMinGames] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Player[]>([]);

  const COLS = useMemo(() => [
    { key: "gamesPlayed" as Col, label: t("players.games") },
    { key: "goals" as Col,       label: t("players.goals") },
    { key: "assists" as Col,     label: t("players.assists") },
    { key: "passesMade" as Col,  label: t("players.passes") },
    { key: "tacklesMade" as Col, label: t("players.tackles") },
    { key: "motm" as Col,        label: t("session.motm") },
    { key: "rating" as Col,      label: t("players.rating") },
  ], [t]);

  const positions = useMemo(() => {
    const set = new Set(players.map((p) => POS_LABELS[p.position] || p.position || "—"));
    return Array.from(set).sort();
  }, [players]);

  const sorted = useMemo(() => [...players]
    .filter((p) => {
      if (!p.name.toLowerCase().includes(debouncedFilter.toLowerCase())) return false;
      if (filterPos !== "all" && (POS_LABELS[p.position] || p.position || "—") !== filterPos) return false;
      if (filterMinRating > 0 && p.rating < filterMinRating) return false;
      if (filterMinGames > 0 && p.gamesPlayed < filterMinGames) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
      return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    }), [players, sortKey, sortDir, debouncedFilter, filterPos, filterMinRating, filterMinGames]);

  const csvHeaders = [t("players.playerCount"), t("players.pos"), t("players.gp"), t("players.goals"), t("players.assistsShort"), t("players.passes"), t("players.tackles"), t("session.motm"), t("players.rating")];
  const csvRows = sorted.map((p) => [
    p.name, POS_LABELS[p.position] || p.position || "—",
    p.gamesPlayed, p.goals, p.assists, p.passesMade, p.tacklesMade, p.motm, p.rating.toFixed(1),
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);

  const handleCardClick = (p: Player) => {
    if (compareMode) {
      setCompareSelected((prev) => {
        if (prev.some((pp) => pp.name === p.name)) return prev.filter((pp) => pp.name !== p.name);
        if (prev.length >= 2) return [prev[1], p];
        return [...prev, p];
      });
    } else {
      setSelected(p);
    }
  };

  const isCompareSelected = (p: Player) => compareSelected.some((pp) => pp.name === p.name);

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

        {/* Sort */}
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as Col)}
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
            padding: "6px 8px", borderRadius: 6, fontSize: 11, outline: "none", cursor: "pointer", flexShrink: 0 }}>
          {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
          style={{ ...BTN, color: "var(--accent)" }}>
          {sortDir === "desc" ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>

        {/* Filter button */}
        <button onClick={() => setShowFilters((v) => !v)}
          style={{ ...BTN, color: showFilters || filterPos !== "all" || filterMinRating > 0 || filterMinGames > 0 ? "var(--accent)" : "var(--muted)",
            borderColor: showFilters ? "var(--accent)" : "var(--border)" }}>
          <Filter size={11} /> {t("players.filter")}
        </button>

        {/* Compare button */}
        <button onClick={() => { setCompareMode(!compareMode); setCompareSelected([]); }}
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

      {/* Compare mode hint */}
      {compareMode && (
        <div style={{ padding: "6px 16px", background: "var(--card)", borderBottom: "1px solid var(--border)",
          fontSize: 11, color: "var(--accent)", display: "flex", gap: 8, alignItems: "center" }}>
          <Users size={11} />
          {compareSelected.length === 0 && t("players.compareHint0")}
          {compareSelected.length === 1 && <>{compareSelected[0].name} — {t("players.compareHint1")}</>}
          {compareSelected.length === 2 && <>{compareSelected[0].name} vs {compareSelected[1].name}</>}
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
          {(filterPos !== "all" || filterMinRating > 0 || filterMinGames > 0) && (
            <button onClick={() => { setFilterPos("all"); setFilterMinRating(0); setFilterMinGames(0); }}
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
          return (
            <div key={`${p.name}-${i}`} onClick={() => handleCardClick(p)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                background: sel ? "rgba(0,212,255,0.06)" : "var(--card)",
                border: sel ? "1px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer", transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { if (!sel) e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { if (!sel) e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {/* Rank + Avatar */}
              <span style={{
                fontSize: 11, fontWeight: 700, color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3b" : "var(--muted)",
                width: 18, textAlign: "center", flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <PlayerAvatar name={p.name} size={32} />

              {/* Name + position */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
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

              {/* Stats chips */}
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
                {[
                  { label: t("players.gp"),   value: p.gamesPlayed,             color: "var(--text)" },
                  { label: t("players.goalsShort"), value: p.goals   || "—",          color: "var(--accent)" },
                  { label: t("players.assistsShort"),   value: p.assists || "—",          color: "var(--text)" },
                  { label: t("session.motm"), value: p.motm > 0 ? p.motm : "—", color: "#ffd700" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: "center", minWidth: 30 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17,
                      color, lineHeight: 1 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", marginTop: 2 }}>
                      {label}
                    </div>
                  </div>
                ))}
                <RatingBadge r={p.rating} />
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
      {compareSelected.length === 2 && (
        <CompareModal p1={compareSelected[0]} p2={compareSelected[1]}
          allPlayers={players} onClose={() => setCompareSelected([])} />
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

