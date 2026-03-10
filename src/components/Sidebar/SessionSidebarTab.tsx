import { useState } from "react";
import { Play, Square, User, Link } from "lucide-react";
import { searchClub, getMembers } from "../../api/tauri";
import { useAppStore } from "../../store/useAppStore";
import { useSession } from "../../hooks/useSession";
import { PLATFORMS } from "../../types";
import type { Club, EaProfile } from "../../types";

export function SessionSidebarTab() {
  const { currentClub, activeSession, sessions, eaProfile, startSession, stopSession,
    setEaProfile, setViewingSession, setSidebarTab, setActiveTab, persistSettings, addLog } = useAppStore();
  const { countdown } = useSession();
  const [gamertag, setGamertag] = useState(eaProfile?.gamertag ?? "");
  const [platform, setPlatform] = useState(eaProfile?.platform ?? "common-gen5");
  const [linking, setLinking] = useState(false);

  const handleLink = async () => {
    if (!gamertag.trim()) return;
    setLinking(true);
    addLog(`Liaison profil: "${gamertag}"…`);
    try {
      const clubs = await searchClub(gamertag.trim(), platform);
      let found: Club | null = null;
      for (const club of clubs.slice(0, 5)) {
        const members = await getMembers(club.id, club.platform).catch(() => []);
        const match = members.find((m) => m.name.toLowerCase() === gamertag.toLowerCase());
        if (match) { found = club; break; }
      }
      if (found) {
        const profile: EaProfile = { gamertag: gamertag.trim(), platform, clubId: found.id, clubName: found.name };
        setEaProfile(profile);
        await persistSettings();
        addLog(`Profil lié: ${found.name}`);
      } else {
        addLog("Club introuvable pour ce gamertag");
      }
    } catch (e) { addLog(`Erreur: ${String(e)}`); }
    finally { setLinking(false); }
  };

  const handleStop = () => { stopSession(); persistSettings(); };

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* EA Profile */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
        <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <User size={10} /> PROFIL EA LIÉ
        </label>
        {eaProfile ? (
          <div style={{ background: "var(--card)", borderRadius: 6, padding: 8, border: "1px solid var(--accent)/30", marginBottom: 6 }}>
            <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: "bold" }}>{eaProfile.gamertag}</p>
            <p style={{ fontSize: 10, color: "var(--muted)" }}>{eaProfile.clubName} · {eaProfile.platform}</p>
            <button onClick={() => setEaProfile({ gamertag: "", platform: "common-gen5", clubId: "", clubName: "" })}
              style={{ fontSize: 9, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>Délier</button>
          </div>
        ) : (
          <>
            <input value={gamertag} onChange={(e) => setGamertag(e.target.value)}
              placeholder="Gamertag / PSN…"
              style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 8px", borderRadius: 4, fontSize: 12, outline: "none", marginBottom: 6 }} />
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}
              style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)", padding: "5px 6px", borderRadius: 4, fontSize: 11, outline: "none", marginBottom: 6 }}>
              {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={handleLink} disabled={linking}
              style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: linking ? 0.6 : 1 }}>
              <Link size={11} /> {linking ? "LIAISON…" : "LIER"}
            </button>
          </>
        )}
      </div>

      {/* Session control */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
        {currentClub && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
            Club: <span style={{ color: "var(--text)" }}>{currentClub.name}</span>
          </div>
        )}
        {activeSession ? (
          <>
            <div style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="pulse-dot" />
                <span style={{ fontSize: 11, color: "var(--accent)" }}>EN COURS</span>
              </div>
              <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                {activeSession.matches.length} match(s) · poll {countdown}s
              </p>
            </div>
            <button onClick={handleStop}
              style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid var(--red)", color: "var(--red)", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Square size={11} /> TERMINER
            </button>
          </>
        ) : (
          <button onClick={() => currentClub && startSession(currentClub)} disabled={!currentClub}
            style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: !currentClub ? 0.4 : 1 }}>
            <Play size={11} /> DÉMARRER
          </button>
        )}
      </div>

      {/* Saved sessions */}
      {sessions.length > 0 && (
        <div style={{ padding: "10px 12px" }}>
          <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
            SESSIONS SAUVEGARDÉES
          </label>
          {sessions.map((s) => {
            const wins = s.matches.filter((m) => {
              const c = m.clubs[s.clubId] as Record<string, unknown> | undefined;
              return c?.["matchResult"] === "win" || c?.["wins"] === "1";
            }).length;
            const goals = s.matches.reduce((acc, m) => {
              const c = m.clubs[s.clubId] as Record<string, unknown> | undefined;
              return acc + Number(c?.["goals"] ?? 0);
            }, 0);
            return (
              <div key={s.id} onClick={() => { setViewingSession(s); setActiveTab("session"); setSidebarTab("session"); }}
                style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                <p style={{ fontSize: 12, color: "var(--text)" }}>{s.clubName}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>
                  {new Date(s.date).toLocaleDateString()} · {s.matches.length}MJ · {wins}V · {goals}B
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
