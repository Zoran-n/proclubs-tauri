import { Users, List, BarChart2, Play, Crosshair } from "lucide-react";
import { useAppStore, type ActiveTab } from "../../store/useAppStore";
import { PlayersTab } from "../tabs/PlayersTab";
import { MatchesTab } from "../tabs/MatchesTab";
import { ChartsTab } from "../tabs/ChartsTab";
import { SessionTab } from "../tabs/SessionTab";
import { TacticsTab } from "../tabs/TacticsTab";
import { Spinner } from "../ui/Spinner";

const TABS: { id: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { id: "players", icon: <Users size={15} />, label: "Joueurs" },
  { id: "matches", icon: <List size={15} />, label: "Matchs" },
  { id: "charts", icon: <BarChart2 size={15} />, label: "Graphiques" },
  { id: "session", icon: <Play size={15} />, label: "Session" },
  { id: "tactics", icon: <Crosshair size={15} />, label: "Tactiques" },
];

export function MainPanel() {
  const { currentClub, activeTab, setActiveTab, isLoading, error } = useAppStore();

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[#090c10]">
      {/* Club banner */}
      {currentClub && (
        <div className="flex items-center gap-4 px-6 py-3 bg-[#0d1117] border-b border-white/5 shrink-0">
          <div className="flex flex-col">
            <span
              className="text-xl text-white tracking-wider"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {currentClub.name}
            </span>
            <span className="text-xs text-slate-500">
              {currentClub.platform} · SR {currentClub.skillRating ?? "—"}
            </span>
          </div>
          <div className="ml-auto flex gap-6 text-center">
            {[
              { label: "V", value: currentClub.wins, color: "text-green-400" },
              { label: "N", value: currentClub.ties, color: "text-yellow-400" },
              { label: "D", value: currentClub.losses, color: "text-red-400" },
              { label: "Buts", value: currentClub.goals, color: "text-[var(--accent)]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col">
                <span className={`text-lg font-bold ${color}`}>{value}</span>
                <span className="text-[10px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-[#0d1117] shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <Spinner size={40} />
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-900/80 text-red-200 px-4 py-2 rounded-lg text-sm border border-red-500/40">
            {error}
          </div>
        )}

        {!currentClub && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
            <BarChart2 size={48} />
            <p className="text-lg" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}>
              RECHERCHE UN CLUB POUR COMMENCER
            </p>
          </div>
        ) : (
          <>
            {activeTab === "players" && <PlayersTab />}
            {activeTab === "matches" && <MatchesTab />}
            {activeTab === "charts" && <ChartsTab />}
            {activeTab === "session" && <SessionTab />}
            {activeTab === "tactics" && <TacticsTab />}
          </>
        )}
      </div>
    </main>
  );
}
