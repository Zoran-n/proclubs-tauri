import { useState } from "react";
import { Send } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useT } from "../../i18n";
import type { Match } from "../../types";
import { sendDiscordWebhook } from "../../api/discord";

export function formatDate(ts: string | number, locale: string) {
  const n = Number(ts) * 1000 || Number(ts);
  const d = new Date(isNaN(n) ? ts : n);
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDuration(secs?: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}min ${s}s`;
}

/* ─── Team stats helpers ─── */

interface TeamStat { label: string; my: string | number; opp: string | number }

export function extractTeamStats(match: Match, clubId: string, t: (key: string) => string): TeamStat[] {
  const myData  = match.clubs[clubId] as Record<string, unknown> | undefined;
  const oppEntry = Object.entries(match.clubs).find(([k]) => k !== clubId);
  const oppData = oppEntry?.[1] as Record<string, unknown> | undefined;
  if (!myData || !oppData) return [];

  const statKeys: [string, string][] = [
    ["possession", t("matches.possession")],
    ["shots", t("matches.shots")],
    ["shotsOnTarget", t("matches.shotsOnTarget")],
    ["corners", t("matches.corners")],
    ["passesAttempted", t("matches.passesAttempted")],
    ["passesCompleted", t("matches.passesCompleted")],
    ["fouls", t("players.fouls")],
    ["offsides", t("matches.offsides")],
    ["tackles", t("players.tackles")],
  ];

  const stats: TeamStat[] = [];
  for (const [key, label] of statKeys) {
    // EA API uses various casings
    const myVal  = myData[key]  ?? myData[key.toLowerCase()];
    const oppVal = oppData[key] ?? oppData[key.toLowerCase()];
    if (myVal !== undefined || oppVal !== undefined) {
      const fmt = (v: unknown) => {
        if (v === undefined || v === null) return "—";
        if (key === "possession") return `${v}%`;
        return String(v);
      };
      stats.push({ label, my: fmt(myVal), opp: fmt(oppVal) });
    }
  }
  return stats;
}

/* ─── Match events (recap) ─── */

interface MatchEvent { type: "goal" | "assist" | "card" | "motm"; player: string; detail?: string }

export function extractMatchEvents(match: Match, clubId: string): MatchEvent[] {
  const clubPlayers = match.players[clubId] as Record<string, Record<string, unknown>> | undefined;
  if (!clubPlayers) return [];

  const events: MatchEvent[] = [];
  for (const p of Object.values(clubPlayers)) {
    const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? "—");
    const goals = Number(p["goals"] ?? 0);
    for (let i = 0; i < goals; i++) events.push({ type: "goal", player: name });
    const assists = Number(p["assists"] ?? 0);
    for (let i = 0; i < assists; i++) events.push({ type: "assist", player: name });
    const yc = Number(p["yellowCards"] ?? p["yellowcards"] ?? 0);
    const rc = Number(p["redCards"] ?? p["redcards"] ?? 0);
    if (yc > 0) events.push({ type: "card", player: name, detail: `🟨 ${yc}` });
    if (rc > 0) events.push({ type: "card", player: name, detail: `🟥 ${rc}` });
    if (p["mom"] === "1" || p["manofthematch"] === "1") events.push({ type: "motm", player: name });
  }
  // Sort: goals first, then assists, cards, motm
  const order = { goal: 0, assist: 1, card: 2, motm: 3 };
  events.sort((a, b) => order[a.type] - order[b.type]);
  return events;
}

export function MatchModal({ match, clubId, onClose }: { match: Match; clubId: string; onClose: () => void }) {
  const t = useT();
  const lang = useAppStore((s) => s.language);
  const discordWebhook = useAppStore((s) => s.discordWebhook);
  const addToast = useAppStore((s) => s.addToast);
  const [sharing, setSharing] = useState(false);
  const locale = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : lang === "pt" ? "pt-BR" : "en-US";

  const myData   = match.clubs[clubId] as Record<string, unknown> | undefined;
  const oppEntry = Object.entries(match.clubs).find(([k]) => k !== clubId);
  const oppData  = oppEntry?.[1] as Record<string, unknown> | undefined;
  const oppDet   = oppData?.["details"] as Record<string, unknown> | undefined;
  const oppName  = String(oppDet?.["name"] ?? oppData?.["name"] ?? t("matches.opponent"));

  const myPlayers = Object.entries(
    (match.players[clubId] ?? {}) as Record<string, Record<string, unknown>>
  ).map(([, p]) => ({
    name:          String(p["name"] ?? p["playername"] ?? "—"),
    goals:         Number(p["goals"]   ?? 0),
    assists:       Number(p["assists"] ?? 0),
    passes:        Number(p["passesMade"] ?? p["passesmade"] ?? 0),
    tackles:       Number(p["tacklesMade"] ?? p["tacklesmade"] ?? 0),
    interceptions: Number(p["interceptions"] ?? 0),
    fouls:         Number(p["foulsCommited"] ?? p["foulscommited"] ?? 0),
    yellowCards:   Number(p["yellowCards"] ?? p["yellowcards"] ?? 0),
    redCards:      Number(p["redCards"] ?? p["redcards"] ?? 0),
    rating:        Number(p["rating"] ?? p["ratingAve"] ?? 0),
    motm:          p["mom"] === "1" || p["manofthematch"] === "1",
  })).sort((a, b) => b.rating - a.rating);

  const myGoals  = String(myData?.["goals"]  ?? "?");
  const oppGoals = String(oppData?.["goals"] ?? "?");
  const res = myData?.["wins"] === "1" ? "W" : myData?.["losses"] === "1" ? "L" : "D";

  const RESULT_LABEL: Record<string, { text: string; color: string }> = {
    W: { text: t("match.win"),  color: "var(--green)" },
    D: { text: t("match.draw"), color: "#eab308" },
    L: { text: t("match.loss"), color: "var(--red)" },
  };

  const rl  = RESULT_LABEL[res];

  const hasInterceptions = myPlayers.some((p) => p.interceptions > 0);
  const hasTackles       = myPlayers.some((p) => p.tackles > 0);
  const hasFouls         = myPlayers.some((p) => p.fouls > 0);
  const hasCards         = myPlayers.some((p) => p.yellowCards > 0 || p.redCards > 0);

  const teamStats = extractTeamStats(match, clubId, t);
  const events = extractMatchEvents(match, clubId);

  const shareToDiscord = async () => {
    if (!discordWebhook) { addToast(t("discord.noWebhook"), "error"); return; }
    setSharing(true);
    try {
      const color = res === "W" ? 0x23a559 : res === "L" ? 0xda373c : 0xfaa81a;

      // Events line (like the badges in the modal)
      const eventsLine = events.map((ev) => {
        if (ev.type === "goal")   return `⚽ ${ev.player}`;
        if (ev.type === "assist") return `🅰️ ${ev.player}`;
        if (ev.type === "motm")   return `★ ${ev.player}`;
        if (ev.type === "card")   return `${ev.detail} ${ev.player}`;
        return "";
      }).filter(Boolean).join("  ·  ");

      // Player table as a code block
      const showTackles = myPlayers.some((p) => p.tackles > 0);
      const showInterceptions = myPlayers.some((p) => p.interceptions > 0);
      const col = (s: string, w: number) => s.padEnd(w).slice(0, w);
      const header = [
        col("Joueur", 14),
        col("Note", 5),
        col("Buts", 5),
        col("PD", 4),
        col("Passes", 7),
        ...(showTackles ? [col("Tack.", 6)] : []),
        ...(showInterceptions ? [col("Int.", 5)] : []),
        "MOTM",
      ].join(" ");
      const divider = "-".repeat(header.length);
      const rows = myPlayers.map((p) => [
        col(p.name, 14),
        col(p.rating > 0 ? p.rating.toFixed(1) : "—", 5),
        col(p.goals   > 0 ? String(p.goals)   : "—", 5),
        col(p.assists > 0 ? String(p.assists) : "—", 4),
        col(String(p.passes), 7),
        ...(showTackles       ? [col(p.tackles       > 0 ? String(p.tackles)       : "—", 6)] : []),
        ...(showInterceptions ? [col(p.interceptions > 0 ? String(p.interceptions) : "—", 5)] : []),
        p.motm ? "★" : "",
      ].join(" "));
      const tableBlock = "```\n" + [header, divider, ...rows].join("\n") + "\n```";

      const fields: { name: string; value: string; inline?: boolean }[] = [];
      if (eventsLine) fields.push({ name: "\u200b", value: eventsLine, inline: false });
      fields.push({ name: "JOUEURS", value: tableBlock, inline: false });

      await sendDiscordWebhook(discordWebhook, [{
        title: `${myGoals} — ${oppGoals}  ·  vs ${oppName}`,
        color,
        description: `${formatDate(match.timestamp, locale)}  **${rl.text.toUpperCase()}**`,
        fields,
        footer: { text: "ProClubs Stats" },
      }]);
      addToast(t("discord.sent"), "success");
    } catch (e) { addToast(`Discord: ${String(e)}`, "error"); }
    finally { setSharing(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 720,
        maxHeight: "88vh", overflowY: "auto", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#eab308", letterSpacing: 2 }}>
              {myGoals} — {oppGoals}
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 2 }}>vs {oppName}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {formatDate(match.timestamp, locale)}
              {match.matchDuration ? ` · ${formatDuration(match.matchDuration)}` : ""}
              <span style={{ color: rl.color, fontFamily: "'Bebas Neue', sans-serif", marginLeft: 10, letterSpacing: 1 }}>{rl.text}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {discordWebhook && (
              <button onClick={shareToDiscord} disabled={sharing} title={t("discord.share")}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 10px", background: "rgba(88,101,242,0.15)",
                  border: "1px solid rgba(88,101,242,0.3)", borderRadius: 6,
                  color: "#5865f2", fontSize: 11, cursor: sharing ? "default" : "pointer",
                  opacity: sharing ? 0.5 : 1, transition: "all 0.15s",
                }}>
                <Send size={12} /> Discord
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* ── Timeline events ──────────────────────────────────── */}
        {events.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14,
            padding: "10px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
            {events.map((ev, i) => {
              const icon = ev.type === "goal" ? "⚽" : ev.type === "assist" ? "🅰️" : ev.type === "motm" ? "⭐" : (ev.detail ?? "🟨");
              const color = ev.type === "goal" ? "var(--accent)" : ev.type === "assist" ? "#eab308" : ev.type === "motm" ? "#ffd700" : ev.detail?.includes("🟥") ? "var(--red)" : "#eab308";
              const typeLabel = ev.type === "goal" ? "But" : ev.type === "assist" ? "Passe déc." : ev.type === "motm" ? "MOTM" : ev.detail?.includes("🟥") ? "Rouge" : "Jaune";
              return (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 12, fontSize: 11,
                  background: `${color}18`, border: `1px solid ${color}44`,
                  color, fontWeight: 600,
                }}>
                  {icon} {ev.player}
                  <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 400 }}>{typeLabel}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* ── Stats équipe ─────────────────────────────────────── */}
        {teamStats.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{t("matches.teamStats")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "4px 10px",
              padding: "10px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
              {teamStats.map(({ label, my, opp }) => {
                const nMy = Number(String(my).replace("%", "")), nOpp = Number(String(opp).replace("%", ""));
                const myWins = !isNaN(nMy) && !isNaN(nOpp) && nMy > nOpp;
                const oppWins = !isNaN(nMy) && !isNaN(nOpp) && nOpp > nMy;
                return (
                  <div key={label} style={{ display: "contents" }}>
                    <div style={{ textAlign: "right", fontSize: 13, fontFamily: "'Bebas Neue', sans-serif",
                      color: myWins ? "var(--accent)" : "var(--text)" }}>{my}</div>
                    <div style={{ textAlign: "center", fontSize: 9, color: "var(--muted)",
                      fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em", alignSelf: "center" }}>{label.toUpperCase()}</div>
                    <div style={{ textAlign: "left", fontSize: 13, fontFamily: "'Bebas Neue', sans-serif",
                      color: oppWins ? "var(--red)" : "var(--text)" }}>{opp}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tableau joueurs ──────────────────────────────────── */}
        {myPlayers.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>{t("matches.playerStats")}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    t("players.name"), t("players.rating"), t("players.goals"), t("players.assists"), t("players.passes"),
                    ...(hasTackles       ? [t("players.tackles")]      : []),
                    ...(hasInterceptions ? [t("players.interceptions")] : []),
                    ...(hasFouls         ? [t("players.fouls")]        : []),
                    ...(hasCards         ? [t("players.yellowCards")]   : []),
                    t("session.motm"),
                  ].map((h) => (
                    <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 10,
                      color: "var(--muted)", fontWeight: "normal", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myPlayers.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.name}</td>
                    <td style={{ padding: "6px 8px", fontWeight: "bold",
                      color: p.rating >= 7.5 ? "var(--green)" : p.rating >= 6 ? "#eab308" : "var(--red)" }}>
                      {p.rating.toFixed(1)}
                    </td>
                    <td style={{ padding: "6px 8px", color: "var(--accent)" }}>{p.goals || "—"}</td>
                    <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.assists || "—"}</td>
                    <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.passes}</td>
                    {hasTackles       && <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.tackles || "—"}</td>}
                    {hasInterceptions && <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.interceptions || "—"}</td>}
                    {hasFouls         && <td style={{ padding: "6px 8px", color: "var(--text)" }}>{p.fouls || "—"}</td>}
                    {hasCards && (
                      <td style={{ padding: "6px 8px" }}>
                        {p.yellowCards > 0 && <span style={{ marginRight: 2 }}>🟨{p.yellowCards}</span>}
                        {p.redCards    > 0 && <span>🟥{p.redCards}</span>}
                        {!p.yellowCards && !p.redCards && <span style={{ color: "var(--muted)" }}>—</span>}
                      </td>
                    )}
                    <td style={{ padding: "6px 8px", color: "#ffd700" }}>{p.motm ? "★" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 16 }}>{t("matches.noPlayerStats")}</p>
        )}
      </div>
    </div>
  );
}
