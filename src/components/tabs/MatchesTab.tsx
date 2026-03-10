import { useState, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { getMatches } from "../../api/tauri";
import { MATCH_TYPES, type MatchType, type Match } from "../../types";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Loader2 } from "lucide-react";

export function MatchesTab() {
  const { currentClub, matches: leagueMatches } = useAppStore();
  const [activeType, setActiveType] = useState<MatchType>("leagueMatch");
  const [cache, setCache] = useState<Partial<Record<MatchType, Match[]>>>({
    leagueMatch: leagueMatches,
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);

  useEffect(() => {
    if (!currentClub || cache[activeType]) return;
    setLoading(true);
    getMatches(currentClub.id, currentClub.platform, activeType)
      .then((data) => setCache((c) => ({ ...c, [activeType]: data })))
      .finally(() => setLoading(false));
  }, [activeType, currentClub]);

  useEffect(() => {
    setCache((c) => ({ ...c, leagueMatch: leagueMatches }));
  }, [leagueMatches]);

  const list = cache[activeType] ?? [];

  const getResult = (match: Match, clubId: string): "W" | "D" | "L" => {
    const clubData = match.clubs[clubId] as Record<string, unknown> | undefined;
    const result = clubData?.["matchResult"] as string | undefined;
    if (result === "win") return "W";
    if (result === "loss") return "L";
    return "D";
  };

  const getScore = (match: Match, clubId: string) => {
    const c = match.clubs[clubId] as Record<string, unknown> | undefined;
    return `${c?.["goals"] ?? "?"} — ${Object.values(match.clubs)
      .filter((_, i) => Object.keys(match.clubs)[i] !== clubId)
      .map((v) => (v as Record<string, unknown>)["goals"] ?? "?")
      .join("")}`;
  };

  const formatDate = (ts: string) => {
    const n = Number(ts) * 1000 || Number(ts);
    const d = new Date(isNaN(n) ? ts : n);
    return isNaN(d.getTime()) ? ts : d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-white/5 shrink-0">
        {MATCH_TYPES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveType(value)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeType === value
                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
        {loading && <Loader2 size={14} className="animate-spin text-slate-500 ml-2 my-auto" />}
      </div>

      {/* Match list */}
      <div className="flex-1 overflow-y-auto">
        {list.map((match) => (
          <div
            key={match.matchId}
            onClick={() => setSelected(match)}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer"
          >
            <Badge result={currentClub ? getResult(match, currentClub.id) : "D"} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200">
                {currentClub ? getScore(match, currentClub.id) : "—"}
              </p>
              <p className="text-xs text-slate-500">{formatDate(match.timestamp)}</p>
            </div>
            {match.duration && (
              <span className="text-xs text-slate-600">{match.duration}"</span>
            )}
          </div>
        ))}
        {!loading && list.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Aucun match
          </div>
        )}
      </div>

      {selected && (
        <Modal title="Détail du match" onClose={() => setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex gap-6 text-sm text-slate-400">
              <span>{formatDate(selected.timestamp)}</span>
              {selected.duration && <span>Durée : {selected.duration}''</span>}
              <span className="capitalize">{selected.matchType}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(selected.clubs).map(([cId, cData]) => {
                const d = cData as Record<string, unknown>;
                return (
                  <div key={cId} className="bg-[#090c10] rounded-lg p-4">
                    <p className="font-bold text-white mb-2">{d["name"] as string ?? cId}</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {[["Buts", "goals"], ["Tirs", "shots"], ["Passes", "passesmade"]].map(
                        ([label, key]) => (
                          <div key={key}>
                            <p className="text-[var(--accent)] font-bold">{String(d[key] ?? "—")}</p>
                            <p className="text-slate-500">{label}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Players in match */}
            {Object.keys(selected.players).length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Joueurs</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        {["Joueur", "Buts", "PD", "Note"].map((h) => (
                          <th key={h} className="px-2 py-1 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(selected.players).flatMap((clubPlayers) =>
                        Object.values(clubPlayers as Record<string, Record<string, unknown>>).map(
                          (p, i) => (
                            <tr key={i} className="border-t border-white/5">
                              <td className="px-2 py-1 text-slate-300">{String(p["name"] ?? p["playername"] ?? "—")}</td>
                              <td className="px-2 py-1 text-[var(--accent)]">{String(p["goals"] ?? 0)}</td>
                              <td className="px-2 py-1 text-slate-300">{String(p["assists"] ?? 0)}</td>
                              <td className="px-2 py-1 text-slate-300">{String(p["rating"] ?? p["ratingAve"] ?? "—")}</td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
