import { useState } from "react";
import { Search, Star, StarOff, History, Loader2 } from "lucide-react";
import { searchClub } from "../../api/tauri";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import { PLATFORMS, type Club } from "../../types";

export function SearchTab() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<string>(PLATFORMS[0].value);
  const [directId, setDirectId] = useState("");
  const [results, setResults] = useState<Club[]>([]);
  const [searching, setSearching] = useState(false);

  const { history, favs, toggleFav, setSidebarTab } = useAppStore();
  const { load } = useClub();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const clubs = await searchClub(query.trim(), platform);
      setResults(clubs);
    } catch (err) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLoadClub = async (club: Club) => {
    await load(club.id, club.platform || platform, club);
    setSidebarTab("search");
  };

  const handleDirectId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directId.trim()) return;
    await load(directId.trim(), platform);
    setDirectId("");
  };

  const isFav = (club: Club) => favs.some((f) => f.id === club.id);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Search form */}
      <div className="p-3 border-b border-white/5 space-y-2">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full bg-[#111820] text-slate-300 text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="flex gap-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom du club…"
            className="flex-1 bg-[#111820] text-slate-200 text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-2 py-1.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30 transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </form>

        {/* Direct ID */}
        <form onSubmit={handleDirectId} className="flex gap-1">
          <input
            value={directId}
            onChange={(e) => setDirectId(e.target.value)}
            placeholder="ID direct…"
            className="flex-1 bg-[#111820] text-slate-400 text-xs rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50"
          />
          <button
            type="submit"
            className="px-2 py-1.5 bg-white/5 text-slate-400 rounded hover:bg-white/10 text-xs transition-colors"
          >
            →
          </button>
        </form>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="border-b border-white/5">
          <p className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider">Résultats</p>
          {results.map((club) => (
            <ClubRow
              key={club.id}
              club={club}
              isFav={isFav(club)}
              onLoad={() => handleLoadClub(club)}
              onToggleFav={() => toggleFav(club)}
            />
          ))}
        </div>
      )}

      {/* Favorites */}
      {favs.length > 0 && (
        <div className="border-b border-white/5">
          <p className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider">Favoris</p>
          {favs.map((club) => (
            <ClubRow
              key={club.id}
              club={club}
              isFav={true}
              onLoad={() => handleLoadClub(club)}
              onToggleFav={() => toggleFav(club)}
            />
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <History size={10} /> Récents
          </p>
          {history.map((club) => (
            <ClubRow
              key={club.id}
              club={club}
              isFav={isFav(club)}
              onLoad={() => handleLoadClub(club)}
              onToggleFav={() => toggleFav(club)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClubRow({
  club,
  isFav,
  onLoad,
  onToggleFav,
}: {
  club: Club;
  isFav: boolean;
  onLoad: () => void;
  onToggleFav: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 group cursor-pointer" onClick={onLoad}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{club.name}</p>
        <p className="text-[10px] text-slate-500">SR {club.skillRating ?? "—"}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-yellow-400 transition-all"
      >
        {isFav ? <Star size={13} fill="currentColor" className="text-yellow-400" /> : <StarOff size={13} />}
      </button>
    </div>
  );
}
