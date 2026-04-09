import { useState, useMemo, useRef } from "react";
import { Link, User, Unlink, Send, Database, Plus, ChevronRight, Download, Upload, Image, Clock } from "lucide-react";
import { searchClub, getMembers, saveSettings as apiSave } from "../../api/tauri";
import { sendDiscordWebhook } from "../../api/discord";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import { PLATFORMS } from "../../types";
import type { Club, EaProfile, SyncEntry } from "../../types";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--card)", border: "1px solid var(--border)",
  color: "var(--text)", padding: "8px 12px", borderRadius: 6, fontSize: 13,
  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em",
  fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 5,
};

const sectionHeadStyle: React.CSSProperties = {
  fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em",
  fontFamily: "'Bebas Neue', sans-serif", marginBottom: 12,
  display: "flex", alignItems: "center", gap: 6,
};

function getDivision(sr: number): { div: string; color: string; tier: string } {
  if (sr >= 3000) return { div: "Elite",  color: "#f59e0b", tier: "gold" };
  if (sr >= 2700) return { div: "Div 1",  color: "#f59e0b", tier: "gold" };
  if (sr >= 2400) return { div: "Div 2",  color: "#f59e0b", tier: "gold" };
  if (sr >= 2100) return { div: "Div 3",  color: "#a855f7", tier: "purple" };
  if (sr >= 1800) return { div: "Div 4",  color: "#a855f7", tier: "purple" };
  if (sr >= 1500) return { div: "Div 5",  color: "#3b82f6", tier: "blue" };
  if (sr >= 1300) return { div: "Div 6",  color: "#3b82f6", tier: "blue" };
  if (sr >= 1100) return { div: "Div 7",  color: "#22c55e", tier: "green" };
  if (sr >= 900)  return { div: "Div 8",  color: "#22c55e", tier: "green" };
  if (sr >= 700)  return { div: "Div 9",  color: "#6b7280", tier: "gray" };
  return              { div: "Div 10", color: "#6b7280", tier: "gray" };
}

