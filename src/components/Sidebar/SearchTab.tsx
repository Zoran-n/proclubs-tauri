import { useState, useEffect, useRef } from "react";
import { Star, RefreshCw, Search, Hash } from "lucide-react";
import { searchClub, detectPlatform } from "../../api/tauri";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import { PLATFORMS, type Club } from "../../types";

export function SearchTab() {
  const { history, favs, toggleFav, showIdSearch, showLogs, logs, addLog, persistSettings } = useAppStore();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("common-gen5");
  const [results, setResults] = useState<Club[]>([]);
  const [searching, setSearching] = useState(false);
  const [directId, setDirectId] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { load } = useClub();
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { currentClub } = useAppStore();

  const doSearch = async (q = query) => {
    if (!q.trim()) return;
    setSearching(true);
    addLog(`Recherche: "${q}"…`);
    try {
      const clubs = await searchClub(q.trim(), platform === "all" ? undefined : platform);
      setResults(clubs);
      addLog(`${clubs.length} résultat(s)`);
    } catch (e) {
      addLog(`Erreur recherche: ${String(e)}`);
      setResults([]);
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

  const isFav = (c: Club) => favs.some((f) => f.id === c.id);

  const s = { section: { padding: "10px 12px", borderBottom: "1px solid var(--border)" } as React.CSSProperties };

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Search by name */}
      <div style={s.section}>
        <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
          RECHERCHE PAR NOM
        </label>
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Nom du club..."
          style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", padding: "7px 10px", borderRadius: 4, fontSize: 13, marginBottom: 8, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}
            style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)", padding: "4px 6px", borderRadius: 4, fontSize: 11, outline: "none" }}>
            <option value="all">Toutes plateformes</option>
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <button onClick={() => doSearch()} disabled={searching}
          style={{ width: "100%", padding: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.1em", cursor: "pointer", opacity: searching ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {searching ? <><Search size={14} className="spin" /> RECHERCHE…</> : <><Search size={14} /> RECHERCHER</>}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={s.section}>
          <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 6 }}>
            RÉSULTATS ({results.length})
          </label>
          {results.map((club) => (
            <ClubRow key={`${club.id}_${club.platform}`} club={club} isFav={isFav(club)}
              onLoad={() => { load(club.id, club.platform); persistSettings(); }}
              onToggleFav={() => { toggleFav(club); persistSettings(); }} />
          ))}
        </div>
      )}

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
            <ClubRow key={`${club.id}_${club.platform}`} club={club} isFav={isFav(club)}
              onLoad={() => { load(club.id, club.platform); persistSettings(); }}
              onToggleFav={() => { toggleFav(club); persistSettings(); }} />
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

function ClubRow({ club, isFav, onLoad, onToggleFav }: { club: Club; isFav: boolean; onLoad: () => void; onToggleFav: () => void; }) {
  const pLabel: Record<string, string> = { "common-gen5": "gen5", "common-gen4": "gen4", "pc": "pc" };
  return (
    <div onClick={onLoad} style={{ display: "flex", alignItems: "center", padding: "5px 0", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <span style={{ flex: 1, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.name}</span>
      <span style={{ fontSize: 9, color: "var(--muted)", marginRight: 6 }}>{pLabel[club.platform] ?? club.platform}</span>
      <button onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isFav ? "var(--gold)" : "var(--muted)" }}>
        <Star size={12} fill={isFav ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
