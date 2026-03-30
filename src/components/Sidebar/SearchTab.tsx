import { useState, useEffect, useRef } from "react";
import { RefreshCw, Search, Hash, User, Send } from "lucide-react";
import { searchClub, detectPlatform, getLogo } from "../../api/tauri";
import { sendDiscordWebhook } from "../../api/discord";
import { buildClubOverviewEmbed } from "../../utils/discordEmbeds";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import type { Club } from "../../types";

function ClubLogo({ club, size = 32 }: { club: Club; size?: number }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (club.crestAssetId) getLogo(club.crestAssetId).then(setLogo).catch(() => {});
  }, [club.crestAssetId]);
  return (
    <div style={{ width: size, height: size, borderRadius: 5, background: "var(--bg)",
      border: "1px solid var(--border)", flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {logo
        ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.38, color: "var(--accent)" }}>
            {(club.name || "?")[0].toUpperCase()}
          </span>
      }
    </div>
  );
}

export function SearchTab({ compact }: { compact?: boolean } = {}) {
  const { history, favs, toggleFav, showIdSearch, showLogs, logs, addLog, persistSettings,
    setSearchResults, eaProfile, discordWebhook, addToast, players, matches } = useAppStore();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [directId, setDirectId] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [sharing, setSharing] = useState(false);
  const { load } = useClub();
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { currentClub } = useAppStore();

  const shareOverview = async () => {
    if (!discordWebhook || !currentClub) return;
    setSharing(true);
    try {
      await sendDiscordWebhook(discordWebhook, [buildClubOverviewEmbed(currentClub, players, matches)]);
      addToast("Envoyé sur Discord !", "success");
    } catch (e) { addToast(`Discord: ${String(e)}`, "error"); }
    finally { setSharing(false); }
  };

  const doSearch = async (q = query) => {
    if (!q.trim()) return;
    setSearching(true);
    addLog(`Recherche: "${q}"…`);
    try {
      const clubs = await searchClub(q.trim());
      setSearchResults(clubs, true);
      addLog(`${clubs.length} résultat(s)`);
    } catch (e) {
      addLog(`Erreur recherche: ${String(e)}`);
    } finally { setSearching(false); }
  };

  const handleRefresh = async () => {
    if (currentClub) await load(currentClub.id, currentClub.platform);
    setCountdown(60);
  };

  useEffect(() => {
    if (autoRefresh) {
      setCountdown(60);
      autoRef.current = setInterval(() => { if (currentClub) load(currentClub.id, currentClub.platform); setCountdown(60); }, 60_000);
      countRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? 60 : c - 1)), 1_000);
    } else {
      if (autoRef.current) clearInterval(autoRef.current);
      if (countRef.current) clearInterval(countRef.current);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); if (countRef.current) clearInterval(countRef.current); };
  }, [autoRefresh, currentClub]);

  const handleLoadById = async () => {
    if (!directId.trim()) return;
    addLog(`Détection plateforme pour ID ${directId}…`);
    try {
      const p = await detectPlatform(directId.trim());
      await load(directId.trim(), p);
      setDirectId("");
    } catch (e) { addLog(`Erreur: ${String(e)}`); }
  };

  const isFav = (id: string) => favs.some((f) => f.id === id);
  const s = { section: { padding: compact ? "6px 8px" : "10px 12px", borderBottom: compact ? "none" : "1px solid var(--border)" } as React.CSSProperties };

  // Compact mode: just search input
  if (compact) {
    return (
      <div style={{ padding: "4px 8px" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Rechercher..."
            style={{
              width: "100%", background: "var(--bg)", border: "none", color: "var(--text)",
              padding: "6px 8px 6px 28px", borderRadius: 4, fontSize: 12, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

      {/* Mon club (gamertag lié) */}
      {eaProfile?.clubId && (
        <div style={s.section}>
          <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
            MON CLUB
          </label>
          <div style={{ background: "var(--card)", borderRadius: 5, padding: "7px 10px", border: "1px solid var(--border)", marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{eaProfile.gamertag}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{eaProfile.clubName}</div>
          </div>
          <button onClick={() => { load(eaProfile.clubId, eaProfile.platform); persistSettings(); }}
            style={{ width: "100%", padding: "7px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <User size={12} /> CHARGER MON CLUB
          </button>
        </div>
      )}

      {/* Search by name */}
      <div style={s.section}>
        <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
          RECHERCHE PAR NOM
        </label>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Nom du club..."
            style={{
              width: "100%", background: "var(--bg)", border: "none", color: "var(--text)",
              padding: "8px 10px 8px 32px", borderRadius: 4, fontSize: 13, marginBottom: 8,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <button onClick={() => doSearch()} disabled={searching}
          style={{ width: "100%", padding: "8px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.1em", cursor: "pointer", opacity: searching ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {searching ? <><Search size={14} className="spin" /> RECHERCHE…</> : <><Search size={14} /> RECHERCHER</>}
        </button>
      </div>

      {/* Direct ID */}
      {showIdSearch && (
        <div style={s.section}>
          <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
            OU ENTRER L'ID DIRECT
          </label>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={directId} onChange={(e) => setDirectId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadById()}
              placeholder="Ex: 3539213"
              style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 8px", borderRadius: 4, fontSize: 12, outline: "none" }}
            />
          </div>
          <button onClick={handleLoadById} style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Hash size={12} /> CHARGER PAR ID
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={s.section}>
          <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
            CLUBS RÉCENTS
          </label>
          {history.map((club) => (
            <div key={club.id} onClick={() => { load(club.id, club.platform); persistSettings(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", cursor: "pointer",
                background: "var(--card)", border: "1px solid var(--border)", borderRadius: 5, marginBottom: 5,
                transition: "border-color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}>
              <ClubLogo club={club} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2,
                  color: isFav(club.id) ? "var(--gold, #f59e0b)" : "var(--muted)", flexShrink: 0, fontSize: 13 }}>
                {isFav(club.id) ? "★" : "☆"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Refresh */}
      <div style={s.section}>
        <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
          RAFRAÎCHISSEMENT
        </label>
        <button onClick={handleRefresh} style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 6 }}>
          <RefreshCw size={12} /> RAFRAÎCHIR
        </button>
        <button
          onClick={() => {
            if (!discordWebhook) { addToast("Configure le webhook Discord dans Mon Profil", "error"); return; }
            if (!currentClub) { addToast("Charge un club d'abord", "error"); return; }
            shareOverview();
          }}
          disabled={sharing}
          style={{ width: "100%", padding: "7px", background: "rgba(88,101,242,0.1)", border: "1px solid rgba(88,101,242,0.25)", color: sharing ? "var(--muted)" : "#5865f2", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: sharing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 6, opacity: sharing ? 0.6 : 1, transition: "all 0.15s" }}>
          <Send size={12} /> {sharing ? "ENVOI…" : "STATS DISCORD"}
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto ({autoRefresh ? `${countdown}s` : "60s"})
        </label>
      </div>

      {/* Logs */}
      {showLogs && (
        <div style={{ ...s.section, flex: 1 }}>
          <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
            LOGS
          </label>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: 8, fontSize: 10, color: "var(--green)", fontFamily: "monospace", height: 100, overflowY: "auto", lineHeight: 1.6 }}>
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
