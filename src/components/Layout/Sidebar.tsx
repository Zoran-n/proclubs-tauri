import { useState, useEffect, useRef } from "react";
import { Users, Swords, BarChart3, Timer, GitCompare, Star, ChevronDown, Search, RefreshCw, Send } from "lucide-react";
import { useAppStore, type ActiveTab } from "../../store/useAppStore";
import { SearchTab } from "../Sidebar/SearchTab";
import { useClub } from "../../hooks/useClub";
import { getLogo, searchClub } from "../../api/tauri";
import { sendDiscordWebhook } from "../../api/discord";
import { buildClubOverviewEmbed } from "../../utils/discordEmbeds";
import { useT } from "../../i18n";
import type { Club } from "../../types";
import type { ReactNode } from "react";

function ClubLogo({ club, size = 32 }: { club: Club; size?: number }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (club.crestAssetId) getLogo(club.crestAssetId).then(setLogo).catch(() => {});
  }, [club.crestAssetId]);
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: "var(--bg)",
      flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
      aria-hidden="true">
      {logo
        ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.45, color: "var(--accent)" }}>
            {(club.name || "?")[0].toUpperCase()}
          </span>
      }
    </div>
  );
}

function useNavItems(): { id: ActiveTab; icon: ReactNode; label: string }[] {
  const t = useT();
  return [
    { id: "players",  icon: <Users size={18} />,       label: t("nav.players") },
    { id: "matches",  icon: <Swords size={18} />,      label: t("nav.matches") },
    { id: "charts",   icon: <BarChart3 size={18} />,   label: t("nav.charts") },
    { id: "session",  icon: <Timer size={18} />,       label: t("nav.session") },
    { id: "compare",  icon: <GitCompare size={18} />,  label: t("nav.compare") },
  ];
}

