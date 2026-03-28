import { useState, useEffect } from "react";
import { Search, Plus, Settings, User } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import { getLogo } from "../../api/tauri";
import type { Club } from "../../types";

function GuildIcon({ club, active, onClick }: { club: Club; active: boolean; onClick: () => void }) {
  const [logo, setLogo] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (club.crestAssetId) getLogo(club.crestAssetId).then(setLogo).catch(() => {});
  }, [club.crestAssetId]);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Left pill indicator */}
      <div style={{
        position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
        width: 4, borderRadius: "0 4px 4px 0", background: "var(--text)",
        height: active ? 40 : hovered ? 20 : 0,
        transition: "height 0.15s",
      }} />
      <div onClick={onClick} style={{
        width: 48, height: 48, borderRadius: active ? 16 : 24,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "border-radius 0.15s, background-color 0.15s",
        background: active ? "var(--accent)" : "var(--surface)",
        overflow: "hidden", flexShrink: 0,
      }}>
        {logo ? (
          <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
            color: active ? "#fff" : "var(--accent)",
          }}>
            {(club.name || "?")[0].toUpperCase()}
          </span>
        )}
      </div>
      {/* Tooltip */}
      {hovered && (
        <div className="discord-tooltip">
          {club.name || `Club #${club.id}`}
        </div>
      )}
    </div>
  );
}

export function GuildBar() {
  const { favs, history, currentClub, setSidebarTab, sidebarTab, eaProfile } = useAppStore();
  const { load } = useClub();
  const [searchHover, setSearchHover] = useState(false);
  const [profileHover, setProfileHover] = useState(false);
  const [settingsHover, setSettingsHover] = useState(false);

  // Combine favs + recent history (deduplicated)
  const clubs = [...favs];
  for (const c of history) {
    if (!clubs.some((f) => f.id === c.id)) clubs.push(c);
  }

  return (
    <div style={{
      width: 72, flexShrink: 0, height: "100%",
      background: "var(--guild-bar)",
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: 8, gap: 4, overflowY: "auto", overflowX: "hidden",
    }}>
      {/* Home / Search button */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseEnter={() => setSearchHover(true)} onMouseLeave={() => setSearchHover(false)}>
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 4, borderRadius: "0 4px 4px 0", background: "var(--text)",
          height: sidebarTab === "search" ? 40 : searchHover ? 20 : 0,
          transition: "height 0.15s",
        }} />
        <div onClick={() => setSidebarTab("search")} style={{
          width: 48, height: 48, borderRadius: sidebarTab === "search" ? 16 : 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "border-radius 0.15s, background-color 0.15s",
          background: sidebarTab === "search" ? "var(--accent)" : "var(--surface)",
        }}>
          <Search size={22} color={sidebarTab === "search" ? "#fff" : "var(--accent)"} />
        </div>
        {searchHover && <div className="discord-tooltip">Recherche</div>}
      </div>

      {/* Separator line */}
      <div style={{ width: 32, height: 2, borderRadius: 1, background: "var(--border)", margin: "4px 0" }} />

      {/* Club icons */}
      {clubs.map((club) => (
        <GuildIcon
          key={club.id}
          club={club}
          active={currentClub?.id === club.id}
          onClick={() => load(club.id, club.platform)}
        />
      ))}

      {/* Add club placeholder */}
      {clubs.length === 0 && (
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "border-radius 0.15s, background-color 0.15s",
            background: "var(--surface)", color: "var(--green)",
          }}
          onClick={() => setSidebarTab("search")}>
            <Plus size={22} />
          </div>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Profile icon */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}
        onMouseEnter={() => setProfileHover(true)} onMouseLeave={() => setProfileHover(false)}>
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 4, borderRadius: "0 4px 4px 0", background: "var(--text)",
          height: sidebarTab === "profile" ? 40 : profileHover ? 20 : 0,
          transition: "height 0.15s",
        }} />
        <div onClick={() => setSidebarTab("profile")} style={{
          width: 48, height: 48, borderRadius: sidebarTab === "profile" ? 16 : 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "border-radius 0.15s, background-color 0.15s",
          background: sidebarTab === "profile" ? "var(--accent)" : "var(--surface)",
          overflow: "hidden",
        }}>
          {eaProfile?.gamertag
            ? <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: sidebarTab === "profile" ? "#fff" : "var(--accent)" }}>
                {eaProfile.gamertag[0].toUpperCase()}
              </span>
            : <User size={22} color={sidebarTab === "profile" ? "#fff" : "var(--muted)"} />
          }
        </div>
        {profileHover && <div className="discord-tooltip">Mon profil</div>}
      </div>

      {/* Settings icon at bottom */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}
        onMouseEnter={() => setSettingsHover(true)} onMouseLeave={() => setSettingsHover(false)}>
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 4, borderRadius: "0 4px 4px 0", background: "var(--text)",
          height: sidebarTab === "settings" ? 40 : settingsHover ? 20 : 0,
          transition: "height 0.15s",
        }} />
        <div onClick={() => setSidebarTab("settings")} style={{
          width: 48, height: 48, borderRadius: sidebarTab === "settings" ? 16 : 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "border-radius 0.15s, background-color 0.15s",
          background: sidebarTab === "settings" ? "var(--accent)" : "var(--surface)",
        }}>
          <Settings size={22} color={sidebarTab === "settings" ? "#fff" : "var(--muted)"} />
        </div>
        {settingsHover && <div className="discord-tooltip">Paramètres</div>}
      </div>
    </div>
  );
}
