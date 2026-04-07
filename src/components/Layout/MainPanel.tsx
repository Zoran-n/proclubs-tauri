import { useState, useEffect } from "react";
import { BarChart2, Hash, Settings, Send, Pencil, X, Minimize2, Search } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { PlayersTab } from "../tabs/PlayersTab";
import { MatchesTab } from "../tabs/MatchesTab";
import { ChartsTab } from "../tabs/ChartsTab";
import { SessionTab } from "../tabs/SessionTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { SettingsTab } from "../Sidebar/SettingsTab";
import { ProfilePanel } from "../ui/ProfilePanel";
import { Spinner } from "../ui/Spinner";
import { getLogo } from "../../api/tauri";
import { sendDiscordWebhook } from "../../api/discord";
import { buildPlayersEmbed, buildMatchesEmbed, buildChartsEmbed } from "../../utils/discordEmbeds";
import { useT } from "../../i18n";

export function MainPanel() {
  const { currentClub, players, matches, activeTab, isLoading, error, activeSession,
    sidebarTab, setSidebarTab, discordWebhook, addToast, visibleKpis, setVisibleKpis,
    persistSettings, compactMode, setCompactMode, toggleGlobalSearch } = useAppStore();
  const t = useT();
  const [logo, setLogo] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [editingKpis, setEditingKpis] = useState(false);

  const shareTab = async () => {
    if (!discordWebhook || !currentClub) return;
    setSharing(true);
    try {
      let embed;
      if (activeTab === "players") embed = buildPlayersEmbed(players, currentClub.name);
      else if (activeTab === "matches") embed = buildMatchesEmbed(matches, currentClub.id, currentClub.name);
      else embed = buildChartsEmbed(currentClub);
      await sendDiscordWebhook(discordWebhook, [embed]);
      addToast("Envoyé sur Discord !", "success");
    } catch (e) { addToast(`Discord: ${String(e)}`, "error"); }
    finally { setSharing(false); }
  };

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
  const goalsPerMatch = total > 0 ? ((currentClub?.goals ?? 0) / total).toFixed(1) : "0.0";
  const points = (currentClub?.wins ?? 0) * 3 + (currentClub?.ties ?? 0);

  const ALL_KPIS_CATALOG = currentClub ? [
    { key: "matches",      label: t("main.matches"),      value: total,                color: "var(--accent)", desc: "Victoires + Nuls + Défaites" },
    { key: "wins",         label: t("main.wins"),         value: currentClub.wins,     color: "var(--green)",  desc: "Nombre de victoires" },
    { key: "draws",        label: t("main.draws"),        value: currentClub.ties,     color: "var(--gold)",   desc: "Nombre de matchs nuls" },
    { key: "losses",       label: t("main.losses"),       value: currentClub.losses,   color: "var(--red)",    desc: "Nombre de défaites" },
    { key: "winRate",      label: t("main.winRate"),      value: `${winPct}%`,          color: "var(--accent)", desc: "Victoires / Total matchs" },
    { key: "goals",        label: t("main.goals"),        value: currentClub.goals,    color: "var(--gold)",   desc: "Buts marqués au total" },
    { key: "goalsPerMatch",label: t("main.goalsPerMatch"),value: goalsPerMatch,         color: "var(--gold)",   desc: "Moyenne de buts par match" },
    { key: "points",       label: t("main.points"),       value: points,               color: "var(--green)",  desc: "V×3 + N×1 (points ligue)" },
  ] : [];

  const KPIS = ALL_KPIS_CATALOG.filter(k => visibleKpis.includes(k.key));

  // ── Profile page ───────────────────────────────────────────────────
  if (sidebarTab === "profile") {
    return (
      <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--main-bg)" }}
        role="main" aria-label="Mon profil">
        <div style={{
          height: 48, display: "flex", alignItems: "center", gap: 8,
          padding: "0 16px", borderBottom: "1px solid rgba(0,0,0,0.24)",
          flexShrink: 0, background: "var(--main-bg)",
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Mon profil</span>
        </div>
        <ProfilePanel />
      </main>
    );
  }

  // ── Settings page ──────────────────────────────────────────────────
  if (!isLoading && sidebarTab === "settings") {
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
            <button onClick={toggleGlobalSearch} title="Recherche globale (Ctrl+K)"
              style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                padding: "4px 8px", background: "var(--hover)", border: "1px solid var(--border)",
                borderRadius: 5, color: "var(--muted)", fontSize: 11, cursor: "pointer",
              }}>
              <Search size={12} />
              <kbd style={{ fontSize: 9, opacity: 0.7 }}>Ctrl+K</kbd>
            </button>
            <button onClick={() => setCompactMode(!compactMode)} title={compactMode ? "Mode normal" : "Mode compact"}
              style={{
                marginLeft: 6, display: "flex", alignItems: "center", gap: 4,
                padding: "4px 8px",
                background: compactMode ? "rgba(0,212,255,0.12)" : "var(--hover)",
                border: `1px solid ${compactMode ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 5, color: compactMode ? "var(--accent)" : "var(--muted)",
                fontSize: 11, cursor: "pointer",
              }}>
              <Minimize2 size={12} />
            </button>
            {discordWebhook && ["players", "matches", "charts"].includes(activeTab) && (
              <button onClick={shareTab} disabled={sharing} title="Partager sur Discord"
                style={{
                  marginLeft: 6, display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", background: "rgba(88,101,242,0.12)",
                  border: "1px solid rgba(88,101,242,0.25)", borderRadius: 5,
                  color: sharing ? "var(--muted)" : "#5865f2", fontSize: 11, cursor: sharing ? "default" : "pointer",
                  opacity: sharing ? 0.6 : 1, transition: "all 0.15s",
                  fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
                }}>
                <Send size={12} /> DISCORD
              </button>
            )}
            {activeSession && (
              <span style={{
                marginLeft: 8,
                fontSize: 10, color: "#fff",
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
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "stretch", gap: 8, padding: "12px 16px",
            borderBottom: "1px solid rgba(0,0,0,0.12)",
          }} role="group" aria-label="KPIs">
            {KPIS.map(({ key, label, value, color }) => (
              <div key={key} style={{
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
            {/* Bouton Éditer */}
            <button
              onClick={() => setEditingKpis(v => !v)}
              title={t("main.editKpis")}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, padding: "8px 10px", background: editingKpis ? "var(--accent)" : "var(--hover)",
                border: `1px solid ${editingKpis ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 8, cursor: "pointer", color: editingKpis ? "#fff" : "var(--muted)",
                transition: "all 0.15s", flexShrink: 0, minWidth: 40,
              }}
              onMouseEnter={(e) => { if (!editingKpis) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--accent)"; } }}
              onMouseLeave={(e) => { if (!editingKpis) { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; } }}
            >
              <Pencil size={13} />
              <span style={{ fontSize: 8, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}>
                {t("main.editKpis")}
              </span>
            </button>
          </div>

          {/* ── Panel éditeur KPI ─────────────────────────────────── */}
          {editingKpis && (
            <div
              style={{
                position: "absolute", top: "calc(100% - 1px)", right: 0, zIndex: 200,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "0 0 10px 10px", padding: "14px 16px", width: 260,
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.08em", color: "var(--accent)" }}>
                  {t("main.kpiPanelTitle")}
                </span>
                <button
                  onClick={() => setEditingKpis(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 2 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Liste des KPIs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ALL_KPIS_CATALOG.map(kpi => {
                  const active = visibleKpis.includes(kpi.key);
                  return (
                    <label
                      key={kpi.key}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                        padding: "7px 10px", borderRadius: 6, transition: "background 0.1s",
                        background: active ? "rgba(var(--accent-rgb, 0,212,255), 0.08)" : "transparent",
                        border: `1px solid ${active ? "rgba(var(--accent-rgb, 0,212,255), 0.2)" : "transparent"}`,
                      }}
                    >
                      {/* Checkbox custom */}
                      <div
                        style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                          background: active ? "var(--accent)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                        onClick={() => {
                          let next: string[];
                          if (active) {
                            if (visibleKpis.length <= 1) return;
                            next = visibleKpis.filter(k => k !== kpi.key);
                          } else {
                            next = [...visibleKpis, kpi.key];
                          }
                          setVisibleKpis(next);
                          persistSettings();
                        }}
                      >
                        {active && (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1, pointerEvents: "none" }}>
                        <div style={{ fontSize: 12, fontFamily: "'Bebas Neue', sans-serif", color: kpi.color, letterSpacing: "0.05em" }}>
                          {kpi.label}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 1 }}>
                          {kpi.desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
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