export function Sidebar() {
  const { currentClub, activeTab, setActiveTab, setSidebarTab, favs, activeSession, history,
    toggleFav, persistSettings, discordWebhook, players, matches, addToast } = useAppStore();
  const { load } = useClub();
  const t = useT();
  const NAV_ITEMS = useNavItems();
  const [sharing, setSharing] = useState(false);

  const shareOverview = async () => {
    if (!discordWebhook) { addToast("Configure le webhook Discord dans Mon Profil", "error"); return; }
    if (!currentClub) { addToast("Charge un club d'abord", "error"); return; }
    setSharing(true);
    try {
      await sendDiscordWebhook(discordWebhook, [buildClubOverviewEmbed(currentClub, players, matches)]);
      addToast("Envoyé sur Discord !", "success");
    } catch (e) { addToast(`Discord: ${String(e)}`, "error"); }
    finally { setSharing(false); }
  };

  // No club loaded: launch panel with search + nav + history
  if (!currentClub) {
    return (
      <aside style={{
        width: 240, flexShrink: 0, height: "100%",
        background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
      }} role="navigation" aria-label={t("sidebar.search")}>
        <LaunchSidebar />
      </aside>
    );
  }

  // Main club navigation sidebar (Discord channel style)
  return (
    <aside style={{
      width: 240, flexShrink: 0, height: "100%",
      background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
    }} role="navigation" aria-label={t("sidebar.stats")}>
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
          {t("sidebar.search")}
        </div>
        <div key="search-inline" className="sidebar-tab" style={{ maxHeight: 300, overflow: "hidden" }}>
          <SearchTab compact />
        </div>

        {/* Navigation channels */}
        {currentClub && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              {t("sidebar.stats")}
            </div>
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`channel-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => { setActiveTab(item.id); setSidebarTab("search"); persistSettings(); }}
                role="tab" aria-selected={activeTab === item.id} tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { setActiveTab(item.id); setSidebarTab("search"); persistSettings(); } }}
              >
                <span style={{ color: activeTab === item.id ? "var(--text)" : "var(--muted)", flexShrink: 0, display: "flex" }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === "session" && activeSession && (
                  <span style={{
                    marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
                    background: "var(--red)", flexShrink: 0,
                  }} aria-label="Live" />
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
              {t("sidebar.favs")}
            </div>
            <FavsList />
          </>
        )}

        {/* Clubs Recents */}
        {history.length > 0 && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              {t("sidebar.recent")}
            </div>
            {history.map((club) => (
              <div key={club.id}
                className={`channel-item ${currentClub?.id === club.id ? "active" : ""}`}
                onClick={() => { load(club.id, club.platform); persistSettings(); }}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { load(club.id, club.platform); persistSettings(); } }}>
                <ClubLogo club={club} size={20} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </span>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                  aria-label={`Toggle favorite ${club.name}`}
                  style={{
                    marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                    padding: 2, color: favs.some((f) => f.id === club.id) ? "var(--gold)" : "var(--muted)",
                    flexShrink: 0, opacity: 0.6, transition: "opacity 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}>
                  <Star size={12} fill={favs.some((f) => f.id === club.id) ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </>
        )}

        {/* Rafraichissement */}
        <div className="category-header" style={{ marginTop: 8 }}>
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          {t("sidebar.refresh")}
        </div>
        <div
          className="channel-item"
          onClick={() => { if (currentClub) load(currentClub.id, currentClub.platform); }}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" && currentClub) load(currentClub.id, currentClub.platform); }}
          style={{ cursor: "pointer" }}>
          <RefreshCw size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <span>{t("sidebar.refreshBtn")}</span>
        </div>
        <AutoRefreshItem clubId={currentClub?.id} platform={currentClub?.platform} load={load} />

        <DiscordSection onShare={shareOverview} sharing={sharing} />
      </div>

      {/* Bottom user panel (like Discord user area) */}
      <UserPanel />
    </aside>
  );
}

/* ── Launch sidebar (no club loaded) ─────────────────────────────── */

function LaunchSidebar() {
  const { history, favs, toggleFav, persistSettings, setActiveTab, activeTab, addLog, setSearchResults,
    discordWebhook, players, matches, addToast } = useAppStore();
  const { load } = useClub();
  const t = useT();
  const NAV_ITEMS = useNavItems();
  const [query, setQuery] = useState("");
  const [sharing, setSharing] = useState(false);

  const shareOverview = async () => {
    if (!discordWebhook) { addToast("Configure le webhook Discord dans Mon Profil", "error"); return; }
    const club = history[0] || favs[0];
    if (!club) { addToast("Charge un club d'abord", "error"); return; }
    setSharing(true);
    try {
      await sendDiscordWebhook(discordWebhook, [buildClubOverviewEmbed(club, players, matches)]);
      addToast("Envoyé sur Discord !", "success");
    } catch (e) { addToast(`Discord: ${String(e)}`, "error"); }
    finally { setSharing(false); }
  };

  const lastClub = history[0] || favs[0];

  const doSearch = async () => {
    if (!query.trim()) return;
    addLog(`${t("sidebar.search")}: "${query}"…`);
    try {
      const clubs = await searchClub(query.trim());
      setSearchResults(clubs, true);
      addLog(`${clubs.length} result(s)`);
    } catch (e) {
      addLog(`Error: ${String(e)}`);
    }
  };

  const isFav = (id: string) => favs.some((f) => f.id === id);

  return (
    <>
      {/* Header */}
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

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>

        {/* RECHERCHE */}
        <div className="category-header">
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          {t("sidebar.search")}
        </div>
        <div style={{ padding: "4px 8px" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder={t("sidebar.searchPlaceholder")}
              aria-label={t("sidebar.search")}
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
          {t("sidebar.stats")}
        </div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`channel-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => { setActiveTab(item.id); if (lastClub) load(lastClub.id, lastClub.platform); }}
            role="tab" aria-selected={activeTab === item.id} tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") { setActiveTab(item.id); if (lastClub) load(lastClub.id, lastClub.platform); } }}
          >
            <span style={{ color: activeTab === item.id ? "var(--text)" : "var(--muted)", flexShrink: 0, display: "flex" }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        {/* FAVORIS */}
        {favs.length > 0 && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              {t("sidebar.favs")}
            </div>
            {favs.map((club) => (
              <div key={club.id}
                className="channel-item"
                onClick={() => load(club.id, club.platform)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") load(club.id, club.platform); }}>
                <ClubLogo club={club} size={20} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </span>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                  aria-label={`Toggle favorite ${club.name}`}
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

        {/* CLUBS RECENTS */}
        {history.length > 0 && (
          <>
            <div className="category-header" style={{ marginTop: 8 }}>
              <ChevronDown size={10} style={{ marginRight: 2 }} />
              {t("sidebar.recent")}
            </div>
            {history.map((club) => (
              <div key={club.id}
                className="channel-item"
                onClick={() => { load(club.id, club.platform); persistSettings(); }}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { load(club.id, club.platform); persistSettings(); } }}>
                <ClubLogo club={club} size={20} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </span>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                  aria-label={`Toggle favorite ${club.name}`}
                  style={{
                    marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                    padding: 2, color: isFav(club.id) ? "var(--gold)" : "var(--muted)", flexShrink: 0, opacity: 0.6,
                    transition: "opacity 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}>
                  <Star size={12} fill={isFav(club.id) ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </>
        )}

        {/* RAFRAICHISSEMENT */}
        <div className="category-header" style={{ marginTop: 8 }}>
          <ChevronDown size={10} style={{ marginRight: 2 }} />
          {t("sidebar.refresh")}
        </div>
        <div
          className="channel-item"
          onClick={() => { if (lastClub) load(lastClub.id, lastClub.platform); }}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" && lastClub) load(lastClub.id, lastClub.platform); }}
          style={{ cursor: "pointer" }}>
          <RefreshCw size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <span>{t("sidebar.refreshBtn")}</span>
        </div>
        <AutoRefreshItem clubId={lastClub?.id} platform={lastClub?.platform} load={load} />

        <DiscordSection onShare={shareOverview} sharing={sharing} />
      </div>
    </>
  );
}

/* ── Discord section ─────────────────────────────────────────────── */

function DiscordSection({ onShare, sharing }: { onShare: () => void; sharing: boolean }) {
  const { discordWebhook, setSidebarTab } = useAppStore();

  return (
    <div style={{ margin: "12px 8px 4px", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(88,101,242,0.25)" }}>
      {/* Header */}
      <div style={{
        background: "rgba(88,101,242,0.18)",
        padding: "7px 10px",
        display: "flex", alignItems: "center", gap: 7,
        borderBottom: "1px solid rgba(88,101,242,0.2)",
      }}>
        {/* Discord logo SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865f2">
          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#5865f2", letterSpacing: "0.04em", flex: 1 }}>
          DISCORD
        </span>
        {discordWebhook
          ? <span style={{ fontSize: 9, background: "rgba(35,165,89,0.2)", color: "var(--green)", padding: "2px 6px", borderRadius: 10, fontWeight: 600 }}>Actif</span>
          : <span style={{ fontSize: 9, background: "rgba(255,255,255,0.06)", color: "var(--muted)", padding: "2px 6px", borderRadius: 10 }}>Non configuré</span>
        }
      </div>

      {/* Share button */}
      <div style={{ padding: "8px 8px 6px" }}>
        <button
          onClick={onShare}
          disabled={sharing}
          style={{
            width: "100%", padding: "7px 10px",
            background: sharing ? "rgba(88,101,242,0.08)" : "rgba(88,101,242,0.15)",
            border: "none", borderRadius: 6,
            color: sharing ? "var(--muted)" : "#5865f2",
            fontSize: 12, fontWeight: 700, cursor: sharing ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
          }}
          onMouseEnter={(e) => { if (!sharing) e.currentTarget.style.background = "rgba(88,101,242,0.25)"; }}
          onMouseLeave={(e) => { if (!sharing) e.currentTarget.style.background = "rgba(88,101,242,0.15)"; }}
        >
          <Send size={13} />
          {sharing ? "ENVOI EN COURS…" : "PARTAGER LES STATS"}
        </button>

        {!discordWebhook && (
          <button onClick={() => setSidebarTab("profile")} style={{
            width: "100%", marginTop: 5, padding: "5px 10px",
            background: "none", border: "none",
            color: "var(--muted)", fontSize: 10, cursor: "pointer",
            textDecoration: "underline", textDecorationStyle: "dotted",
          }}>
            Configurer dans Mon Profil
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Shared sub-components ───────────────────────────────────────── */

function FavsList() {
  const { favs, toggleFav, persistSettings, currentClub } = useAppStore();
  const { load } = useClub();

  return (
    <>
      {favs.map((club) => (
        <div key={club.id}
          className={`channel-item ${currentClub?.id === club.id ? "active" : ""}`}
          onClick={() => load(club.id, club.platform)}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") load(club.id, club.platform); }}>
          <ClubLogo club={club} size={20} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {club.name || `Club #${club.id}`}
          </span>
          <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
            aria-label={`Remove ${club.name} from favorites`}
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

function AutoRefreshItem({ clubId, platform, load }: { clubId?: string; platform?: string; load: (id: string, p: string) => void }) {
  const t = useT();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoRefresh && clubId && platform) {
      setCountdown(60);
      autoRef.current = setInterval(() => { load(clubId, platform); setCountdown(60); }, 60_000);
      countRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? 60 : c - 1)), 1_000);
    } else {
      if (autoRef.current) clearInterval(autoRef.current);
      if (countRef.current) clearInterval(countRef.current);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); if (countRef.current) clearInterval(countRef.current); };
  }, [autoRefresh, clubId, platform]);

  return (
    <div className="channel-item" style={{ cursor: "pointer" }} onClick={() => setAutoRefresh(!autoRefresh)}
      role="button" tabIndex={0} aria-pressed={autoRefresh}
      onKeyDown={(e) => { if (e.key === "Enter") setAutoRefresh(!autoRefresh); }}>
      <Timer size={18} style={{ color: autoRefresh ? "var(--green)" : "var(--muted)", flexShrink: 0 }} />
      <span>{t("sidebar.autoRefresh")}</span>
      {autoRefresh && (
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)" }}>
          {countdown}s
        </span>
      )}
    </div>
  );
}

function UserPanel() {
  const { currentClub } = useAppStore();
  const t = useT();

  return (
    <div style={{
      padding: "8px", background: "rgba(0,0,0,0.16)", flexShrink: 0,
      display: "flex", alignItems: "center", gap: 8,
    }} role="status">
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
          {t("sidebar.noClub")}
        </div>
      )}
    </div>
  );
}
