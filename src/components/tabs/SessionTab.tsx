import { useRef, useState } from "react";
import { Play, Square, Trophy, Trash2, Archive, Download, Crown, Target, Handshake } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useSession } from "../../hooks/useSession";
import { Badge } from "../ui/Badge";
import { ExportModal } from "../ui/ExportModal";
import type { Match, Session as SessionType } from "../../types";
import { generateSessionPdf } from "../../utils/pdfExport";
import { useT } from "../../i18n";

function sessionKpis(matches: Match[]) {
  let goals = 0, assists = 0, passes = 0, tackles = 0, motm = 0;
  for (const m of matches) {
    for (const clubPlayers of Object.values(m.players)) {
      for (const p of Object.values(clubPlayers as Record<string, Record<string, unknown>>)) {
        goals   += Number(p["goals"]      ?? 0);
        assists += Number(p["assists"]    ?? 0);
        passes  += Number(p["passesMade"] ?? p["passesmade"] ?? 0);
        tackles += Number(p["tacklesMade"] ?? p["tacklesmade"] ?? 0);
        if (p["mom"] === "1" || p["manofthematch"] === "1") motm++;
      }
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
    deleteSession, archiveSession } = useAppStore();
  const [showArchived, setShowArchived] = useState(false);
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
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

  const allVisible = sessions.filter((s) => showArchived ? s.archived : !s.archived);
  const totalPages = Math.max(1, Math.ceil(allVisible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = allVisible.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const kpis    = activeSession ? sessionKpis(activeSession.matches) : null;
  const mvps    = activeSession && activeSession.matches.length > 0
    ? sessionMvpStats(activeSession.matches, activeSession.clubId) : null;

  const csvHeaders = ["Date", "Club", t("players.gp"), t("players.goals"), t("players.assists"), t("players.passes"), t("players.tackles"), t("session.motm")];
  const csvRows = allVisible.map((s) => {
    const k = sessionKpis(s.matches);
    return [new Date(s.date).toLocaleDateString(), s.clubName,
      s.matches.length, k.goals, k.assists, k.passes, k.tackles, k.motm];
  });
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
            const k = sessionKpis(s.matches);
            return (
              <div key={s.id} style={{ background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "var(--text)",
                      letterSpacing: "0.06em" }}>{s.clubName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {new Date(s.date).toLocaleDateString()} · {s.matches.length} match{s.matches.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
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
