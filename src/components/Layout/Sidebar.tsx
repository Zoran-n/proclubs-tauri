import { useState, useEffect } from "react";
import { Users, Swords, BarChart3, Timer, GitCompare, Hash, Star, ChevronDown } from "lucide-react";
import { useAppStore, type ActiveTab } from "../../store/useAppStore";
import { SearchTab } from "../Sidebar/SearchTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { useClub } from "../../hooks/useClub";
import { getLogo } from "../../api/tauri";
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
  const { sidebarTab, currentClub, activeTab, setActiveTab, favs, activeSession } = useAppStore();

  // Settings or Search view
  if (sidebarTab === "settings") {
    return (
      <aside style={{
        width: 240, flexShrink: 0, height: "100%",
        background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
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

  if (sidebarTab === "search" && !currentClub) {
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
          Recherche
        </div>
        <div key="search" className="sidebar-tab" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <SearchTab />
        </div>
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
                <Hash size={18} style={{ color: activeTab === item.id ? "var(--text)" : "var(--muted)", flexShrink: 0 }} />
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
      </div>

      {/* Bottom user panel (like Discord user area) */}
      <UserPanel />
    </aside>
  );
}

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
