import { useState, useEffect } from "react";
import { Star, Search, Settings } from "lucide-react";
import { useAppStore, type SidebarTab } from "../../store/useAppStore";
import { SearchTab } from "../Sidebar/SearchTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { useClub } from "../../hooks/useClub";
import { getLogo } from "../../api/tauri";
import type { Club } from "../../types";
import type { ReactNode } from "react";

function ClubLogo({ club, size = 36 }: { club: Club; size?: number }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (club.crestAssetId) getLogo(club.crestAssetId).then(setLogo).catch(() => {});
  }, [club.crestAssetId]);
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: "var(--bg)",
      border: "1px solid var(--border)", flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {logo
        ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.4,
            color: "var(--accent)" }}>
            {(club.name || "?")[0].toUpperCase()}
          </span>
      }
    </div>
  );
}

const TABS: { id: SidebarTab; icon: ReactNode; title: string }[] = [
  { id: "search",   icon: <Search size={16} />,   title: "Recherche" },
  { id: "favs",     icon: <Star size={16} />,     title: "Favoris" },
  { id: "settings", icon: <Settings size={16} />, title: "Paramètres" },
];

export function Sidebar() {
  const { sidebarTab, setSidebarTab } = useAppStore();

  return (
    <aside style={{
      width: 255, display: "flex", flexDirection: "column",
      flexShrink: 0, height: "100%",
      borderRight: "1px solid var(--border)",
      background: "var(--surface)",
    }}>
      {/* Tab bar — icons only */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {TABS.map((tab) => {
          const active = sidebarTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setSidebarTab(tab.id)} title={tab.title} style={{
              flex: 1, padding: "12px 4px",
              color: active ? "var(--accent)" : "var(--muted)",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "color 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {tab.icon}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div key={sidebarTab} className="sidebar-tab" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {sidebarTab === "search"   && <SearchTab />}
        {sidebarTab === "favs"     && <FavsTab />}
        {sidebarTab === "settings" && <SettingsTab />}
      </div>
    </aside>
  );
}

function FavsTab() {
  const { favs, toggleFav, persistSettings } = useAppStore();
  const { load } = useClub();

  if (favs.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--muted)" }}>
        <Star size={28} />
        <p style={{ fontSize: 11, textAlign: "center", padding: "0 20px" }}>
          Aucun favori. Clique sur ★ dans les résultats pour en ajouter.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 4 }}>
        CLUBS FAVORIS ({favs.length})
      </label>
      {favs.map((club) => (
        <div key={club.id}
          onClick={() => load(club.id, club.platform)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", cursor: "pointer",
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, transition: "border-color 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}>
          <ClubLogo club={club} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {club.name || `Club #${club.id}`}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--gold, #f59e0b)", flexShrink: 0 }}>
            <Star size={13} fill="currentColor" />
          </button>
        </div>
      ))}
    </div>
  );
}
