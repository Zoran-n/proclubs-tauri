import { useRef, useState, useMemo } from "react";
import { Play, Square, Trophy, Trash2, Archive, Download, Crown, Target, Handshake, Send, Info, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useSession } from "../../hooks/useSession";
import { Badge } from "../ui/Badge";
import { ExportModal } from "../ui/ExportModal";
import type { Match, Session as SessionType } from "../../types";
import { generateSessionPdf } from "../../utils/pdfExport";
import { sendDiscordWebhook } from "../../api/discord";
import { useT } from "../../i18n";

function sessionWLD(matches: Match[], clubId: string) {
  let w = 0, l = 0, d = 0;
  for (const m of matches) {
    const r = (m.clubs[clubId] as Record<string, unknown> | undefined)?.["matchResult"] as string ?? "";
    if (r === "win") w++; else if (r === "loss") l++; else d++;
  }
  return { w, l, d };
}

function sessionKpis(matches: Match[], clubId: string) {
  let goals = 0, assists = 0, passes = 0, tackles = 0, motm = 0;
  for (const m of matches) {
    const clubPlayers = m.players[clubId] as Record<string, Record<string, unknown>> | undefined;
    if (!clubPlayers) continue;
    for (const p of Object.values(clubPlayers)) {
      goals   += Number(p["goals"]      ?? 0);
      assists += Number(p["assists"]    ?? 0);
      passes  += Number(p["passesMade"] ?? p["passesmade"] ?? 0);
      tackles += Number(p["tacklesMade"] ?? p["tacklesmade"] ?? 0);
      if (p["mom"] === "1" || p["manofthematch"] === "1") motm++;
    }
  }
  return { goals, assists, passes, tackles, motm };
}

interface PlayerMvp { name: string; goals: number; assists: number; motm: number; rating: number; games: number }

function sessionMvpStats(matches: Match[], clubId?: string) {
  const acc: Record<string, PlayerMvp> = {};
  for (const m of matches) {
    const clubIds = clubId ? [clubId] : Object.keys(m.players);
    for (const cid of clubIds) {
      const players = m.players[cid] as Record<string, Record<string, unknown>> | undefined;
      if (!players) continue;
      for (const [pid, p] of Object.entries(players)) {
        const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? pid);
        if (!acc[name]) acc[name] = { name, goals: 0, assists: 0, motm: 0, rating: 0, games: 0 };
        acc[name].goals   += Number(p["goals"] ?? 0);
        acc[name].assists += Number(p["assists"] ?? 0);
        acc[name].rating  += Number(p["rating"] ?? 0);
        acc[name].games   += 1;
        if (p["mom"] === "1" || p["manofthematch"] === "1") acc[name].motm++;
      }
    }
  }
  const all = Object.values(acc);
  const topScorer   = all.length > 0 ? all.reduce((a, b) => b.goals > a.goals ? b : a) : null;
  const topAssister = all.length > 0 ? all.reduce((a, b) => b.assists > a.assists ? b : a) : null;
  const topMotm     = all.length > 0 ? all.reduce((a, b) => b.motm > a.motm ? b : a) : null;
  return { topScorer, topAssister, topMotm, all };
}

function getMatchScore(m: Match, clubId: string) {
  const ourClub = m.clubs[clubId] as Record<string, unknown> | undefined;
  const ourGoals = Number(ourClub?.["goals"] ?? 0);
  const oppEntry = Object.entries(m.clubs).find(([id]) => id !== clubId);
  const oppGoals = Number((oppEntry?.[1] as Record<string, unknown>)?.["goals"] ?? 0);
  return { ourGoals, oppGoals };
}

const BTN: React.CSSProperties = {
  padding: "5px 9px", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 5, cursor: "pointer", color: "var(--muted)", fontSize: 11,
  display: "flex", alignItems: "center", gap: 4,
};

