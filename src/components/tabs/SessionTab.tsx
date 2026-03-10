import { useAppStore } from "../../store/useAppStore";
import { useSession } from "../../hooks/useSession";
import { Play, Square, Trophy } from "lucide-react";
import { Badge } from "../ui/Badge";
import type { Match } from "../../types";

function sessionKpis(matches: Match[]) {
  let goals = 0, assists = 0, passes = 0, tackles = 0, motm = 0;
  for (const m of matches) {
    for (const clubPlayers of Object.values(m.players)) {
      for (const p of Object.values(
        clubPlayers as Record<string, Record<string, unknown>>
      )) {
        goals += Number(p["goals"] ?? 0);
        assists += Number(p["assists"] ?? 0);
        passes += Number(p["passesMade"] ?? p["passesmade"] ?? 0);
        tackles += Number(p["tacklesMade"] ?? p["tacklesmade"] ?? 0);
        if (p["mom"] === "1" || p["manofthematch"] === "1") motm++;
      }
    }
  }
  return { goals, assists, passes, tackles, motm };
}

export function SessionTab() {
  // Activate polling hook
  useSession();

  const {
    activeSession, sessions, currentClub,
    startSession, stopSession, persistSettings,
  } = useAppStore();

  const handleStop = () => {
    stopSession();
    persistSettings();
  };

  const kpis = activeSession ? sessionKpis(activeSession.matches) : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      {/* Active session */}
      {activeSession ? (
        <>
          <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p
                  className="text-lg text-[var(--accent)]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
                >
                  {activeSession.clubName}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(activeSession.date).toLocaleString()} · Polling 30s
                </p>
              </div>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                <Square size={13} /> Terminer
              </button>
            </div>

            {/* Live KPIs */}
            {kpis && (
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Buts", value: kpis.goals },
                  { label: "PD", value: kpis.assists },
                  { label: "Passes", value: kpis.passes },
                  { label: "Tacles", value: kpis.tackles },
                  { label: "MOTM", value: kpis.motm },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-[#090c10] rounded-lg p-2">
                    <p className="text-xl font-bold text-[var(--accent)]">{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matches in session */}
          {activeSession.matches.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Matchs joués</p>
              {[...activeSession.matches].reverse().map((m) => {
                const clubData = currentClub
                  ? (m.clubs[currentClub.id] as Record<string, unknown>)
                  : null;
                const goals = clubData?.["goals"] ?? "?";
                const result = (clubData?.["matchResult"] as string) ?? "";
                const r = result === "win" ? "W" : result === "loss" ? "L" : "D";
                return (
                  <div key={m.matchId} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <Badge result={r} />
                    <span className="text-sm text-slate-300">{String(goals)} but(s)</span>
                    <span className="text-xs text-slate-600 ml-auto capitalize">{m.matchType}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : currentClub ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <Trophy size={40} className="text-slate-600" />
          <p className="text-slate-500">Aucune session active</p>
          <button
            onClick={() => startSession(currentClub)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/20 text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/30 transition-colors"
          >
            <Play size={15} /> Démarrer
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-slate-600">
          Charge un club d'abord
        </div>
      )}

      {/* Past sessions */}
      {sessions.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sessions passées</p>
          {sessions.map((s) => {
            const k = sessionKpis(s.matches);
            return (
              <div key={s.id} className="bg-[#111820] rounded-lg p-3 mb-2 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-slate-200">{s.clubName}</p>
                  <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString()}</p>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {[
                    { l: "MJ", v: s.matches.length },
                    { l: "Buts", v: k.goals },
                    { l: "PD", v: k.assists },
                    { l: "Passes", v: k.passes },
                    { l: "MOTM", v: k.motm },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p className="text-[var(--accent)] font-bold text-sm">{v}</p>
                      <p className="text-[10px] text-slate-600">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
