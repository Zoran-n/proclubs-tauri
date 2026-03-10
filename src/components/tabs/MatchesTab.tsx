import { useState, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { getMatches } from "../../api/tauri";
import type { Match } from "../../types";

const TYPES = [
  { value: "leagueMatch", label: "⚽ Championnat" },
  { value: "playoffMatch", label: "🏆 Playoff" },
  { value: "friendlyMatch", label: "🤝 Amical" },
] as const;

function formatDuration(secs?: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}min ${s}s`;
}

function formatDate(ts: string) {
  const n = Number(ts) * 1000 || Number(ts);
  const d = new Date(isNaN(n) ? ts : n);
  return isNaN(d.getTime()) ? ts : d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
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
    const r = c?.["matchResult"] as string | undefined;
    if (r === "win" || c?.["wins"] === "1") return "W";
    if (r === "loss" || c?.["losses"] === "1") return "L";
    return "D";
  };

  const getScore = (m: Match) => {
    const myId = currentClub?.id ?? "";
    const my = m.clubs[myId] as Record<string, unknown> | undefined;
    const opp = Object.entries(m.clubs).find(([k]) => k !== myId)?.[1] as Record<string, unknown> | undefined;
    return `${my?.["goals"] ?? "?"} - ${opp?.["goals"] ?? "?"}`;
  };

  const getOppName = (m: Match) => {
    const myId = currentClub?.id ?? "";
    const opp = Object.entries(m.clubs).find(([k]) => k !== myId)?.[1] as Record<string, unknown> | undefined;
    const det = opp?.["details"] as Record<string, unknown> | undefined;
    return String(det?.["name"] ?? opp?.["name"] ?? "Adversaire");
  };

  const RC: Record<string, string> = { W: "var(--green)", D: "#eab308", L: "var(--red)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", gap: 6, padding: "8px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {TYPES.map((t) => (
          <button key={t.value} onClick={() => setType(t.value)}
            style={{ padding: "5px 12px", background: type === t.value ? "rgba(0,212,255,0.15)" : "transparent", color: type === t.value ? "var(--accent)" : "var(--muted)", border: `1px solid ${type === t.value ? "var(--accent)" : "var(--border)"}`, borderRadius: 4, fontSize: 12, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
        {loading && <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>Chargement…</span>}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {list.map((m) => {
          const res = getResult(m);
          return (
            <div key={m.matchId} onClick={() => setSelected(m)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span style={{ width: 26, height: 26, borderRadius: 4, background: `${RC[res]}22`, color: RC[res], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", fontFamily: "'Bebas Neue', sans-serif", flexShrink: 0 }}>{res}</span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: RC[res], minWidth: 50 }}>{getScore(m)}</span>
              <span style={{ flex: 1, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getOppName(m)}</span>
              <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{formatDate(m.timestamp)}</span>
            </div>
          );
        })}
        {!loading && list.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Aucun match</div>}
      </div>
      {selected && <MatchModal match={selected} clubId={currentClub?.id ?? ""} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MatchModal({ match, clubId, onClose }: { match: Match; clubId: string; onClose: () => void }) {
  const myData = match.clubs[clubId] as Record<string, unknown> | undefined;
  const oppEntry = Object.entries(match.clubs).find(([k]) => k !== clubId);
  const oppData = oppEntry?.[1] as Record<string, unknown> | undefined;

  const allPlayers = Object.values(match.players).flatMap((cp) =>
    Object.values(cp as Record<string, Record<string, unknown>>).map((p) => ({
      name: String(p["name"] ?? p["playername"] ?? "—"),
      goals: Number(p["goals"] ?? 0),
      assists: Number(p["assists"] ?? 0),
      passes: Number(p["passesMade"] ?? p["passesmade"] ?? 0),
      rating: Number(p["rating"] ?? p["ratingAve"] ?? 0),
      motm: p["mom"] === "1" || p["manofthematch"] === "1",
    }))
  ).sort((a, b) => b.rating - a.rating);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 560, maxHeight: "80vh", overflowY: "auto", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "var(--text)" }}>
              {String(myData?.["goals"] ?? "?")} — {String(oppData?.["goals"] ?? "?")}
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>
              {formatDate(match.timestamp)} {match.matchDuration ? `· ${formatDuration(match.matchDuration)}` : ""} · {match.matchType}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        {allPlayers.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Joueur", "Note", "Buts", "PD", "Passes", "MOTM"].map((h) => (
                  <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPlayers.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "5px 8px", color: "var(--text)" }}>{p.name}</td>
                  <td style={{ padding: "5px 8px", color: p.rating >= 7.5 ? "var(--green)" : p.rating >= 6 ? "#eab308" : "var(--red)", fontWeight: "bold" }}>{p.rating.toFixed(1)}</td>
                  <td style={{ padding: "5px 8px", color: "var(--accent)" }}>{p.goals}</td>
                  <td style={{ padding: "5px 8px", color: "var(--text)" }}>{p.assists}</td>
                  <td style={{ padding: "5px 8px", color: "var(--text)" }}>{p.passes}</td>
                  <td style={{ padding: "5px 8px", color: "#ffd700" }}>{p.motm ? "★" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
