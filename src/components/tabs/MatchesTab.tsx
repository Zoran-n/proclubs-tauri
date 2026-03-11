import { useState, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { getMatches } from "../../api/tauri";
import type { Match } from "../../types";

const TYPES = [
  { value: "leagueMatch",   label: "CHAMPIONNAT", icon: "⚽" },
  { value: "playoffMatch",  label: "PLAYOFF",     icon: "🏆" },
  { value: "friendlyMatch", label: "AMICAL",      icon: "🤝" },
] as const;

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
  W: { text: "VICTOIRE", color: "var(--green)" },
  D: { text: "NUL",      color: "#eab308" },
  L: { text: "DEFAITE",  color: "var(--red)" },
};

function formatDate(ts: string | number) {
  const n = Number(ts) * 1000 || Number(ts);
  const d = new Date(isNaN(n) ? ts : n);
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDuration(secs?: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}min ${s}s`;
}

export function MatchesTab() {
  const { currentClub, matches: leagueCache } = useAppStore();
  const [type, setType] = useState<"leagueMatch" | "playoffMatch" | "friendlyMatch">("leagueMatch");
  const [cache, setCache] = useState<Partial<Record<string, Match[]>>>({ leagueMatch: leagueCache });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);

  useEffect(() => { setCache((c) => ({ ...c, leagueMatch: leagueCache })); }, [leagueCache]);

  useEffect(() => {
    if (!currentClub || cache[type]) return;
    setLoading(true);
    getMatches(currentClub.id, currentClub.platform, type)
      .then((data) => setCache((c) => ({ ...c, [type]: data })))
      .finally(() => setLoading(false));
  }, [type, currentClub]);

  const list = cache[type] ?? [];

  const getResult = (m: Match): "W" | "D" | "L" => {
    const c = m.clubs[currentClub?.id ?? ""] as Record<string, unknown> | undefined;
    if (c?.["wins"] === "1") return "W";
    if (c?.["losses"] === "1") return "L";
    return "D";
  };

  const getScore = (m: Match) => {
    const myId = currentClub?.id ?? "";
    const my  = m.clubs[myId] as Record<string, unknown> | undefined;
    const opp = Object.entries(m.clubs).find(([k]) => k !== myId)?.[1] as Record<string, unknown> | undefined;
    return `${my?.["goals"] ?? "?"}-${opp?.["goals"] ?? "?"}`;
  };

  const getOppName = (m: Match) => {
    const myId = currentClub?.id ?? "";
    const opp = Object.entries(m.clubs).find(([k]) => k !== myId)?.[1] as Record<string, unknown> | undefined;
    const det = opp?.["details"] as Record<string, unknown> | undefined;
    return String(det?.["name"] ?? opp?.["name"] ?? "Adversaire");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" }}>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", flexShrink: 0 }}>
        {TYPES.map((t) => {
          const active = type === t.value;
          return (
            <button key={t.value} onClick={() => setType(t.value)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              background: active ? "rgba(0,212,255,0.08)" : "transparent",
              color: active ? "var(--accent)" : "var(--muted)",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 1,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
        {loading && <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center", marginLeft: 4 }}>Chargement…</span>}
      </div>

      {/* Match list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, padding: "0 16px 16px" }}>
        {!loading && list.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Aucun match</div>
        )}
        {list.map((m) => {
          const res = getResult(m);
          const rl  = RESULT_LABEL[res];
          return (
            <div key={m.matchId} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "14px 18px",
              background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
            }}>
              {/* Score */}
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 26,
                color: "#eab308", minWidth: 56, flexShrink: 0, letterSpacing: 1,
              }}>
                {getScore(m)}
              </span>

              {/* Opponent + date */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  vs {getOppName(m)}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {formatDate(m.timestamp)}
                </div>
              </div>

              {/* Result label */}
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 14,
                color: rl.color, letterSpacing: 1, minWidth: 72, textAlign: "center",
              }}>
                {rl.text}
              </span>

              {/* Détails button */}
              <button onClick={() => setSelected(m)} style={{
                background: "none", border: "none", color: "var(--muted)",
                fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", padding: "4px 8px",
                borderRadius: 4,
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                ▶ détails
              </button>
            </div>
          );
        })}
      </div>

      {selected && (
        <MatchModal match={selected} clubId={currentClub?.id ?? ""} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function MatchModal({ match, clubId, onClose }: { match: Match; clubId: string; onClose: () => void }) {
  const myData  = match.clubs[clubId] as Record<string, unknown> | undefined;
  const oppEntry = Object.entries(match.clubs).find(([k]) => k !== clubId);
  const oppData  = oppEntry?.[1] as Record<string, unknown> | undefined;
  const oppDet   = oppData?.["details"] as Record<string, unknown> | undefined;
  const oppName  = String(oppDet?.["name"] ?? oppData?.["name"] ?? "Adversaire");

  const myPlayers = Object.entries(
    (match.players[clubId] ?? {}) as Record<string, Record<string, unknown>>
  ).map(([, p]) => ({
    name:    String(p["name"] ?? p["playername"] ?? "—"),
    goals:   Number(p["goals"]   ?? 0),
    assists: Number(p["assists"] ?? 0),
    passes:  Number(p["passesMade"] ?? p["passesmade"] ?? 0),
    rating:  Number(p["rating"]  ?? p["ratingAve"] ?? 0),
    motm:    p["mom"] === "1" || p["manofthematch"] === "1",
  })).sort((a, b) => b.rating - a.rating);

  const myGoals  = String(myData?.["goals"]  ?? "?");
  const oppGoals = String(oppData?.["goals"] ?? "?");
  const res = myData?.["wins"] === "1" ? "W" : myData?.["losses"] === "1" ? "L" : "D";
  const rl  = RESULT_LABEL[res];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 580, maxHeight: "82vh", overflowY: "auto", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#eab308", letterSpacing: 2 }}>
              {myGoals} — {oppGoals}
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 2 }}>vs {oppName}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {formatDate(match.timestamp)}
              {match.matchDuration ? ` · ${formatDuration(match.matchDuration)}` : ""}
              <span style={{ color: rl.color, fontFamily: "'Bebas Neue', sans-serif", marginLeft: 10, letterSpacing: 1 }}>{rl.text}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Players table */}
        {myPlayers.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Joueur", "Note", "Buts", "PD", "Passes", "MOTM"].map((h) => (
                  <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myPlayers.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.name}</td>
                  <td style={{ padding: "6px 8px", fontWeight: "bold", color: p.rating >= 7.5 ? "var(--green)" : p.rating >= 6 ? "#eab308" : "var(--red)" }}>{p.rating.toFixed(1)}</td>
                  <td style={{ padding: "6px 8px", color: "var(--accent)" }}>{p.goals || "—"}</td>
                  <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.assists || "—"}</td>
                  <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.passes}</td>
                  <td style={{ padding: "6px 8px", color: "#ffd700" }}>{p.motm ? "★" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {myPlayers.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 16 }}>Pas de stats joueurs</p>
        )}
      </div>
    </div>
  );
}
