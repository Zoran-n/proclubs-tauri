import { useState, useEffect } from "react";
import { BarChart2 } from "lucide-react";
import { useAppStore, type ActiveTab } from "../../store/useAppStore";
import { PlayersTab } from "../tabs/PlayersTab";
import { MatchesTab } from "../tabs/MatchesTab";
import { ChartsTab } from "../tabs/ChartsTab";
import { SessionTab } from "../tabs/SessionTab";
import { TacticsTab } from "../tabs/TacticsTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { Spinner } from "../ui/Spinner";
import { getLogo } from "../../api/tauri";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "players",  label: "JOUEURS" },
  { id: "matches",  label: "MATCHS" },
  { id: "charts",   label: "GRAPHIQUES" },
  { id: "session",  label: "SESSION" },
  { id: "tactics",  label: "TACTIQUES" },
  { id: "compare",  label: "COMPARER" },
];

export function MainPanel() {
  const { currentClub, activeTab, setActiveTab, isLoading, error, activeSession } = useAppStore();
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
    { label: "% VICTOIRES", value: `${winPct}%`,              color: "var(--orange)" },
    { label: "BUTS",        value: currentClub.goals,         color: "var(--gold)" },
  ] : [];

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Club banner ─────────────────────────────────────────────── */}
      {currentClub && (
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {/* Banner card with left accent bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "12px 20px 10px",
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
            overflow: "hidden" }}>
            {/* Left accent bar */}
            <div style={{ width: 4, alignSelf: "stretch", background: "var(--accent)", flexShrink: 0 }} />

            {/* Logo */}
            <div style={{ width: 52, height: 52, margin: "10px 14px", borderRadius: 8,
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden" }}>
              {logo
                ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--accent)" }}>
                    {(currentClub.name || "?")[0].toUpperCase()}
                  </span>
              }
            </div>

            {/* Name + platform */}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "var(--text)",
                letterSpacing: "0.06em", lineHeight: 1 }}>
                {currentClub.name || `Club #${currentClub.id}`}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.08em" }}>
                  {currentClub.platform.toUpperCase()}
                </span>
                {currentClub.skillRating && (
                  <>
                    <span style={{ color: "var(--border)" }}>·</span>
                    <span style={{ fontSize: 11, color: "var(--gold)" }}>★ {currentClub.skillRating} SR</span>
                  </>
                )}
              </div>
            </div>

            {/* LIVE badge */}
            {activeSession && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--green)",
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                padding: "4px 10px", borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.1em", marginRight: 14 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                LIVE
              </div>
            )}
          </div>

          {/* KPI cards row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, padding: "0 20px 14px" }}>
            {KPIS.map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 8px", textAlign: "center", borderBottom: `2px solid ${color}` }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0, padding: "0 16px" }}>
        <div style={{ display: "flex", flex: 1, gap: 0 }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "10px 14px", fontSize: 11, letterSpacing: "0.1em",
              fontFamily: "'Bebas Neue', sans-serif",
              color: activeTab === tab.id ? "var(--accent)" : "var(--muted)",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "color 0.15s",
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {isLoading && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
            <Spinner size={40} />
          </div>
        )}
        {error && (
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "rgba(127,29,29,0.9)", color: "#fca5a5", padding: "8px 16px", borderRadius: 8, fontSize: 12, border: "1px solid rgba(239,68,68,0.4)" }}>
            {error}
          </div>
        )}

        {!currentClub && !isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", gap: 12 }}>
            <BarChart2 size={48} />
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.1em" }}>
              RECHERCHE UN CLUB POUR COMMENCER
            </p>
          </div>
        ) : (
          <div key={activeTab} className="tab-content" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {activeTab === "players"  && <PlayersTab />}
            {activeTab === "matches"  && <MatchesTab />}
            {activeTab === "charts"   && <ChartsTab />}
            {activeTab === "session"  && <SessionTab />}
            {activeTab === "tactics"  && <TacticsTab />}
            {activeTab === "compare"  && <CompareTab />}
          </div>
        )}
      </div>
    </main>
  );
}
