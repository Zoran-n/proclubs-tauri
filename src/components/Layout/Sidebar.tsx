import { Star } from "lucide-react";
import { useAppStore, type SidebarTab } from "../../store/useAppStore";
import { SearchTab } from "../Sidebar/SearchTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { useClub } from "../../hooks/useClub";

const TABS: { id: SidebarTab; label: string }[] = [
  { id: "search",   label: "RECHERCHE" },
  { id: "favs",     label: "FAVORIS" },
  { id: "compare",  label: "COMPARER" },
  { id: "settings", label: "PARAMS" },
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
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setSidebarTab(tab.id)} style={{
            flex: 1, padding: "10px 4px", fontSize: 9, letterSpacing: "0.08em",
            fontFamily: "'Bebas Neue', sans-serif",
            color: sidebarTab === tab.id ? "var(--accent)" : "var(--muted)",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: sidebarTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "color 0.15s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {sidebarTab === "search"   && <SearchTab />}
        {sidebarTab === "favs"     && <FavsTab />}
        {sidebarTab === "compare"  && <CompareTab />}
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
      {favs.map((club) => {
        const pLabel: Record<string, string> = { "common-gen5": "PS5", "common-gen4": "PS4", "pc": "PC" };
        const pColor: Record<string, string> = { "common-gen5": "#3b82f6", "common-gen4": "#8b5cf6", "pc": "#22c55e" };
        return (
          <div key={`${club.id}_${club.platform}`}
            onClick={() => load(club.id, club.platform)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, transition: "border-color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.name || `Club #${club.id}`}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>ID {club.id}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#000", background: pColor[club.platform] ?? "var(--muted)", padding: "2px 6px", borderRadius: 3, flexShrink: 0 }}>
              {pLabel[club.platform] ?? club.platform}
            </span>
            <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--gold, #f59e0b)", flexShrink: 0 }}>
              <Star size={13} fill="currentColor" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
