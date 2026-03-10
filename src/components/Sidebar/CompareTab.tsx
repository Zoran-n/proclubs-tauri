import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchClub, loadClub } from "../../api/tauri";
import { PLATFORMS, type Club, type ClubData } from "../../types";

export function CompareTab() {
  const [platform, setPlatform] = useState<string>(PLATFORMS[0].value);
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [clubA, setClubA] = useState<ClubData | null>(null);
  const [clubB, setClubB] = useState<ClubData | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [resultsA, setResultsA] = useState<Club[]>([]);
  const [resultsB, setResultsB] = useState<Club[]>([]);

  const search = async (query: string, side: "A" | "B") => {
    if (!query.trim()) return;
    const setLoading = side === "A" ? setLoadingA : setLoadingB;
    const setResults = side === "A" ? setResultsA : setResultsB;
    setLoading(true);
    try {
      const clubs = await searchClub(query.trim(), platform);
      setResults(clubs);
    } finally {
      setLoading(false);
    }
  };

  const pick = async (club: Club, side: "A" | "B") => {
    const setData = side === "A" ? setClubA : setClubB;
    const setLoading = side === "A" ? setLoadingA : setLoadingB;
    const setResults = side === "A" ? setResultsA : setResultsB;
    setLoading(true);
    setResults([]);
    try {
      const data = await loadClub(club.id, platform);
      setData(data);
    } finally {
      setLoading(false);
    }
  };

  const stats = (data: ClubData | null) =>
    data
      ? [
          { label: "V", value: data.club.wins },
          { label: "N", value: data.club.ties },
          { label: "D", value: data.club.losses },
          { label: "SR", value: data.club.skillRating ?? "—" },
          { label: "Buts", value: data.club.goals },
          { label: "Joueurs", value: data.players.length },
        ]
      : [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-3">
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="w-full bg-[#111820] text-slate-300 text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none"
      >
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {(["A", "B"] as const).map((side) => {
        const query = side === "A" ? queryA : queryB;
        const setQuery = side === "A" ? setQueryA : setQueryB;
        const loading = side === "A" ? loadingA : loadingB;
        const results = side === "A" ? resultsA : resultsB;
        const club = side === "A" ? clubA : clubB;

        return (
          <div key={side} className="bg-[#111820] rounded-lg border border-white/10 p-3 space-y-2">
            <p className="text-xs text-[var(--accent)] font-bold">Club {side}</p>
            <div className="flex gap-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search(query, side)}
                placeholder="Rechercher…"
                className="flex-1 bg-[#090c10] text-slate-200 text-sm rounded px-2 py-1 border border-white/10 focus:outline-none"
              />
              <button
                onClick={() => search(query, side)}
                disabled={loading}
                className="px-2 text-slate-400 hover:text-white"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              </button>
            </div>

            {results.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pick(c, side)}
                    className="w-full text-left px-2 py-1 text-sm text-slate-300 hover:bg-white/10 rounded"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {club && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                {stats(club).map(({ label, value }) => (
                  <div key={label} className="text-center bg-[#090c10] rounded p-1">
                    <p className="text-[var(--accent)] font-bold text-sm">{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
