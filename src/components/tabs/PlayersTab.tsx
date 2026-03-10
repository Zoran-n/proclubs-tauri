import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import type { Player } from "../../types";

type Col = keyof Player;
const COLS: { key: Col; label: string }[] = [
  { key: "name", label: "Joueur" }, { key: "position", label: "Poste" },
  { key: "gamesPlayed", label: "MJ" }, { key: "goals", label: "Buts" },
  { key: "assists", label: "Passes D." }, { key: "passesMade", label: "Passes" },
  { key: "tacklesMade", label: "Tacles" }, { key: "motm", label: "MOTM" }, { key: "rating", label: "Note" },
];

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

  const onSort = (k: Col) => { if (sortKey === k) setSortDir((d) => d === "desc" ? "asc" : "desc"); else { setSortKey(k); setSortDir("desc"); } };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer…"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", padding: "5px 10px", borderRadius: 4, fontSize: 12, outline: "none", width: 200 }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--surface)" }}>
            <tr>
              <th style={{ padding: "6px 12px", textAlign: "center", fontSize: 10, color: "var(--muted)", fontWeight: "normal" }}>#</th>
              {COLS.map(({ key, label }) => (
                <th key={key} onClick={() => onSort(key)} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, color: sortKey === key ? "var(--accent)" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: "normal" }}>
                  {label} {sortKey === key && (sortDir === "desc" ? <ChevronDown size={10} style={{ display: "inline" }} /> : <ChevronUp size={10} style={{ display: "inline" }} />)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={`${p.name}-${i}`} onClick={() => setSelected(p)}
                style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "6px 12px", textAlign: "center" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3b" : "var(--card)", color: i < 3 ? "#000" : "var(--muted)", border: i >= 3 ? "1px solid var(--border)" : "none" }}>
                    {i + 1}
                  </div>
                </td>
                <td style={{ padding: "6px 10px", color: "var(--text)", fontWeight: "500" }}>{p.name}</td>
                <td style={{ padding: "6px 10px" }}>
                  <span style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 3, fontSize: 10, color: "var(--muted)" }}>{p.position}</span>
                </td>
                <td style={{ padding: "6px 10px", color: "var(--text)" }}>{p.gamesPlayed}</td>
                <td style={{ padding: "6px 10px", color: "var(--accent)", fontWeight: "bold" }}>{p.goals}</td>
                <td style={{ padding: "6px 10px", color: "var(--text)" }}>{p.assists}</td>
                <td style={{ padding: "6px 10px", color: "var(--text)" }}>{p.passesMade}</td>
                <td style={{ padding: "6px 10px", color: "var(--text)" }}>{p.tacklesMade}</td>
                <td style={{ padding: "6px 10px", color: "#ffd700" }}>{p.motm}</td>
                <td style={{ padding: "6px 10px", color: ratingColor(p.rating) }}>{p.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ratingColor(r: number) {
  if (r >= 9) return "#ffd700";
  if (r >= 7.5) return "var(--green)";
  if (r >= 6.5) return "#eab308";
  return "var(--red)";
}

function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 400, border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--text)", marginBottom: 4 }}>{player.name}</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{player.position}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[["MJ", player.gamesPlayed, "var(--text)"], ["Buts", player.goals, "var(--accent)"], ["Passes D.", player.assists, "var(--text)"],
            ["Passes", player.passesMade, "var(--text)"], ["Tacles", player.tacklesMade, "var(--text)"],
            ["MOTM", player.motm, "#ffd700"], ["Note", player.rating.toFixed(1), ratingColor(player.rating)]].map(([l, v, c]) => (
            <div key={String(l)} style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: String(c) }}>{String(v)}</p>
              <p style={{ fontSize: 10, color: "var(--muted)" }}>{String(l)}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "8px", background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 6, cursor: "pointer" }}>Fermer</button>
      </div>
    </div>
  );
}
