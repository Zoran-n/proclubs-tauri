import { useState, useEffect } from "react";
import { BarChart2, Hash, Search, Settings, ChevronDown, Users, Swords, BarChart3, Timer, GitCompare, Star, RefreshCw } from "lucide-react";
import { useAppStore, type ActiveTab } from "../../store/useAppStore";
import { PlayersTab } from "../tabs/PlayersTab";
import { MatchesTab } from "../tabs/MatchesTab";
import { ChartsTab } from "../tabs/ChartsTab";
import { SessionTab } from "../tabs/SessionTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { Spinner } from "../ui/Spinner";
import { getLogo, searchClub } from "../../api/tauri";
import { useClub } from "../../hooks/useClub";
import type { Club } from "../../types";

const TAB_LABELS: Record<string, string> = {
  players: "Joueurs",
  matches: "Matchs",
  charts: "Graphiques",
  session: "Session",
  compare: "Comparer",
};

export function MainPanel() {
  const { currentClub, activeTab, isLoading, error, activeSession, sidebarTab, setSidebarTab } = useAppStore();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    setLogo(null);
    if (currentClub?.crestAssetId) {
      getLogo(currentClub.crestAssetId).then(setLogo).catch(() => {});
    }
  }, [currentClub?.id]);

  const total  = (currentClub?.wins ?? 0) + (currentClub?.losses ?? 0) + (currentClub?.ties ?? 0);
  const winPct = total > 0 ? Math.round(((currentClub?.wins ?? 0) / total) * 100) : 0;

  const KPIS = currentClub ? [
    { label: "MATCHS",      value: total,                     color: "var(--accent)" },
    { label: "VICTOIRES",   value: currentClub.wins,          color: "var(--green)" },
    { label: "NULS",        value: currentClub.ties,          color: "var(--gold)" },
    { label: "DEFAITES",    value: currentClub.losses,        color: "var(--red)" },
    { label: "% VICTOIRES", value: `${winPct}%`,              color: "var(--accent)" },
    { label: "BUTS",        value: currentClub.goals,         color: "var(--gold)" },
  ] : [];

  // ── No club loaded: centered sidebar-style panel ──────────────────
  if (!currentClub && !isLoading) {
    // Settings page (accessible from search view)
    if (sidebarTab === "settings") {
      return (
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--main-bg)" }}>
          <div style={{
            height: 48, display: "flex", alignItems: "center", gap: 8,
            padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)",
            flexShrink: 0, background: "var(--main-bg)",
          }}>
            <button onClick={() => setSidebarTab("search")} style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
              display: "flex", alignItems: "center", padding: 4, borderRadius: 4,
              transition: "color 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}>
              <Settings size={18} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Paramètres</span>
          </div>
          <div style={{ flex: 1, overflow: "auto", maxWidth: 600, margin: "0 auto", width: "100%" }}>
            <SettingsTab />
          </div>
        </main>
      );
    }

    // Centered sidebar-style search panel
    return (
      <main style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--main-bg)", justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: "32px 16px" }}>
          <LaunchPanel />
        </div>
        {error && (
          <div style={{
            position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
            zIndex: 10, background: "rgba(218,55,60,0.9)", color: "#fff",
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          }}>
            {error}
          </div>
        )}
      </main>
    );
  }

  // ── Club loaded: Discord-style main panel ─────────────────────────
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--main-bg)" }}>

      {/* ── Discord-style header bar ──────────────────────────────────── */}
      <div style={{
        height: 48, display: "flex", alignItems: "center", gap: 8,
        padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)",
        flexShrink: 0, background: "var(--main-bg)",
      }}>
        <Hash size={20} color="var(--muted)" />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
          {TAB_LABELS[activeTab] || "Joueurs"}
        </span>
        {currentClub && (
          <>
            <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 8px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {logo && (
                <img src={logo} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: "contain" }} />
              )}
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {currentClub.name}
              </span>
              {currentClub.skillRating && (
                <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>
                  {currentClub.skillRating} SR
                </span>
              )}
            </div>
            {activeSession && (
              <span style={{
                marginLeft: "auto", fontSize: 10, color: "#fff",
                background: "var(--red)", padding: "2px 8px", borderRadius: 3, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                LIVE
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Club banner ─────────────────────────────────────────── */}
      {currentClub && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
          background: "var(--hover)", flexShrink: 0,
        }}>
          {/* Left accent bar */}
          <div style={{ width: 4, alignSelf: "stretch", background: "var(--accent)", borderRadius: 2, flexShrink: 0 }} />
          {/* Logo */}
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, overflow: "hidden",
          }}>
            {logo
              ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--accent)" }}>
                  {(currentClub.name || "?")[0].toUpperCase()}
                </span>
            }
          </div>
          {/* Name + meta */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "var(--text)",
              letterSpacing: "0.04em", lineHeight: 1,
            }}>
              {currentClub.name || `Club #${currentClub.id}`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                {currentClub.platform.toUpperCase()}
              </span>
              {currentClub.skillRating && (
                <>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>
                    ★ {currentClub.skillRating} SR
                  </span>
                </>
              )}
            </div>
          </div>
          {/* LIVE badge */}
          {activeSession && (
            <span style={{
              fontSize: 11, color: "#fff", background: "var(--red)",
              padding: "4px 10px", borderRadius: 4, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span className="pulse-dot" style={{ width: 7, height: 7 }} />
              LIVE
            </span>
          )}
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      {currentClub && (
        <div style={{
          display: "flex", gap: 8, padding: "12px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.12)", flexShrink: 0,
        }}>
          {KPIS.map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: "var(--hover)", borderRadius: 8,
              padding: "10px 12px", textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
                color, lineHeight: 1,
              }}>{value}</div>
              <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", marginTop: 4, fontWeight: 600 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {isLoading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          }}>
            <Spinner size={40} />
          </div>
        )}
        {error && (
          <div style={{
            position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
            zIndex: 10, background: "rgba(218,55,60,0.9)", color: "#fff",
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {!currentClub && !isLoading ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", color: "var(--muted)", gap: 16,
          }}>
            <BarChart2 size={56} style={{ opacity: 0.3 }} />
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.1em", opacity: 0.5 }}>
              RECHERCHE UN CLUB POUR COMMENCER
            </p>
          </div>
        ) : (
          <div key={activeTab} className="tab-content" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {activeTab === "players"  && <PlayersTab />}
            {activeTab === "matches"  && <MatchesTab />}
            {activeTab === "charts"   && <ChartsTab />}
            {activeTab === "session"  && <SessionTab />}
            {activeTab === "compare"  && <CompareTab />}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Sidebar-style launch panel (centered, no club loaded) ────────── */

const LAUNCH_NAV: { id: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { id: "players",  icon: <Users size={18} />,       label: "Joueurs" },
  { id: "matches",  icon: <Swords size={18} />,      label: "Matchs" },
  { id: "charts",   icon: <BarChart3 size={18} />,   label: "Graphiques" },
  { id: "session",  icon: <Timer size={18} />,       label: "Session" },
  { id: "compare",  icon: <GitCompare size={18} />,  label: "Comparer" },
];

function LaunchClubLogo({ club, size = 32 }: { club: Club; size?: number }) {
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

function LaunchPanel() {
  const { history, favs, toggleFav, persistSettings, setActiveTab, activeTab, addLog, setSearchResults } = useAppStore();
  const { load } = useClub();
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

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
    <div style={{
      width: 260, background: "var(--surface)", borderRadius: 8,
      display: "flex", flexDirection: "column", overflow: "hidden",
      border: "1px solid var(--border)",
    }}>
      {/* ── Header (club name or app name) ── */}
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

      {/* ── Scrollable content ── */}
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
        {LAUNCH_NAV.map((item) => (
          <div
            key={item.id}
            className={`channel-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => { setActiveTab(item.id); if (lastClub) load(lastClub.id, lastClub.platform); }}
          >
            <Hash size={18} style={{ color: activeTab === item.id ? "var(--text)" : "var(--muted)", flexShrink: 0 }} />
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
                <LaunchClubLogo club={club} size={20} />
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
          <div style={{ padding: "0 8px" }}>
            <div className="category-header">
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              Clubs Récents
            </div>
            {history.map((club) => (
              <div key={club.id} onClick={() => { load(club.id, club.platform); persistSettings(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", cursor: "pointer",
                  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 5, marginBottom: 5,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}>
                <LaunchClubLogo club={club} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {club.name || `Club #${club.id}`}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2,
                    color: isFav(club.id) ? "var(--gold)" : "var(--muted)", flexShrink: 0, fontSize: 13 }}>
                  {isFav(club.id) ? "★" : "☆"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* RAFRAÎCHISSEMENT */}
        <div style={{ padding: "0 8px", marginTop: 4 }}>
          <div className="category-header">
            <ChevronDown size={10} style={{ marginRight: 2 }} />
            Rafraîchissement
          </div>
          <button onClick={() => { if (lastClub) load(lastClub.id, lastClub.platform); }}
            style={{
              width: "100%", padding: "7px", background: "transparent",
              border: "1px solid var(--border)", color: "var(--text)", borderRadius: 4,
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 6,
            }}>
            <RefreshCw size={12} /> RAFRAÎCHIR
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto (60s)
          </label>
        </div>
      </div>
    </div>
  );
}
