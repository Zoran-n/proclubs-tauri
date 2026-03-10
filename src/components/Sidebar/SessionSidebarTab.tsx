import { useState } from "react";
import { Play, Square, User } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { PLATFORMS, type EaProfile } from "../../types";

export function SessionSidebarTab() {
  const {
    currentClub, activeSession, eaProfile, sessions,
    startSession, stopSession, setEaProfile, persistSettings,
  } = useAppStore();

  const [gamertag, setGamertag] = useState(eaProfile?.gamertag ?? "");
  const [platform, setPlatform] = useState(eaProfile?.platform ?? PLATFORMS[0].value);

  const handleSaveProfile = () => {
    const profile: EaProfile = {
      gamertag: gamertag.trim(),
      platform,
      clubId: currentClub?.id ?? "",
      clubName: currentClub?.name ?? "",
    };
    setEaProfile(profile);
    persistSettings();
  };

  const handleStart = () => {
    if (currentClub) startSession(currentClub);
  };

  const handleStop = () => {
    stopSession();
    persistSettings();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* EA Profile */}
      <div className="p-3 border-b border-white/5 space-y-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <User size={10} /> Profil EA
        </p>
        <input
          value={gamertag}
          onChange={(e) => setGamertag(e.target.value)}
          placeholder="Gamertag…"
          className="w-full bg-[#111820] text-slate-200 text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full bg-[#111820] text-slate-300 text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <button
          onClick={handleSaveProfile}
          disabled={!gamertag.trim()}
          className="w-full py-1.5 text-sm bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30 transition-colors disabled:opacity-40"
        >
          Enregistrer
        </button>
      </div>

      {/* Session control */}
      <div className="p-3 border-b border-white/5 space-y-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Session</p>
        {activeSession ? (
          <>
            <div className="text-xs text-slate-300 bg-[var(--accent)]/10 rounded p-2 border border-[var(--accent)]/20">
              <p className="text-[var(--accent)] font-medium">{activeSession.clubName}</p>
              <p className="text-slate-500 mt-0.5">{activeSession.matches.length} match(s)</p>
            </div>
            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              <Square size={13} /> Terminer la session
            </button>
          </>
        ) : (
          <button
            onClick={handleStart}
            disabled={!currentClub}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-sm bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30 transition-colors disabled:opacity-40"
          >
            <Play size={13} /> Démarrer la session
          </button>
        )}
        {!currentClub && (
          <p className="text-[10px] text-slate-600 text-center">Charge un club d'abord</p>
        )}
      </div>

      {/* Saved sessions */}
      {sessions.length > 0 && (
        <div>
          <p className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider">Sessions sauvegardées</p>
          {sessions.map((s) => (
            <div key={s.id} className="px-3 py-2 border-b border-white/5 hover:bg-white/5">
              <p className="text-sm text-slate-300">{s.clubName}</p>
              <p className="text-[10px] text-slate-500">
                {new Date(s.date).toLocaleDateString()} · {s.matches.length} match(s)
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
