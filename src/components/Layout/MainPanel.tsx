import { useState, useEffect } from "react";
import { BarChart2, Hash } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { PlayersTab } from "../tabs/PlayersTab";
import { MatchesTab } from "../tabs/MatchesTab";
import { ChartsTab } from "../tabs/ChartsTab";
import { SessionTab } from "../tabs/SessionTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { Spinner } from "../ui/Spinner";
import { getLogo } from "../../api/tauri";

const TAB_LABELS: Record<string, string> = {
  players: "Joueurs",
  matches: "Matchs",
  charts: "Graphiques",
  session: "Session",
  compare: "Comparer",
};

export function MainPanel() {
  const { currentClub, activeTab, isLoading, error, activeSession } = useAppStore();
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

      {/* ── KPI cards (compact) ────────────────────────────────────── */}
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
