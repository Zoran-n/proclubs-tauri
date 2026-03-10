import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { Modal } from "../ui/Modal";
import type { Player } from "../../types";

type SortKey = keyof Player;

const COLS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Joueur" },
  { key: "position", label: "Poste" },
  { key: "gamesPlayed", label: "MJ" },
  { key: "goals", label: "Buts" },
  { key: "assists", label: "PD" },
  { key: "passesMade", label: "Passes" },
  { key: "tackles", label: "Tacles" },
  { key: "motm", label: "MOTM" },
  { key: "rating", label: "Note" },
];

export function PlayersTab() {
  const players = useAppStore((s) => s.players);
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Player | null>(null);

  const sorted = useMemo(() => {
    return [...players]
      .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "desc" ? bv - av : av - bv;
        }
        return sortDir === "desc"
          ? String(bv).localeCompare(String(av))
          : String(av).localeCompare(String(bv));
      });
  }, [players, sortKey, sortDir, filter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />
    ) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 shrink-0">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer par nom…"
          className="w-64 bg-[#111820] text-slate-200 text-sm rounded px-3 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#0d1117]">
            <tr>
              {COLS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-3 py-2 text-left text-slate-500 text-xs font-medium cursor-pointer hover:text-slate-300 whitespace-nowrap select-none"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon k={key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr
                key={`${player.name}-${i}`}
                onClick={() => setSelected(player)}
                className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
              >
                <td className="px-3 py-2 text-slate-200 font-medium">{player.name}</td>
                <td className="px-3 py-2 text-slate-400 text-xs">{player.position}</td>
                <td className="px-3 py-2 text-slate-300">{player.gamesPlayed}</td>
                <td className="px-3 py-2 text-[var(--accent)] font-bold">{player.goals}</td>
                <td className="px-3 py-2 text-slate-300">{player.assists}</td>
                <td className="px-3 py-2 text-slate-300">{player.passesMade}</td>
                <td className="px-3 py-2 text-slate-300">{player.tackles}</td>
                <td className="px-3 py-2 text-yellow-400">{player.motm}</td>
                <td className="px-3 py-2 text-slate-300">{player.rating.toFixed(1)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-600">
                  Aucun joueur
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="grid grid-cols-2 gap-3">
            {COLS.slice(2).map(({ key, label }) => (
              <div key={key} className="bg-[#090c10] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--accent)]">
                  {typeof selected[key] === "number"
                    ? key === "rating"
                      ? (selected[key] as number).toFixed(1)
                      : selected[key]
                    : selected[key]}
                </p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
