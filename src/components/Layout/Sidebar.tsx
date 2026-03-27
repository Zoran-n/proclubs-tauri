import { useState, useEffect, useRef } from "react";
import { Users, Swords, BarChart3, Timer, GitCompare, Star, ChevronDown, Search, RefreshCw } from "lucide-react";
import { useAppStore, type ActiveTab } from "../../store/useAppStore";
import { SearchTab } from "../Sidebar/SearchTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { useClub } from "../../hooks/useClub";
import { getLogo, searchClub } from "../../api/tauri";
import type { Club } from "../../types";
import type { ReactNode } from "react";

function ClubLogo({ club, size = 32 }: { club: Club; size?: number }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (club.crestAssetId) getLogo(club.crestAssetId).then(setLogo).catch(() => {});
  }, [club.crestAssetId]);
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: "var(--bg)",
      flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {logo
        ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.45, color: "var(--accent)" }}>
            {(club.name || "?")[0].toUpperCase()}
          </span>
      }
    </div>
  );
}

const NAV_ITEMS: { id: ActiveTab; icon: ReactNode; label: string }[] = [
  { id: "players",  icon: <Users size={18} />,       label: "Joueurs" },
  { id: "matches",  icon: <Swords size={18} />,      label: "Matchs" },
  { id: "charts",   icon: <BarChart3 size={18} />,   label: "Graphiques" },
  { id: "session",  icon: <Timer size={18} />,       label: "Session" },
  { id: "compare",  icon: <GitCompare size={18} />,  label: "Comparer" },
];

