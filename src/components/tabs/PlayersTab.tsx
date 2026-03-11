import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import type { Player } from "../../types";

type Col = keyof Player;

const COLS: { key: Col; label: string; align?: "right" }[] = [
  { key: "gamesPlayed", label: "MJ",     align: "right" },
  { key: "goals",       label: "Buts",   align: "right" },
  { key: "assists",     label: "Passes D.", align: "right" },
  { key: "passesMade",  label: "Passes", align: "right" },
  { key: "tacklesMade", label: "Tacles", align: "right" },
  { key: "motm",        label: "MOTM",   align: "right" },
  { key: "rating",      label: "Note",   align: "right" },
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
      minWidth: 38, padding: "2px 7px", borderRadius: 12,
      background: `${color}18`, border: `1px solid ${color}55`,
      color, fontSize: 12, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif",
      letterSpacing: "0.04em",
    }}>
      {r.toFixed(1)}
    </span>
  );
}

export function PlayersTab() {
  const players = useAppStore((s) => s.players);
  const [sortKey, setSortKey] = useState<Col>("goals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Player | null>(null);
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => [...players]
    .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
      return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    }), [players, sortKey, sortDir, filter]);

  const onSort = (k: Col) => {
    if (sortKey === k) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Filter bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", pointerEvents: "none" }} />
          <input value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer…"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
              padding: "6px 10px 6px 28px", borderRadius: 6, fontSize: 12, outline: "none", width: 180,
              transition: "border-color 0.15s" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{sorted.length} joueur{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <tr style={{ background: "var(--surface)", borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "8px 12px", width: 44, fontWeight: "normal" }} />
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--muted)",
                fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", fontWeight: "normal" }}>
                JOUEUR
              </th>
              <th style={{ padding: "8px 8px", width: 54, fontWeight: "normal" }} />
              {COLS.map(({ key, label }) => (
                <th key={key} onClick={() => onSort(key)} style={{
                  padding: "8px 12px", textAlign: "right", fontSize: 10, fontWeight: "normal",
                  color: sortKey === key ? "var(--accent)" : "var(--muted)",
                  fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em",
                  cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                    {sortKey === key && (
                      sortDir === "desc"
                        ? <ChevronDown size={10} />
                        : <ChevronUp size={10} />
                    )}
                    {label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const posLabel = POS_LABELS[p.position] ?? p.position ?? "—";
              return (
                <tr key={`${p.name}-${i}`} className="player-row"
                  onClick={() => setSelected(p)}>

                  {/* Rank */}
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, lineHeight: 1,
                      background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3b" : "var(--card)",
                      color: i < 3 ? "#000" : "var(--muted)",
                      border: i >= 3 ? "1px solid var(--border)" : "none",
                    }}>
                      {i + 1}
                    </div>
                  </td>

                  {/* Name */}
                  <td style={{ padding: "10px 12px", color: "var(--text)", fontWeight: 600 }}>
                    {p.name}
                  </td>

                  {/* Position */}
                  <td style={{ padding: "10px 8px" }}>
                    <span style={{
                      display: "inline-block", padding: "2px 7px", borderRadius: 4,
                      background: "var(--card)", border: "1px solid var(--border)",
                      fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif",
                      letterSpacing: "0.04em",
                    }}>
                      {posLabel}
                    </span>
                  </td>

                  {/* MJ */}
                  <td className="stat-cell" style={{ padding: "10px 12px", textAlign: "right", color: "var(--text)" }}>
                    {p.gamesPlayed}
                  </td>

                  {/* Buts */}
                  <td className="stat-cell" style={{ padding: "10px 12px", textAlign: "right",
                    color: "var(--accent)", fontWeight: 700 }}>
                    {p.goals || "—"}
                  </td>

                  {/* Passes D. */}
                  <td className="stat-cell" style={{ padding: "10px 12px", textAlign: "right", color: "var(--text)" }}>
                    {p.assists || "—"}
                  </td>

                  {/* Passes */}
                  <td className="stat-cell" style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)" }}>
                    {p.passesMade}
                  </td>

                  {/* Tacles */}
                  <td className="stat-cell" style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)" }}>
                    {p.tacklesMade}
                  </td>

                  {/* MOTM */}
                  <td className="stat-cell" style={{ padding: "10px 12px", textAlign: "right",
                    color: "#ffd700", fontWeight: 700 }}>
                    {p.motm > 0 ? p.motm : "—"}
                  </td>

                  {/* Note */}
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <RatingBadge r={p.rating} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Aucun joueur
          </div>
        )}
      </div>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const posLabel = POS_LABELS[player.position] ?? player.position ?? "—";
  const stats: [string, string | number, string][] = [
    ["MJ",        player.gamesPlayed,          "var(--text)"],
    ["Buts",      player.goals,                "var(--accent)"],
    ["Passes D.", player.assists,              "var(--text)"],
    ["Passes",    player.passesMade,           "var(--muted)"],
    ["Tacles",    player.tacklesMade,          "var(--muted)"],
    ["MOTM",      player.motm,                 "#ffd700"],
    ["Note",      player.rating > 0 ? player.rating.toFixed(1) : "—", ratingColor(player.rating)],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 420,
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
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

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {stats.map(([label, value, color]) => (
            <div key={label} style={{ background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: String(color),
                lineHeight: 1 }}>
                {String(value)}
              </div>
              <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 4,
                fontFamily: "'Bebas Neue', sans-serif" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