function SyncEntryRow({ entry }: { entry: SyncEntry }) {
  const d = new Date(entry.ts);
  const dateStr = `${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
      borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: entry.status === "ok" ? "var(--green)" : "var(--red)", fontSize: 8 }}>●</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.clubName}
          {entry.matchCount > 0 && <span style={{ color: "var(--accent)", marginLeft: 4 }}>+{entry.matchCount}</span>}
        </div>
        {entry.note && <div style={{ fontSize: 10, color: "var(--muted)" }}>{entry.note}</div>}
      </div>
      <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{dateStr}</span>
    </div>
  );
}

export function ProfilePanel() {
  const {
    eaProfile, setEaProfile, eaProfiles, addEaProfile, removeEaProfile, switchEaProfile,
    syncHistory, addSyncEntry,
    addLog, persistSettings, setSidebarTab,
    discordWebhook, setDiscordWebhook, addToast,
    matchCache, sessions, matches, currentClub,
    loadSettings,
  } = useAppStore();
  const { load } = useClub();

  const [gamertag, setGamertag] = useState(eaProfile?.gamertag ?? "");
  const [clubSearch, setClubSearch] = useState(eaProfile?.clubName ?? "");
  const [platform, setPlatform] = useState(eaProfile?.platform ?? "common-gen5");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [webhookDraft, setWebhookDraft] = useState(discordWebhook);
  const [testing, setTesting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  // ── SR / division from current club (if matches profile) ──────────────────
  const srNum = useMemo(() => {
    if (!eaProfile?.clubId) return null;
    // Try currentClub first
    if (currentClub?.id === eaProfile.clubId && currentClub.skillRating) {
      return Number(currentClub.skillRating) || null;
    }
    // Try match cache
    const keys = Object.keys(matchCache).filter(k => k.startsWith(`${eaProfile.clubId}_`));
    for (const key of keys) {
      const ms = matchCache[key];
      if (!ms?.length) continue;
      const m = ms[0];
      const club = m.clubs?.[eaProfile.clubId];
      if (club) {
        const sr = Number((club as Record<string, unknown>).skillRating ?? (club as Record<string, unknown>).skill_rating ?? 0);
        if (sr > 0) return sr;
      }
    }
    return null;
  }, [eaProfile, currentClub, matchCache]);

  const division = srNum ? getDivision(srNum) : null;

  // ── Aggregated personal stats ─────────────────────────────────────────────
  const aggStats = useMemo(() => {
    if (!eaProfile?.gamertag || !eaProfile?.clubId) return null;
    const gt = eaProfile.gamertag.toLowerCase();
    const cid = eaProfile.clubId;
    let games = 0, goals = 0, assists = 0, motm = 0, ratingSum = 0, ratingCount = 0;

    const processMatches = (ms: typeof matches) => {
      for (const m of ms) {
        const clubPlayers = m.players?.[cid] ?? {};
        const entry = Object.entries(clubPlayers).find(([k]) => k.toLowerCase() === gt);
        if (!entry) continue;
        const p = entry[1];
        games++;
        goals += Number(p.goals ?? 0);
        assists += Number(p.assists ?? 0);
        motm += Number(p.mom ?? p.manofthematch ?? 0);
        const r = Number(p.rating ?? p.ratingAve ?? 0);
        if (r > 0) { ratingSum += r; ratingCount++; }
      }
    };

    for (const s of sessions) processMatches(s.matches);
    processMatches(matches);

    if (games === 0) return null;
    return { games, goals, assists, motm, avgRating: ratingCount > 0 ? (ratingSum / ratingCount).toFixed(2) : null };
  }, [eaProfile, sessions, matches]);

  // ── Link handler ──────────────────────────────────────────────────────────
  const handleLink = async () => {
    if (!gamertag.trim() || !clubSearch.trim()) return;
    setLinking(true); setError(null);
    addLog(`Liaison profil: "${gamertag}" dans "${clubSearch}"…`);
    try {
      const clubs = await searchClub(clubSearch.trim(), platform);
      if (!clubs.length) { setError("Aucun club trouvé."); return; }
      let found: Club | null = null;
      for (const club of clubs.slice(0, 10)) {
        const members = await getMembers(club.id, club.platform).catch(() => []);
        if (members.find((m) => m.name.toLowerCase() === gamertag.trim().toLowerCase())) {
          found = club; break;
        }
      }
      if (found) {
        const profile: EaProfile = { gamertag: gamertag.trim(), platform, clubId: found.id, clubName: found.name };
        setEaProfile(profile);
        addEaProfile(profile);
        await persistSettings();
        setShowLinkForm(false);
        addLog(`Profil lié: ${found.name}`);
      } else {
        setError("Gamertag introuvable dans les membres du club.");
      }
    } catch (e) {
      setError(`Erreur: ${String(e)}`);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = () => {
    setEaProfile({ gamertag: "", platform: "common-gen5", clubId: "", clubName: "" });
    persistSettings();
  };

  const handleLoadClub = () => {
    if (!eaProfile?.clubId) return;
    load(eaProfile.clubId, eaProfile.platform);
    setSidebarTab("search");
    addSyncEntry({
      ts: new Date().toISOString(),
      clubId: eaProfile.clubId,
      clubName: eaProfile.clubName,
      matchCount: 0,
      status: "ok",
      note: "Chargement manuel",
    });
    persistSettings();
  };

  // ── Backup / Restore ──────────────────────────────────────────────────────
  const exportBackup = async () => {
    try {
      const s = useAppStore.getState();
      const payload = {
        history: s.history, favs: s.favs, tactics: s.tactics, sessions: s.sessions,
        compareHistory: s.compareHistory,
        eaProfile: s.eaProfile ?? undefined,
        eaProfiles: s.eaProfiles,
        syncHistory: s.syncHistory,
        theme: s.theme, darkMode: s.darkMode,
        proxyUrl: s.proxyUrl || undefined,
        showGrid: s.showGrid, showAnimations: s.showAnimations,
        showLogs: s.showLogs, showIdSearch: s.showIdSearch,
        fontSize: String(s.fontSize), fontFamily: s.fontFamily,
        customAccent: s.customAccent || undefined,
        language: s.language, onboarded: s.onboarded,
        matchCache: s.matchCache,
        discordWebhook: s.discordWebhook || undefined,
        autoUpdate: s.autoUpdate,
        matchAnnotations: s.matchAnnotations,
        visibleKpis: s.visibleKpis, navLayout: s.navLayout,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prostats_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("Backup exporté !", "success");
    } catch (e) {
      addToast(`Export échoué: ${String(e)}`, "error");
    }
  };

  const importBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await apiSave(data);
        await loadSettings();
        addToast("Backup restauré avec succès !", "success");
      } catch {
        addToast("Fichier de backup invalide", "error");
      }
    };
    reader.readAsText(file);
  };

  // ── Profile card PNG ──────────────────────────────────────────────────────
  const generateProfileCard = () => {
    if (!eaProfile?.gamertag) return;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00d4ff";
    const canvas = document.createElement("canvas");
    canvas.width = 520; canvas.height = 200;
    const ctx = canvas.getContext("2d")!;

    // BG
    ctx.fillStyle = "#1a1c1f";
    ctx.fillRect(0, 0, 520, 200);

    // Accent bar
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 4, 200);

    // Avatar circle
    ctx.beginPath();
    ctx.arc(60, 64, 34, 0, Math.PI * 2);
    ctx.fillStyle = accent + "33";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(eaProfile.gamertag[0].toUpperCase(), 60, 73);

    // Gamertag
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "left";
    ctx.fillText(eaProfile.gamertag, 110, 52);

    // Club + platform
    ctx.fillStyle = "#888888";
    ctx.font = "14px Arial";
    ctx.fillText(`${eaProfile.clubName} · ${eaProfile.platform}`, 110, 72);

    // Division badge
    if (division) {
      ctx.fillStyle = division.color + "22";
      ctx.beginPath();
      ctx.roundRect(110, 82, 70, 22, 4);
      ctx.fill();
      ctx.fillStyle = division.color;
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "left";
      ctx.fillText(division.div, srNum ? 116 : 116, 98);
      if (srNum) {
        ctx.fillStyle = "#666";
        ctx.font = "11px Arial";
        ctx.fillText(`${srNum} SR`, 188, 98);
      }
    }

    // Separator
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(24, 122); ctx.lineTo(496, 122); ctx.stroke();

    // Stats
    if (aggStats) {
      const stats = [
        { label: "MATCHS", value: String(aggStats.games) },
        { label: "BUTS", value: String(aggStats.goals) },
        { label: "PASSES D.", value: String(aggStats.assists) },
        { label: "MOTM", value: String(aggStats.motm) },
        { label: "NOTE MOY.", value: aggStats.avgRating ?? "—" },
      ];
      const colW = 460 / stats.length;
      stats.forEach((s, i) => {
        const x = 30 + i * colW + colW / 2;
        ctx.fillStyle = accent;
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText(s.value, x, 158);
        ctx.fillStyle = "#666";
        ctx.font = "10px Arial";
        ctx.fillText(s.label, x, 174);
      });
    } else {
      ctx.fillStyle = "#444";
      ctx.font = "13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Aucune stat disponible — charge un club pour analyser tes performances", 260, 158);
    }

    // Footer
    ctx.fillStyle = "#444";
    ctx.font = "10px Arial";
    ctx.textAlign = "right";
    ctx.fillText("ProClubs Stats", 496, 194);

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eaProfile.gamertag}_prostats.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    addToast("Fiche exportée !", "success");
  };

  const copyDiscordEmbed = () => {
    if (!eaProfile?.gamertag) return;
    const lines = [
      `**${eaProfile.gamertag}** — ${eaProfile.clubName}`,
      division ? `🏆 ${division.div}${srNum ? ` (${srNum} SR)` : ""}` : "",
      aggStats ? [
        `⚽ ${aggStats.goals} buts  🎯 ${aggStats.assists} PD  🌟 ${aggStats.motm} MOTM`,
        aggStats.avgRating ? `📊 Note moy. ${aggStats.avgRating} / ${aggStats.games} matchs` : `🎮 ${aggStats.games} matchs`,
      ].join("\n") : "",
      "_via ProClubs Stats_",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(
      () => addToast("Embed copié !", "success"),
      () => addToast("Impossible de copier", "error"),
    );
  };

  // ── Webhook ───────────────────────────────────────────────────────────────
  const saveWebhook = () => { setDiscordWebhook(webhookDraft); persistSettings(); };
  const testWebhook = async () => {
    const url = webhookDraft.trim();
    if (!url) return;
    setTesting(true);
    try {
      await sendDiscordWebhook(url, [{
        title: "✅ ProClubs Stats — Test",
        color: 0x00d4ff,
        description: "Webhook Discord correctement configuré !",
        footer: { text: "ProClubs Stats" },
      }]);
      addToast("Message test envoyé !", "success");
    } catch (e) {
      addToast(`Discord: ${String(e)}`, "error");
    } finally {
      setTesting(false);
    }
  };

  const isLinked = Boolean(eaProfile?.clubId);

  return (
    <div style={{ flex: 1, overflow: "auto", maxWidth: 500, margin: "0 auto", width: "100%", padding: "24px 20px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: isLinked ? "var(--accent)" : "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid var(--border)", flexShrink: 0, position: "relative",
        }}>
          {isLinked
            ? <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#fff" }}>
                {eaProfile!.gamertag[0].toUpperCase()}
              </span>
            : <User size={28} color="var(--muted)" />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--text)", letterSpacing: "0.04em" }}>
            {eaProfile?.gamertag || "Mon profil"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {eaProfile?.clubName ? `${eaProfile.clubName} · ${eaProfile.platform}` : "Aucun profil EA lié"}
          </div>
        </div>
        {division && (
          <div style={{
            padding: "4px 10px", borderRadius: 6, background: division.color + "22",
            border: `1px solid ${division.color}44`, color: division.color,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, flexShrink: 0,
          }}>
            {division.div}
            {srNum && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>{srNum}</span>}
          </div>
        )}
      </div>

      {/* ── Active profile actions ── */}
      {isLinked ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <button onClick={handleLoadClub} style={{
            width: "100%", padding: "10px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 14, letterSpacing: "0.08em", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <User size={14} /> CHARGER MON CLUB
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowLinkForm(v => !v)} style={{
              flex: 1, padding: "8px", background: "var(--hover)",
              border: "1px solid var(--border)", color: "var(--text)",
              borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              <Plus size={12} /> AJOUTER PROFIL
            </button>
            <button onClick={handleUnlink} style={{
              flex: 1, padding: "8px", background: "transparent",
              border: "1px solid var(--border)", color: "var(--muted)",
              borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              <Unlink size={12} /> DÉLIER
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => setShowLinkForm(v => !v)} style={{
            width: "100%", padding: "10px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 14, letterSpacing: "0.08em", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Link size={14} /> LIER MON PROFIL
          </button>
        </div>
      )}

      {/* ── Link form (collapsible) ── */}
      {showLinkForm && (
        <div style={{ background: "var(--hover)", borderRadius: 8, padding: "14px", marginBottom: 20,
          border: "1px solid var(--border)" }}>
          <div style={sectionHeadStyle}>LIER UN NOUVEAU PROFIL</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={labelStyle}>GAMERTAG / PSN ID</label>
              <input value={gamertag} onChange={(e) => setGamertag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLink()}
                placeholder="Ton pseudo EA…" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={labelStyle}>NOM DE TON CLUB</label>
              <input value={clubSearch} onChange={(e) => setClubSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLink()}
                placeholder="Nom exact de ton club EA…" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={labelStyle}>PLATEFORME</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                style={{ ...inputStyle, fontSize: 12 }}>
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {error && (
              <div style={{ background: "rgba(218,55,60,0.1)", border: "1px solid rgba(218,55,60,0.3)",
                borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "var(--red)" }}>
                {error}
              </div>
            )}
            <button onClick={handleLink} disabled={linking || !gamertag.trim() || !clubSearch.trim()} style={{
              width: "100%", padding: "9px", background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 13, letterSpacing: "0.08em", cursor: "pointer",
              opacity: linking || !gamertag.trim() || !clubSearch.trim() ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Link size={13} /> {linking ? "RECHERCHE…" : "LIER"}
            </button>
          </div>
        </div>
      )}

      {/* ── Multi-profiles list ── */}
      {eaProfiles.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
          <div style={sectionHeadStyle}><User size={11} /> PROFILS ENREGISTRÉS ({eaProfiles.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {eaProfiles.map((p) => {
              const isActive = eaProfile?.gamertag === p.gamertag && eaProfile?.platform === p.platform;
              return (
                <div key={`${p.gamertag}-${p.platform}`} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  background: isActive ? "rgba(0,212,255,0.08)" : "var(--hover)",
                  border: `1px solid ${isActive ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                  borderRadius: 6,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: isActive ? "var(--accent)" : "var(--surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 13, fontWeight: 700,
                    color: isActive ? "#fff" : "var(--muted)",
                    fontFamily: "'Bebas Neue', sans-serif",
                  }}>
                    {p.gamertag[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: isActive ? "var(--accent)" : "var(--text)", fontWeight: 600 }}>
                      {p.gamertag}
                      {isActive && <span style={{ fontSize: 10, marginLeft: 6, color: "var(--muted)" }}>actif</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.clubName} · {p.platform}
                    </div>
                  </div>
                  {!isActive && (
                    <button onClick={() => { switchEaProfile(p); persistSettings(); }}
                      title="Basculer vers ce profil"
                      style={{
                        padding: "4px 8px", background: "var(--surface)",
                        border: "1px solid var(--border)", borderRadius: 4,
                        color: "var(--text)", fontSize: 11, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                        fontFamily: "'Bebas Neue', sans-serif",
                      }}>
                      <ChevronRight size={11} /> ACTIVER
                    </button>
                  )}
                  <button onClick={() => { removeEaProfile(p.gamertag); persistSettings(); }}
                    title="Supprimer ce profil"
                    style={{
                      padding: "4px 6px", background: "transparent",
                      border: "1px solid var(--border)", borderRadius: 4,
                      color: "var(--muted)", fontSize: 10, cursor: "pointer",
                    }}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Aggregated stats ── */}
      {aggStats && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
          <div style={sectionHeadStyle}><ChevronRight size={11} /> STATS PERSONNELLES AGRÉGÉES · {aggStats.games} matchs</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "BUTS", value: aggStats.goals, color: "var(--green)" },
              { label: "PASSES D.", value: aggStats.assists, color: "var(--accent)" },
              { label: "MOTM", value: aggStats.motm, color: "var(--gold)" },
              { label: "NOTE MOY.", value: aggStats.avgRating ?? "—", color: "var(--text)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: "var(--hover)", borderRadius: 6, padding: "10px 8px",
                textAlign: "center", border: "1px solid var(--border)",
              }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color, lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4, letterSpacing: "0.06em" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fiche de profil partageable ── */}
      {isLinked && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
          <div style={sectionHeadStyle}><Image size={11} /> FICHE DE PROFIL</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={generateProfileCard} style={{
              flex: 1, padding: "8px", background: "var(--hover)",
              border: "1px solid var(--border)", borderRadius: 6,
              color: "var(--text)", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
            }}>
              <Download size={12} /> PNG
            </button>
            <button onClick={copyDiscordEmbed} style={{
              flex: 1, padding: "8px", background: "rgba(88,101,242,0.12)",
              border: "1px solid rgba(88,101,242,0.3)", borderRadius: 6,
              color: "#5865f2", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
            }}>
              <Send size={12} /> DISCORD
            </button>
          </div>
        </div>
      )}

      {/* ── Cache ── */}
      {isLinked && (() => {
        const types = [
          { key: `${eaProfile!.clubId}_${eaProfile!.platform}_leagueMatch`, label: "Championnat" },
          { key: `${eaProfile!.clubId}_${eaProfile!.platform}_playoffMatch`, label: "Playoff" },
          { key: `${eaProfile!.clubId}_${eaProfile!.platform}_friendlyMatch`, label: "Amical" },
        ];
        const total = types.reduce((acc, t) => acc + (matchCache[t.key]?.length ?? 0), 0);
        return (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
            <div style={sectionHeadStyle}>
              <Database size={11} /> CACHE MATCHS ({total} / 6000)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {types.map(({ key, label }) => {
                const count = matchCache[key]?.length ?? 0;
                const pct = Math.min(100, Math.round((count / 2000) * 100));
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: "var(--muted)" }}>{label}</span>
                      <span style={{ color: count > 0 ? "var(--accent)" : "var(--muted)", fontWeight: 600 }}>
                        {count} / 2000
                      </span>
                    </div>
                    <div style={{ height: 4, background: "var(--hover)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: pct >= 100 ? "var(--green)" : "var(--accent)",
                        borderRadius: 2, transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Sync history ── */}
      {syncHistory.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
          <button onClick={() => setShowHistory(v => !v)} style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            width: "100%", textAlign: "left", marginBottom: showHistory ? 10 : 0,
          }}>
            <div style={{ ...sectionHeadStyle, justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={11} /> HISTORIQUE DE SYNC ({syncHistory.length})
              </span>
              <span style={{ fontSize: 10, color: "var(--muted)", transform: showHistory ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
            </div>
          </button>
          {showHistory && (
            <div style={{ maxHeight: 200, overflow: "auto" }}>
              {syncHistory.map((e, i) => <SyncEntryRow key={i} entry={e} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Backup / Restore ── */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 20 }}>
        <div style={sectionHeadStyle}><Download size={11} /> BACKUP LOCAL</div>
        <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>
          Exporte toutes tes données (sessions, tactics, profils, settings) dans un fichier JSON, ou restaure depuis un backup.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportBackup} style={{
            flex: 1, padding: "9px", background: "var(--hover)",
            border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--text)", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
          }}>
            <Download size={12} /> EXPORTER
          </button>
          <button onClick={() => importRef.current?.click()} style={{
            flex: 1, padding: "9px", background: "var(--hover)",
            border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--text)", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
          }}>
            <Upload size={12} /> IMPORTER
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ""; }} />
        </div>
      </div>

      {/* ── Discord webhook ── */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={sectionHeadStyle}>INTÉGRATION DISCORD</div>
        <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>
          Configure ton webhook Discord pour partager les résumés dans ton serveur.
        </p>
        <p style={{ fontSize: 10, color: "var(--border)", lineHeight: 1.5, marginBottom: 10 }}>
          Serveur Discord → Paramètres du salon → Intégrations → Webhooks
        </p>
        <label style={labelStyle}>URL DU WEBHOOK</label>
        <textarea value={webhookDraft} onChange={(e) => setWebhookDraft(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          rows={2}
          style={{ ...inputStyle, resize: "none", fontSize: 11, lineHeight: 1.5,
            fontFamily: "monospace", color: webhookDraft ? "var(--text)" : "var(--muted)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => { e.target.style.borderColor = "var(--border)"; saveWebhook(); }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={saveWebhook} style={{
            flex: 1, padding: "8px", background: "var(--hover)",
            border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--text)", fontSize: 12, cursor: "pointer",
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
          }}>ENREGISTRER</button>
          <button onClick={testWebhook} disabled={!webhookDraft.trim() || testing} style={{
            flex: 1, padding: "8px", background: "rgba(88,101,242,0.12)",
            border: "1px solid rgba(88,101,242,0.3)", borderRadius: 6,
            color: testing ? "var(--muted)" : "#5865f2", fontSize: 12,
            cursor: webhookDraft.trim() && !testing ? "pointer" : "default",
            opacity: webhookDraft.trim() && !testing ? 1 : 0.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
            transition: "all 0.15s",
          }}>
            <Send size={12} /> {testing ? "ENVOI…" : "TESTER"}
          </button>
        </div>
        {discordWebhook && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--green)" }}>
            <span>●</span> Webhook configuré
          </div>
        )}
      </div>
    </div>
  );
}
