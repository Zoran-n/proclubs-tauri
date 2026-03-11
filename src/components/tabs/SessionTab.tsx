import { useRef, useState } from "react";
import { Play, Square, Trophy, Trash2, Archive, Download } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useSession } from "../../hooks/useSession";
import { Badge } from "../ui/Badge";
import { exportCsv, exportPng } from "../../utils/export";
import type { Match, Session } from "../../types";

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

const BTN: React.CSSProperties = {
  padding: "5px 9px",
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  cursor: "pointer",
  color: "var(--muted)",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

function KpiGrid({ kpis }: { kpis: ReturnType<typeof sessionKpis> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginTop: 10 }}>
      {[
        { label: "Buts",   value: kpis.goals   },
        { label: "PD",     value: kpis.assists },
        { label: "Passes", value: kpis.passes  },
        { label: "Tacles", value: kpis.tackles },
        { label: "MOTM",   value: kpis.motm    },
      ].map(({ label, value }) => (
        <div key={label} style={{ textAlign: "center", background: "var(--bg)", borderRadius: 8, padding: "8px 4px",
          border: "1px solid var(--border)" }}>
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
  useSession();
  const { activeSession, sessions, currentClub, startSession, stopSession, persistSettings,
    deleteSession, archiveSession } = useAppStore();
  const [showArchived, setShowArchived] = useState(false);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleStop = () => { stopSession(); persistSettings(); };

  const handlePng = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    await exportPng(contentRef.current, `session-${new Date().toISOString().slice(0, 10)}`).finally(() => setExporting(false));
  };

  const handleCsv = (sessList: Session[]) => {
    const headers = ["Date", "Club", "MJ", "Buts", "PD", "Passes", "Tacles", "MOTM"];
    const rows = sessList.map((s) => {
      const k = sessionKpis(s.matches);
      return [new Date(s.date).toLocaleDateString(), s.clubName,
        s.matches.length, k.goals, k.assists, k.passes, k.tackles, k.motm];
    });
    exportCsv(headers, rows, `sessions-${new Date().toISOString().slice(0, 10)}`);
  };

  const visible = sessions.filter((s) => showArchived ? s.archived : !s.archived);
  const kpis    = activeSession ? sessionKpis(activeSession.matches) : null;

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
              <Square size={12} /> Terminer
            </button>
          </div>
          {kpis && <KpiGrid kpis={kpis} />}

          {/* Matches in session */}
          {activeSession.matches.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>MATCHS JOUÉS</div>
              {[...activeSession.matches].reverse().map((m) => {
                const clubData = currentClub ? (m.clubs[currentClub.id] as Record<string, unknown>) : null;
                const goals    = clubData?.["goals"] ?? "?";
                const result   = (clubData?.["matchResult"] as string) ?? "";
                const r        = result === "win" ? "W" : result === "loss" ? "L" : "D";
                return (
                  <div key={m.matchId} style={{ display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <Badge result={r} />
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{String(goals)} but(s)</span>
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
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Aucune session active</p>
          <button onClick={() => startSession(currentClub)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", background: "rgba(0,212,255,0.12)",
            border: "1px solid rgba(0,212,255,0.3)", borderRadius: 8,
            color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
            <Play size={14} /> Démarrer
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1,
          color: "var(--muted)", fontSize: 13 }}>
          Charge un club d'abord
        </div>
      )}

      {/* Past sessions header */}
      {(sessions.length > 0) && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", flex: 1 }}>
              SESSIONS PASSÉES {visible.length > 0 ? `(${visible.length})` : ""}
            </span>
            <button onClick={() => setShowArchived((v) => !v)} style={{ ...BTN }}>
              <Archive size={11} /> {showArchived ? "Actives" : "Archivées"}
            </button>
            <button onClick={handlePng} disabled={exporting} style={{ ...BTN }}>
              <Download size={11} /> PNG
            </button>
            <button onClick={() => handleCsv(visible)} style={{ ...BTN }}>
              <Download size={11} /> CSV
            </button>
          </div>

          {visible.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, padding: 16 }}>
              {showArchived ? "Aucune session archivée" : "Aucune session"}
            </div>
          )}

          {visible.map((s) => {
            const k = sessionKpis(s.matches);
            return (
              <div key={s.id} style={{ background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 14, position: "relative" }}>

                {/* Session header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "var(--text)",
                      letterSpacing: "0.06em" }}>
                      {s.clubName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {new Date(s.date).toLocaleDateString()} · {s.matches.length} match{s.matches.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => { archiveSession(s.id); persistSettings(); }}
                      title={s.archived ? "Désarchiver" : "Archiver"}
                      style={{ ...BTN, color: s.archived ? "var(--accent)" : "var(--muted)" as string }}>
                      <Archive size={11} />
                    </button>
                    <button onClick={() => { deleteSession(s.id); persistSettings(); }}
                      title="Supprimer"
                      style={{ ...BTN }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, textAlign: "center" }}>
                  {[
                    { l: "MJ",     v: s.matches.length },
                    { l: "Buts",   v: k.goals          },
                    { l: "PD",     v: k.assists        },
                    { l: "Passes", v: k.passes         },
                    { l: "MOTM",   v: k.motm           },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
                        color: "var(--accent)" }}>{v}</div>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
