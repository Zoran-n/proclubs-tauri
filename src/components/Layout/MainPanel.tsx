import { useState, useEffect } from "react";
import { BarChart2, Hash, Settings } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { PlayersTab } from "../tabs/PlayersTab";
import { MatchesTab } from "../tabs/MatchesTab";
import { ChartsTab } from "../tabs/ChartsTab";
import { SessionTab } from "../tabs/SessionTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { Spinner } from "../ui/Spinner";
import { getLogo } from "../../api/tauri";
import { useT } from "../../i18n";

export function MainPanel() {
  const { currentClub, activeTab, isLoading, error, activeSession, sidebarTab, setSidebarTab } = useAppStore();
  const t = useT();
  const [logo, setLogo] = useState<string | null>(null);

  const TAB_LABELS: Record<string, string> = {
    players: t("nav.players"),
    matches: t("nav.matches"),
    charts: t("nav.charts"),
    session: t("nav.session"),
    compare: t("nav.compare"),
  };

  useEffect(() => {
    setLogo(null);
    if (currentClub?.crestAssetId) {
      getLogo(currentClub.crestAssetId).then(setLogo).catch(() => {});
    }
  }, [currentClub?.id]);

  const total  = (currentClub?.wins ?? 0) + (currentClub?.losses ?? 0) + (currentClub?.ties ?? 0);
  const winPct = total > 0 ? Math.round(((currentClub?.wins ?? 0) / total) * 100) : 0;

  const KPIS = currentClub ? [
    { label: t("main.matches"),  value: total,                     color: "var(--accent)" },
    { label: t("main.wins"),     value: currentClub.wins,          color: "var(--green)" },
    { label: t("main.draws"),    value: currentClub.ties,          color: "var(--gold)" },
    { label: t("main.losses"),   value: currentClub.losses,        color: "var(--red)" },
    { label: t("main.winRate"),  value: `${winPct}%`,              color: "var(--accent)" },
    { label: t("main.goals"),    value: currentClub.goals,         color: "var(--gold)" },
  ] : [];

  // ── No club loaded: settings page ──────────────────────────────────
  if (!currentClub && !isLoading && sidebarTab === "settings") {
    return (
      <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--main-bg)" }}
        role="main" aria-label={t("settings.title")}>
        <div style={{
          height: 48, display: "flex", alignItems: "center", gap: 8,
          padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)",
          flexShrink: 0, background: "var(--main-bg)",
        }}>
          <button onClick={() => setSidebarTab("search")} style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
            display: "flex", alignItems: "center", padding: 4, borderRadius: 4,
            transition: "color 0.15s",
          }} aria-label={t("sidebar.search")}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}>
            <Settings size={18} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t("settings.title")}</span>
        </div>
        <div style={{ flex: 1, overflow: "auto", maxWidth: 600, margin: "0 auto", width: "100%" }}>
          <SettingsTab />
        </div>
      </main>
    );
  }

  // ── Club loaded: Discord-style main panel ─────────────────────────
  return (
    <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--main-bg)" }}
      role="main" aria-label={TAB_LABELS[activeTab] || t("nav.players")}>

      {/* ── Discord-style header bar ──────────────────────────────────── */}
      <div style={{
        height: 48, display: "flex", alignItems: "center", gap: 8,
        padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)",
        flexShrink: 0, background: "var(--main-bg)",
      }}>
        <Hash size={20} color="var(--muted)" aria-hidden="true" />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
          {TAB_LABELS[activeTab] || t("nav.players")}
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
              }} role="status">
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
            }} role="status">
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
        }} role="group" aria-label="KPIs">
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
          }} role="status" aria-label={t("misc.loading")}>
            <Spinner size={40} />
          </div>
        )}
        {error && (
          <div style={{
            position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
            zIndex: 10, background: "rgba(218,55,60,0.9)", color: "#fff",
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          }} role="alert">
            {error}
          </div>
        )}

        {!currentClub && !isLoading ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", color: "var(--muted)", gap: 16,
          }}>
            <BarChart2 size={56} style={{ opacity: 0.3 }} aria-hidden="true" />
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.1em", opacity: 0.5 }}>
              {t("main.searchToStart")}
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
