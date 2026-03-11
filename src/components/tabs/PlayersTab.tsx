import { useState, useMemo, useRef } from "react";
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { ExportModal } from "../ui/ExportModal";
import type { Player } from "../../types";

type Col = keyof Player;

const COLS: { key: Col; label: string }[] = [
  { key: "gamesPlayed", label: "MJ" },
  { key: "goals",       label: "Buts" },
  { key: "assists",     label: "Passes D." },
  { key: "passesMade",  label: "Passes" },
  { key: "tacklesMade", label: "Tacles" },
  { key: "motm",        label: "MOTM" },
  { key: "rating",      label: "Note" },
];

const POS_LABELS: Record<string, string> = {
  "0":"GK","1":"RB","2":"RB","3":"CB","4":"CB","5":"LB","6":"LB",
  "7":"CDM","8":"CM","9":"CM","10":"CAM","11":"RM","12":"LM",
  "13":"RW","14":"LW","15":"RF","16":"CF","17":"LF","18":"ST","19":"ST",
  "20":"ST","25":"CF","26":"CAM",
};

function ratingColor(r: number) {
  if (r >= 9)   return "#ffd700";
  if (r >= 7.5) return "var(--green)";
  if (r >= 6.5) return "#eab308";
  if (r > 0)    return "var(--red)";
  return "var(--muted)";
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

const BTN = {
  padding: "6px 10px",
  background: "var(--card)" as const,
  border: "1px solid var(--border)",
  borderRadius: 6,
  cursor: "pointer" as const,
  color: "var(--muted)" as const,
  fontSize: 11,
  display: "flex",
  alignItems: "center" as const,
  gap: 4,
  flexShrink: 0,
};

export function PlayersTab() {
  const players = useAppStore((s) => s.players);
  const [sortKey, setSortKey] = useState<Col>("goals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Player | null>(null);
  const [filter, setFilter] = useState("");
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => [...players]
    .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
      return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    }), [players, sortKey, sortDir, filter]);

  const csvHeaders = ["Joueur", "Poste", "MJ", "Buts", "PD", "Passes", "Tacles", "MOTM", "Note"];
  const csvRows = sorted.map((p) => [
    p.name, POS_LABELS[p.position] || p.position || "—",
    p.gamesPlayed, p.goals, p.assists, p.passesMade, p.tacklesMade, p.motm, p.rating.toFixed(1),
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 140px", minWidth: 120 }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", pointerEvents: "none" }} />
          <input value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer…"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
              padding: "6px 10px 6px 28px", borderRadius: 6, fontSize: 12, outline: "none", width: "100%",
              transition: "border-color 0.15s" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
          {sorted.length} joueur{sorted.length !== 1 ? "s" : ""}
        </span>

        {/* Sort */}
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as Col)}
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
            padding: "6px 8px", borderRadius: 6, fontSize: 11, outline: "none", cursor: "pointer", flexShrink: 0 }}>
          {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
          style={{ ...BTN, color: "var(--accent)" as const }}>
          {sortDir === "desc" ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>

        <button onClick={() => setExportModal("png")} style={{ ...BTN }}>
          <Download size={11} /> PNG
        </button>
        <button onClick={() => setExportModal("csv")} style={{ ...BTN }}>
          <Download size={11} /> CSV
        </button>
      </div>

      {/* Cards list */}
      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "10px 16px",
        display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((p, i) => {
          const posLabel = POS_LABELS[p.position] || p.position || "—";
          return (
            <div key={`${p.name}-${i}`} onClick={() => setSelected(p)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
                cursor: "pointer", transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {/* Rank bubble */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, lineHeight: 1,
                background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3b" : "var(--bg)",
                color: i < 3 ? "#000" : "var(--muted)",
                border: i >= 3 ? "1px solid var(--border)" : "none",
              }}>
                {i + 1}
              </div>

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
                  { label: "MJ",   value: p.gamesPlayed,             color: "var(--text)" },
                  { label: "BUTS", value: p.goals   || "—",          color: "var(--accent)" },
                  { label: "PD",   value: p.assists || "—",          color: "var(--text)" },
                  { label: "MOTM", value: p.motm > 0 ? p.motm : "—", color: "#ffd700" },
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
            Aucun joueur
          </div>
        )}
      </div>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
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

function StatCell({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color, lineHeight: 1 }}>
        {String(value)}
      </div>
      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 4,
        fontFamily: "'Bebas Neue', sans-serif" }}>
        {label}
      </div>
    </div>
  );
}

function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const posLabel = POS_LABELS[player.position] ?? player.position ?? "—";

  const baseStats: [string, string | number, string][] = [
    ["MJ",        player.gamesPlayed,          "var(--text)"],
    ["Buts",      player.goals,                "var(--accent)"],
    ["Passes D.", player.assists,              "var(--text)"],
    ["Passes",    player.passesMade,           "var(--muted)"],
    ["Tacles",    player.tacklesMade,          "var(--muted)"],
    ["MOTM",      player.motm,                 "#ffd700"],
    ["Note",      player.rating > 0 ? player.rating.toFixed(1) : "—", ratingColor(player.rating)],
  ];

  // Advanced stats — only show if at least one is non-zero
  const advStats: [string, string | number, string][] = [
    ...(player.shotsOnTarget  ? [["Tirs cadrés",  player.shotsOnTarget,  "var(--accent)"] as [string, number, string]] : []),
    ...(player.interceptions  ? [["Interceptions", player.interceptions,  "var(--text)"] as [string, number, string]] : []),
    ...(player.foulsCommitted ? [["Fautes",        player.foulsCommitted, "var(--muted)"] as [string, number, string]] : []),
    ...(player.yellowCards    ? [["Cartons J",     player.yellowCards,    "#eab308"] as [string, number, string]] : []),
    ...(player.redCards       ? [["Cartons R",     player.redCards,       "var(--red)"] as [string, number, string]] : []),
    ...(player.cleanSheets    ? [["Clean sheets",  player.cleanSheets,    "var(--green)"] as [string, number, string]] : []),
    ...(player.saveAttempts   ? [["Arrêts",        player.saveAttempts,   "var(--text)"] as [string, number, string]] : []),
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 460,
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "var(--text)",
              letterSpacing: "0.06em", lineHeight: 1 }}>
              {player.name}
            </h3>
            <span style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 4,
              background: "var(--bg)", border: "1px solid var(--border)",
              fontSize: 11, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif" }}>
              {posLabel}
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {baseStats.map(([label, value, color]) => (
            <StatCell key={label} label={label} value={value} color={color} />
          ))}
        </div>

        {advStats.length > 0 && (
          <>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", margin: "14px 0 8px" }}>
              STATISTIQUES AVANCÉES
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {advStats.map(([label, value, color]) => (
                <StatCell key={label} label={label} value={value} color={color} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
