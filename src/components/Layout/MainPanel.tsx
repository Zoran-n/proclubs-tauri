import { useState, useEffect } from "react";
import { BarChart2, Users, Swords, BarChart3, Timer, GitCompare, Search, ArrowLeft, Settings } from "lucide-react";
import { useAppStore, type ActiveTab } from "../../store/useAppStore";
import { PlayersTab } from "../tabs/PlayersTab";
import { MatchesTab } from "../tabs/MatchesTab";
import { ChartsTab } from "../tabs/ChartsTab";
import { SessionTab } from "../tabs/SessionTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { SearchTab } from "../Sidebar/SearchTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { Spinner } from "../ui/Spinner";
import { getLogo } from "../../api/tauri";

const NAV_ITEMS: { id: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { id: "players",  icon: <Users size={16} />,       label: "Joueurs" },
  { id: "matches",  icon: <Swords size={16} />,      label: "Matchs" },
  { id: "charts",   icon: <BarChart3 size={16} />,   label: "Graphiques" },
  { id: "session",  icon: <Timer size={16} />,       label: "Session" },
  { id: "compare",  icon: <GitCompare size={16} />,  label: "Comparer" },
];

export function MainPanel() {
  const { currentClub, activeTab, setActiveTab, isLoading, error, activeSession, sidebarTab, setSidebarTab } = useAppStore();
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

  // Settings page
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
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}>
            <ArrowLeft size={18} />
          </button>
          <Settings size={18} color="var(--muted)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Paramètres</span>
        </div>
        <div style={{ flex: 1, overflow: "auto", maxWidth: 600, margin: "0 auto", width: "100%" }}>
          <SettingsTab />
        </div>
      </main>
    );
  }

  // Search page (no club loaded)
  if (!currentClub && !isLoading) {
    return (
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--main-bg)" }}>
        {/* Header */}
        <div style={{
          height: 48, display: "flex", alignItems: "center", gap: 8,
          padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)",
          flexShrink: 0, background: "var(--main-bg)",
        }}>
          <Search size={18} color="var(--muted)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Recherche</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSidebarTab("settings")} style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
            display: "flex", alignItems: "center", padding: 4, borderRadius: 4,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}>
            <Settings size={18} />
          </button>
        </div>
        {/* Centered search panel */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: "40px 16px" }}>
          <div style={{ width: "100%", maxWidth: 400 }}>
            <SearchTab />
          </div>
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

  // Club loaded - full stats view
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--main-bg)" }}>

      {/* ── Header bar with tabs ──────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        padding: "0 12px", borderBottom: "1px solid rgba(0,0,0,0.24)",
        flexShrink: 0, background: "var(--main-bg)", height: 48,
      }}>
        {/* Back to search */}
        <button onClick={() => {
          useAppStore.setState({ currentClub: null, players: [], matches: [] });
        }} style={{
          background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
          display: "flex", alignItems: "center", padding: "4px 8px 4px 4px", borderRadius: 4, marginRight: 4,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}>
          <ArrowLeft size={18} />
        </button>

        {/* Club info */}
        {currentClub && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 16 }}>
            {logo && (
              <img src={logo} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: "contain" }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
              {currentClub.name}
            </span>
            {currentClub.skillRating && (
              <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>
                {currentClub.skillRating} SR
              </span>
            )}
          </div>
        )}

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: "var(--border)", marginRight: 8 }} />

        {/* Navigation tabs */}
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: activeTab === item.id ? "var(--hover)" : "transparent",
              border: "none",
              borderBottom: activeTab === item.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: activeTab === item.id ? "var(--text)" : "var(--muted)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 12px", height: 48,
              fontSize: 13, fontWeight: activeTab === item.id ? 600 : 400,
              transition: "color 0.15s, background 0.15s",
              position: "relative",
            }}
            onMouseEnter={(e) => { if (activeTab !== item.id) e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { if (activeTab !== item.id) e.currentTarget.style.color = "var(--muted)"; }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === "session" && activeSession && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--red)", flexShrink: 0,
              }} />
            )}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* LIVE badge */}
        {activeSession && (
          <span style={{
            fontSize: 10, color: "#fff",
            background: "var(--red)", padding: "2px 8px", borderRadius: 3, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4, marginRight: 8,
          }}>
            <span className="pulse-dot" style={{ width: 6, height: 6 }} />
            LIVE
          </span>
        )}

        {/* Settings */}
        <button onClick={() => setSidebarTab("settings")} style={{
          background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
          display: "flex", alignItems: "center", padding: 4, borderRadius: 4,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}>
          <Settings size={18} />
        </button>
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