export function Sidebar() {
  const { sidebarTab, currentClub, activeTab, setActiveTab, favs, activeSession, history, toggleFav, persistSettings } = useAppStore();
  const { load } = useClub();

  // Settings view
  if (sidebarTab === "settings") {
    return (
      <aside style={{
        width: 240, flexShrink: 0, height: "100%",
        background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          height: 48, display: "flex", alignItems: "center", padding: "0 16px",
          borderBottom: "1px solid rgba(0,0,0,0.24)", flexShrink: 0,
          fontWeight: 600, fontSize: 15, color: "var(--text)",
        }}>
          Paramètres
        </div>
        <div key="settings" className="sidebar-tab" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <SettingsTab />
        </div>
      </aside>
    );
  }

  // No club loaded: launch panel with search + nav + history
  if (!currentClub) {
    return (
      <aside style={{
        width: 240, flexShrink: 0, height: "100%",
        background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
      }}>
        <LaunchSidebar />
      </aside>
    );
  }

  // Main club navigation sidebar (Discord channel style)
  return (
    <aside style={{
      width: 240, flexShrink: 0, height: "100%",
      background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
    }}>
      {/* Server/Club header (like Discord server name) */}
      <div style={{
        height: 48, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)", flexShrink: 0,
        cursor: "pointer",
      }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentClub?.name || "ProClubs Stats"}
        </span>
        <ChevronDown size={16} color="var(--text)" />
      </div>

      {/* Channel navigation */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>

        {/* Search section - always available */}
        <div className="category-header">
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          Recherche
        </div>
        <div key="search-inline" className="sidebar-tab" style={{ maxHeight: 300, overflow: "hidden" }}>
          <SearchTab compact />
        </div>

        {/* Navigation channels */}
        {currentClub && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              Statistiques
            </div>
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`channel-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span style={{ color: activeTab === item.id ? "var(--text)" : "var(--muted)", flexShrink: 0, display: "flex" }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === "session" && activeSession && (
                  <span style={{
                    marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
                    background: "var(--red)", flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </>
        )}

        {/* Favorites section */}
        {favs.length > 0 && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              Favoris
            </div>
            <FavsList />
          </>
        )}

        {/* Clubs Récents */}
        {history.length > 0 && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              Clubs Récents
            </div>
            {history.map((club) => (
              <div key={club.id}
                className={`channel-item ${currentClub?.id === club.id ? "active" : ""}`}
                onClick={() => { load(club.id, club.platform); persistSettings(); }}>
                <ClubLogo club={club} size={20} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </span>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                  style={{
                    marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                    padding: 2, color: favs.some((f) => f.id === club.id) ? "var(--gold)" : "var(--muted)",
                    flexShrink: 0, opacity: 0.6, transition: "opacity 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}>
                  <Star size={12} fill={favs.some((f) => f.id === club.id) ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </>
        )}

        {/* Rafraîchissement */}
        <div className="category-header" style={{ marginTop: 8 }}>
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          Rafraîchissement
        </div>
        <div
          className="channel-item"
          onClick={() => { if (currentClub) load(currentClub.id, currentClub.platform); }}
          style={{ cursor: "pointer" }}>
          <RefreshCw size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <span>Rafraîchir</span>
        </div>
        <AutoRefreshItem clubId={currentClub?.id} platform={currentClub?.platform} load={load} />
      </div>

      {/* Bottom user panel (like Discord user area) */}
      <UserPanel />
    </aside>
  );
}

/* ── Launch sidebar (no club loaded) ─────────────────────────────── */

function LaunchSidebar() {
  const { history, favs, toggleFav, persistSettings, setActiveTab, activeTab, addLog, setSearchResults } = useAppStore();
  const { load } = useClub();
  const [query, setQuery] = useState("");

  const lastClub = history[0] || favs[0];

  const doSearch = async () => {
    if (!query.trim()) return;
    addLog(`Recherche: "${query}"…`);
    try {
      const clubs = await searchClub(query.trim());
      setSearchResults(clubs, true);
      addLog(`${clubs.length} résultat(s)`);
    } catch (e) {
      addLog(`Erreur recherche: ${String(e)}`);
    }
  };

  const isFav = (id: string) => favs.some((f) => f.id === id);

  return (
    <>
      {/* Header */}
      <div style={{
        height: 48, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)", flexShrink: 0,
        cursor: "pointer",
      }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lastClub?.name || "ProClubs Stats"}
        </span>
        <ChevronDown size={16} color="var(--text)" />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>

        {/* RECHERCHE */}
        <div className="category-header">
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          Recherche
        </div>
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

        {/* STATISTIQUES */}
        <div className="category-header" style={{ marginTop: 8 }}>
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          Statistiques
        </div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`channel-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => { setActiveTab(item.id); if (lastClub) load(lastClub.id, lastClub.platform); }}
          >
            <span style={{ color: activeTab === item.id ? "var(--text)" : "var(--muted)", flexShrink: 0, display: "flex" }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        {/* FAVORIS */}
        {favs.length > 0 && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              Favoris
            </div>
            {favs.map((club) => (
              <div key={club.id}
                className="channel-item"
                onClick={() => load(club.id, club.platform)}>
                <ClubLogo club={club} size={20} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </span>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                  style={{
                    marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                    padding: 2, color: "var(--gold)", flexShrink: 0, opacity: 0.6,
                    transition: "opacity 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}>
                  <Star size={12} fill="currentColor" />
                </button>
              </div>
            ))}
          </>
        )}

        {/* CLUBS RÉCENTS */}
        {history.length > 0 && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              Clubs Récents
            </div>
            {history.map((club) => (
              <div key={club.id}
                className="channel-item"
                onClick={() => { load(club.id, club.platform); persistSettings(); }}>
                <ClubLogo club={club} size={20} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </span>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                  style={{
                    marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                    padding: 2, color: isFav(club.id) ? "var(--gold)" : "var(--muted)", flexShrink: 0, opacity: 0.6,
                    transition: "opacity 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}>
                  <Star size={12} fill={isFav(club.id) ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </>
        )}

        {/* RAFRAÎCHISSEMENT */}
        <div className="category-header" style={{ marginTop: 8 }}>
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          Rafraîchissement
        </div>
        <div
          className="channel-item"
          onClick={() => { if (lastClub) load(lastClub.id, lastClub.platform); }}
          style={{ cursor: "pointer" }}>
          <RefreshCw size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <span>Rafraîchir</span>
        </div>
        <AutoRefreshItem clubId={lastClub?.id} platform={lastClub?.platform} load={load} />
      </div>
    </>
  );
}

/* ── Shared sub-components ───────────────────────────────────────── */

function FavsList() {
  const { favs, toggleFav, persistSettings, currentClub } = useAppStore();
  const { load } = useClub();

  return (
    <>
      {favs.map((club) => (
        <div key={club.id}
          className={`channel-item ${currentClub?.id === club.id ? "active" : ""}`}
          onClick={() => load(club.id, club.platform)}>
          <ClubLogo club={club} size={20} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {club.name || `Club #${club.id}`}
          </span>
          <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
            style={{
              marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
              padding: 2, color: "var(--gold)", flexShrink: 0, opacity: 0.6,
              transition: "opacity 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}>
            <Star size={12} fill="currentColor" />
          </button>
        </div>
      ))}
    </>
  );
}

function AutoRefreshItem({ clubId, platform, load }: { clubId?: string; platform?: string; load: (id: string, p: string) => void }) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoRefresh && clubId && platform) {
      setCountdown(60);
      autoRef.current = setInterval(() => { load(clubId, platform); setCountdown(60); }, 60_000);
      countRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? 60 : c - 1)), 1_000);
    } else {
      if (autoRef.current) clearInterval(autoRef.current);
      if (countRef.current) clearInterval(countRef.current);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); if (countRef.current) clearInterval(countRef.current); };
  }, [autoRefresh, clubId, platform]);

  return (
    <div className="channel-item" style={{ cursor: "pointer" }} onClick={() => setAutoRefresh(!autoRefresh)}>
      <Timer size={18} style={{ color: autoRefresh ? "var(--green)" : "var(--muted)", flexShrink: 0 }} />
      <span>Auto-refresh</span>
      {autoRefresh && (
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)" }}>
          {countdown}s
        </span>
      )}
    </div>
  );
}

function UserPanel() {
  const { currentClub } = useAppStore();

  return (
    <div style={{
      padding: "8px", background: "rgba(0,0,0,0.16)", flexShrink: 0,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {currentClub ? (
        <>
          <ClubLogo club={currentClub} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentClub.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {currentClub.platform.toUpperCase()}
              {currentClub.skillRating && ` · ${currentClub.skillRating} SR`}
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, fontSize: 12, color: "var(--muted)" }}>
          Aucun club chargé
        </div>
      )}
    </div>
  );
}