function KpiGrid({ kpis, t }: { kpis: ReturnType<typeof sessionKpis>; t: (key: string) => string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginTop: 10 }}>
      {[
        { label: t("players.goals"),   value: kpis.goals   },
        { label: t("players.assists"), value: kpis.assists },
        { label: t("players.passes"),  value: kpis.passes  },
        { label: t("players.tackles"), value: kpis.tackles },
        { label: t("session.motm"),    value: kpis.motm    },
      ].map(({ label, value }) => (
        <div key={label} style={{ textAlign: "center", background: "var(--bg)", borderRadius: 8,
          padding: "8px 4px", border: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--accent)", lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 3, letterSpacing: "0.06em" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export function SessionTab() {
  const t = useT();
  useSession();
  const { activeSession, sessions, currentClub, startSession, stopSession, persistSettings,
    deleteSession, archiveSession, discordWebhook, addToast } = useAppStore();
  const [showArchived, setShowArchived] = useState(false);
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<SessionType | null>(null);

  const shareToDiscord = async (s: SessionType) => {
    if (!discordWebhook) { addToast(t("discord.noWebhook"), "error"); return; }
    setSharingId(s.id);
    try {
      const kpis = sessionKpis(s.matches, s.clubId);
      const wld = sessionWLD(s.matches, s.clubId);
      const mvps = sessionMvpStats(s.matches, s.clubId);
      const color = wld.w > wld.l ? 0x23a559 : wld.l > wld.w ? 0xda373c : 0xfaa81a;
      const fields: { name: string; value: string; inline?: boolean }[] = [
        { name: "Bilan", value: `${wld.w}V · ${wld.d}N · ${wld.l}D`, inline: false },
        { name: "⚽ Buts", value: String(kpis.goals), inline: true },
        { name: "🅰️ Passes D.", value: String(kpis.assists), inline: true },
        { name: "★ MOTM", value: String(kpis.motm), inline: true },
      ];
      if (mvps.topScorer && mvps.topScorer.goals > 0)
        fields.push({ name: "🎯 Top buteur", value: `${mvps.topScorer.name} (${mvps.topScorer.goals} buts)`, inline: true });
      if (mvps.topAssister && mvps.topAssister.assists > 0)
        fields.push({ name: "🅰️ Top passeur", value: `${mvps.topAssister.name} (${mvps.topAssister.assists} passes)`, inline: true });
      await sendDiscordWebhook(discordWebhook, [{
        title: `🏆 Session — ${s.clubName}`,
        color,
        description: `📅 ${new Date(s.date).toLocaleDateString()} · ${s.matches.length} match${s.matches.length !== 1 ? "s" : ""}`,
        fields,
        footer: { text: "ProClubs Stats" },
      }]);
      addToast(t("discord.sent"), "success");
    } catch (e) { addToast(`Discord: ${String(e)}`, "error"); }
    finally { setSharingId(null); }
  };
  const [pdfPrompt, setPdfPrompt] = useState<SessionType | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const contentRef = useRef<HTMLDivElement>(null);

  const handleStop = () => {
    const session = useAppStore.getState().activeSession;
    stopSession();
    persistSettings();
    if (session && session.matches.length > 0) {
      setPdfPrompt(session);
    }
  };

  const allVisible = useMemo(
    () => sessions.filter((s) => showArchived ? s.archived : !s.archived),
    [sessions, showArchived],
  );
  const totalPages = Math.max(1, Math.ceil(allVisible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = useMemo(
    () => allVisible.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [allVisible, safePage],
  );
  const kpis = useMemo(
    () => activeSession ? sessionKpis(activeSession.matches, activeSession.clubId) : null,
    [activeSession],
  );
  const mvps = useMemo(
    () => activeSession && activeSession.matches.length > 0
      ? sessionMvpStats(activeSession.matches, activeSession.clubId) : null,
    [activeSession],
  );

  const csvHeaders = ["Date", "Club", t("players.gp"), t("players.goals"), t("players.assists"), t("players.passes"), t("players.tackles"), t("session.motm")];
  const csvRows = useMemo(() => allVisible.map((s) => {
    const k = sessionKpis(s.matches, s.clubId);
    return [new Date(s.date).toLocaleDateString(), s.clubName,
      s.matches.length, k.goals, k.assists, k.passes, k.tackles, k.motm];
  }), [allVisible]);
  const dateStr = new Date().toISOString().slice(0, 10);

  return (
    <div ref={contentRef} style={{ display: "flex", flexDirection: "column", height: "100%",
      overflowY: "auto", padding: 16, gap: 12 }}>

      {/* Active session */}
      {activeSession ? (
        <div style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--accent)",
                letterSpacing: "0.1em" }}>
                {activeSession.clubName}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {new Date(activeSession.date).toLocaleString()} · {activeSession.matches.length} match{activeSession.matches.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button onClick={handleStop} style={{ display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 7, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
              <Square size={12} /> {t("session.end")}
            </button>
          </div>
          {kpis && <KpiGrid kpis={kpis} t={t} />}
          {mvps && (mvps.topScorer || mvps.topAssister || mvps.topMotm) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 8 }}>
              {[
                { icon: <Target size={13} />, label: t("session.topScorer"), player: mvps.topScorer, stat: mvps.topScorer ? `${mvps.topScorer.goals} ${t("session.goalCount")}` : "" },
                { icon: <Handshake size={13} />, label: t("session.topAssist"), player: mvps.topAssister, stat: mvps.topAssister ? `${mvps.topAssister.assists} ${t("players.assists")}` : "" },
                { icon: <Crown size={13} />, label: t("session.motm"), player: mvps.topMotm, stat: mvps.topMotm ? `${mvps.topMotm.motm}x` : "" },
              ].map(({ icon, label, player, stat }) => player && (player.goals > 0 || player.assists > 0 || player.motm > 0) ? (
                <div key={label} style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px",
                  border: "1px solid var(--border)", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                    <span style={{ color: "var(--gold)" }}>{icon}</span>
                    <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{player.name}</div>
                  <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>{stat}</div>
                </div>
              ) : null)}
            </div>
          )}
          {activeSession.matches.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{t("session.matchesPlayed")}</div>
              {[...activeSession.matches].reverse().map((m) => {
                const clubData = currentClub ? (m.clubs[currentClub.id] as Record<string, unknown>) : null;
                const goals    = clubData?.["goals"] ?? "?";
                const result   = (clubData?.["matchResult"] as string) ?? "";
                const r        = result === "win" ? "W" : result === "loss" ? "L" : "D";
                return (
                  <div key={m.matchId} style={{ display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <Badge result={r} />
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{String(goals)} {t("session.goalCount")}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>{m.matchType}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : currentClub ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 32, gap: 10, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <Trophy size={36} style={{ color: "var(--muted)" }} />
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>{t("session.noActive")}</p>
          <button onClick={() => startSession(currentClub)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
            background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)",
            borderRadius: 8, color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
            <Play size={14} /> {t("session.startBtn")}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1,
          color: "var(--muted)", fontSize: 13 }}>
          {t("session.loadClubFirst")}
        </div>
      )}

      {/* Past sessions header */}
      {sessions.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", flex: 1 }}>
              {t("session.pastSessions")} {allVisible.length > 0 ? `(${allVisible.length})` : ""}
            </span>
            <button onClick={() => { setShowArchived((v) => !v); setPage(0); }} style={{ ...BTN }}>
              <Archive size={11} /> {showArchived ? t("session.activeLabel") : t("session.archivedLabel")}
            </button>
            <button onClick={() => setExportModal("png")} style={{ ...BTN }}>
              <Download size={11} /> PNG
            </button>
            <button onClick={() => setExportModal("csv")} style={{ ...BTN }}>
              <Download size={11} /> CSV
            </button>
          </div>

          {allVisible.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, padding: 16 }}>
              {showArchived ? t("session.noArchived") : t("session.noSessions")}
            </div>
          )}

          {visible.map((s) => {
            const k = sessionKpis(s.matches, s.clubId);
            const wld = sessionWLD(s.matches, s.clubId);
            return (
              <div key={s.id} style={{ background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "var(--text)",
                      letterSpacing: "0.06em" }}>{s.clubName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span>{new Date(s.date).toLocaleDateString()} · {s.matches.length} match{s.matches.length !== 1 ? "s" : ""}</span>
                      <span style={{ color: "#23a559", fontWeight: 600 }}>{wld.w}V</span>
                      <span style={{ color: "var(--muted)" }}>{wld.d}N</span>
                      <span style={{ color: "#da373c", fontWeight: 600 }}>{wld.l}D</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => setDetailSession(s)} title={t("session.details")}
                      style={{ ...BTN, color: "var(--accent)" }}>
                      <Info size={11} />
                    </button>
                    {discordWebhook && (
                      <button onClick={() => shareToDiscord(s)} title={t("discord.share")}
                        disabled={sharingId === s.id}
                        style={{ ...BTN, color: "var(--accent)", opacity: sharingId === s.id ? 0.5 : 1 }}>
                        <Send size={11} />
                      </button>
                    )}
                    <button onClick={() => { archiveSession(s.id); persistSettings(); }}
                      title={s.archived ? t("session.unarchive") : t("session.archive")}
                      style={{ ...BTN, color: (s.archived ? "var(--accent)" : "var(--muted)") as string }}>
                      <Archive size={11} />
                    </button>
                    <button onClick={() => { deleteSession(s.id); persistSettings(); }} title={t("misc.delete")}
                      style={{ ...BTN }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, textAlign: "center" }}>
                  {[
                    { l: t("players.gp"),      v: s.matches.length },
                    { l: t("players.goals"),   v: k.goals          },
                    { l: t("players.assists"), v: k.assists        },
                    { l: t("players.passes"),  v: k.passes         },
                    { l: t("session.motm"),    v: k.motm           },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "var(--accent)" }}>{v}</div>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 0" }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}
                style={{ ...BTN, opacity: safePage === 0 ? 0.4 : 1, cursor: safePage === 0 ? "default" : "pointer" }}>
                {"‹ " + t("session.prev")}
              </button>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {safePage + 1} / {totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
                style={{ ...BTN, opacity: safePage >= totalPages - 1 ? 0.4 : 1, cursor: safePage >= totalPages - 1 ? "default" : "pointer" }}>
                {t("session.next") + " ›"}
              </button>
            </div>
          )}
        </>
      )}

      {exportModal === "png" && (
        <ExportModal type="png" pngSourceEl={contentRef.current}
          defaultFilename={`session-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
      {exportModal === "csv" && (
        <ExportModal type="csv" csvHeaders={csvHeaders} csvRows={csvRows}
          defaultFilename={`sessions-${dateStr}`} onClose={() => setExportModal(null)} />
      )}

      {/* Session detail modal */}
      {detailSession && (() => {
        const s = detailSession;
        const kpis = sessionKpis(s.matches, s.clubId);
        const wld = sessionWLD(s.matches, s.clubId);
        const mvps = sessionMvpStats(s.matches, s.clubId);
        const bilColor = wld.w > wld.l ? "#23a559" : wld.l > wld.w ? "#da373c" : "#faa81a";
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center",
            justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setDetailSession(null)}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
              width: 540, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--accent)",
                    letterSpacing: "0.1em" }}>{s.clubName}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                    {new Date(s.date).toLocaleDateString()} · {s.matches.length} match{s.matches.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <button onClick={() => setDetailSession(null)} style={{ background: "none", border: "none",
                  cursor: "pointer", color: "var(--muted)", padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Bilan + KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 14px",
                    border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em",
                      fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{t("session.bilan")}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#23a559" }}>{wld.w}V</span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--muted)" }}>{wld.d}N</span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#da373c" }}>{wld.l}D</span>
                      <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
                        background: bilColor, display: "inline-block" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {[
                      { label: "⚽", value: kpis.goals },
                      { label: "🅰️", value: kpis.assists },
                      { label: "★", value: kpis.motm },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 4px",
                        border: "1px solid var(--border)", textAlign: "center" }}>
                        <div style={{ fontSize: 16 }}>{label}</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--accent)" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match list */}
                <div>
                  <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                    fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{t("session.matchDetail")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[...s.matches].reverse().map((m, i) => {
                      const { ourGoals, oppGoals } = getMatchScore(m, s.clubId);
                      const result = (m.clubs[s.clubId] as Record<string, unknown>)?.["matchResult"] as string ?? "";
                      const r = result === "win" ? "W" : result === "loss" ? "L" : "D";
                      const ts = Number(m.timestamp) * 1000;
                      return (
                        <div key={m.matchId ?? i} style={{ display: "flex", alignItems: "center", gap: 8,
                          padding: "7px 10px", background: "var(--bg)", borderRadius: 6,
                          border: "1px solid var(--border)" }}>
                          <Badge result={r} />
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17,
                            color: "var(--text)", letterSpacing: "0.05em" }}>
                            {ourGoals} – {oppGoals}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>
                            {m.matchType}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>
                            {ts ? new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Player stats */}
                {mvps.all.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                      fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{t("session.playerStats")}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ color: "var(--muted)", fontSize: 10 }}>
                          <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 500 }}>Joueur</th>
                          <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: 500 }}>MJ</th>
                          <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: 500 }}>⚽</th>
                          <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: 500 }}>🅰️</th>
                          <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: 500 }}>★</th>
                          <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: 500 }}>{t("session.avgRating")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...mvps.all]
                          .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
                          .map((p) => (
                            <tr key={p.name} style={{ borderTop: "1px solid var(--border)" }}>
                              <td style={{ padding: "5px 6px", color: "var(--text)", fontWeight: 500 }}>{p.name}</td>
                              <td style={{ padding: "5px 6px", textAlign: "center", color: "var(--muted)" }}>{p.games}</td>
                              <td style={{ padding: "5px 6px", textAlign: "center", color: p.goals > 0 ? "var(--accent)" : "var(--muted)" }}>{p.goals}</td>
                              <td style={{ padding: "5px 6px", textAlign: "center", color: p.assists > 0 ? "var(--accent)" : "var(--muted)" }}>{p.assists}</td>
                              <td style={{ padding: "5px 6px", textAlign: "center", color: p.motm > 0 ? "var(--gold)" : "var(--muted)" }}>{p.motm || "–"}</td>
                              <td style={{ padding: "5px 6px", textAlign: "center", color: "var(--muted)" }}>
                                {p.games > 0 ? (p.rating / p.games).toFixed(1) : "–"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)",
                justifyContent: "flex-end" }}>
                {discordWebhook && (
                  <button onClick={() => { shareToDiscord(s); }}
                    disabled={sharingId === s.id}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                      background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.35)",
                      borderRadius: 7, color: "#8b9cf4", fontSize: 12, cursor: "pointer",
                      opacity: sharingId === s.id ? 0.5 : 1 }}>
                    <Send size={13} /> Discord
                  </button>
                )}
                <button onClick={() => { generateSessionPdf(s); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                    background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)",
                    borderRadius: 7, color: "var(--accent)", fontSize: 12, cursor: "pointer" }}>
                  <Download size={13} /> PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PDF export prompt after session stop */}
      {pdfPrompt && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }} onClick={() => setPdfPrompt(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 24, width: 340, textAlign: "center",
          }}>
            <Download size={28} style={{ color: "var(--accent)", marginBottom: 8 }} />
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--text)",
              letterSpacing: "0.06em", marginBottom: 4 }}>
              {t("session.ended")}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              {pdfPrompt.matches.length} match{pdfPrompt.matches.length !== 1 ? "s" : ""} — {t("session.pdfQuestion")}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => { generateSessionPdf(pdfPrompt); setPdfPrompt(null); }}
                style={{
                  padding: "8px 18px", background: "rgba(0,212,255,0.15)",
                  border: "1px solid rgba(0,212,255,0.3)", borderRadius: 8,
                  color: "var(--accent)", fontSize: 13, cursor: "pointer", fontWeight: 600,
                }}>
                {t("session.exportPdfBtn")}
              </button>
              <button onClick={() => setPdfPrompt(null)}
                style={{
                  padding: "8px 18px", background: "var(--hover)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  color: "var(--muted)", fontSize: 13, cursor: "pointer",
                }}>
                {t("session.noThanks")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
