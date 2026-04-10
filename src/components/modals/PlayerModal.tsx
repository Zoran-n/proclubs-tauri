import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Send, FileText } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useT } from "../../i18n";
import { sendDiscordWebhook } from "../../api/discord";
import { generatePlayerPdf, getPlayerPdfFilename } from "../../utils/pdfExport";
import { PdfSaveModal } from "../ui/PdfSaveModal";
import type { Player, Match } from "../../types";

export const POS_LABELS: Record<string, string> = {
  "0":"GK","1":"RB","2":"RB","3":"CB","4":"CB","5":"LB","6":"LB",
  "7":"CDM","8":"CM","9":"CM","10":"CAM","11":"RM","12":"LM",
  "13":"RW","14":"LW","15":"RF","16":"CF","17":"LF","18":"ST","19":"ST",
  "20":"ST","25":"CF","26":"CAM",
};

export const AVATAR_COLORS = ["#5865f2", "#eb459e", "#57f287", "#fee75c", "#ed4245", "#ff6b35", "#8b5cf6", "#00d4ff"];

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PlayerAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "?";
  const bg = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: bg, color: "#fff", fontSize: size * 0.4, fontWeight: 700,
      fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em",
    }}>
      {initials}
    </div>
  );
}

export function ratingColor(r: number) {
  if (r >= 9)   return "#ffd700";
  if (r >= 7.5) return "var(--green)";
  if (r >= 6.5) return "#eab308";
  if (r > 0)    return "var(--red)";
  return "var(--muted)";
}

function StatCell({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color, lineHeight: 1 }}>
        {String(value)}
      </div>
      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 4,
        fontFamily: "'Bebas Neue', sans-serif" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Linear regression ────────────────────────────────────────────────────────

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMatchesFromCache(
  matchCache: Record<string, Match[]>,
  clubId: string,
  platform: string,
): Match[] {
  const all: Match[] = [];
  for (const type of ["leagueMatch", "playoffMatch", "friendlyMatch"]) {
    const key = `${clubId}_${platform}_${type}`;
    all.push(...(matchCache[key] ?? []));
  }
  return all;
}

// ─── PlayerModal ──────────────────────────────────────────────────────────────

export function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const t = useT();
  const { matches, matchCache, currentClub, discordWebhook, addToast } = useAppStore();
  const [evoStat, setEvoStat] = useState<"rating" | "goals" | "assists">("rating");
  const [showTrend, setShowTrend] = useState(false);
  const [chartView, setChartView] = useState<"match" | "monthly">("match");
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const posLabel = POS_LABELS[player.position] ?? player.position ?? "—";

  // ── Per-match evolution data (league matches only — fast) ──────────────────
  const evoData = useMemo(() => {
    if (!currentClub) return [];
    const points: { match: string; value: number; date: string }[] = [];
    const sorted = [...matches].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    for (const m of sorted) {
      const clubPlayers = m.players[currentClub.id] as Record<string, Record<string, unknown>> | undefined;
      if (!clubPlayers) continue;
      for (const p of Object.values(clubPlayers)) {
        const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? "");
        if (name.toLowerCase() !== player.name.toLowerCase()) continue;
        const val = evoStat === "rating"
          ? Number(p["rating"] ?? p["ratingAve"] ?? 0)
          : evoStat === "goals"
          ? Number(p["goals"] ?? 0)
          : Number(p["assists"] ?? 0);
        const ts = Number(m.timestamp);
        const date = ts > 0 ? new Date(ts > 1e12 ? ts : ts * 1000).toLocaleDateString() : "";
        points.push({ match: `M${points.length + 1}`, value: Math.round(val * 100) / 100, date });
      }
    }
    return points;
  }, [matches, currentClub, player.name, evoStat]);

  // ── Trend line data (linear regression) ───────────────────────────────────
  const trendChartData = useMemo(() => {
    if (!showTrend || evoStat !== "rating" || evoData.length < 3) return evoData;
    const values = evoData.map((d) => d.value);
    const { slope, intercept } = linearRegression(values);
    const clamp = (v: number) => Math.max(0, Math.min(10, Math.round(v * 100) / 100));
    // Existing points with trend line overlay
    const withTrend = evoData.map((d, i) => ({
      ...d,
      trendValue: clamp(slope * i + intercept),
      projected: undefined as number | undefined,
    }));
    // 5 projected future points
    for (let i = 0; i < 5; i++) {
      const x = values.length + i;
      withTrend.push({
        match: `P${i + 1}`,
        value: null as unknown as number,
        date: "Projection",
        trendValue: clamp(slope * x + intercept),
        projected: clamp(slope * x + intercept),
      });
    }
    return withTrend;
  }, [evoData, showTrend, evoStat]);

  // ── Monthly grouping (all match types from cache) ─────────────────────────
  const monthlyData = useMemo(() => {
    if (!currentClub) return [];
    const allMatches = getMatchesFromCache(matchCache, currentClub.id, currentClub.platform);
    const byMonth = new Map<string, { goals: number; assists: number; ratings: number[]; games: number }>();
    const sorted = [...allMatches].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    for (const m of sorted) {
      const clubPlayers = m.players[currentClub.id] as Record<string, Record<string, unknown>> | undefined;
      if (!clubPlayers) continue;
      for (const p of Object.values(clubPlayers)) {
        const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? "");
        if (name.toLowerCase() !== player.name.toLowerCase()) continue;
        const ts = Number(m.timestamp);
        const d = new Date(ts > 1e12 ? ts : ts * 1000);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!byMonth.has(key)) byMonth.set(key, { goals: 0, assists: 0, ratings: [], games: 0 });
        const entry = byMonth.get(key)!;
        entry.goals   += Number(p["goals"] ?? 0);
        entry.assists += Number(p["assists"] ?? 0);
        const r = Number(p["rating"] ?? p["ratingAve"] ?? 0);
        if (r > 0) entry.ratings.push(r);
        entry.games   += 1;
      }
    }
    return Array.from(byMonth.entries()).map(([month, d]) => ({
      month,
      goals: d.goals,
      assists: d.assists,
      rating: d.ratings.length > 0
        ? Math.round((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length) * 10) / 10
        : 0,
      games: d.games,
    }));
  }, [matchCache, currentClub, player.name]);

  // ── All evolution data (for Discord + PDF) ────────────────────────────────
  const allEvoData = useMemo(() => {
    if (!currentClub) return { rating: [], goals: [], assists: [] };
    const sorted = [...matches].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    const rating: number[] = [], goals: number[] = [], assists: number[] = [];
    for (const m of sorted) {
      const clubPlayers = m.players[currentClub.id] as Record<string, Record<string, unknown>> | undefined;
      if (!clubPlayers) continue;
      for (const p of Object.values(clubPlayers)) {
        const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? "");
        if (name.toLowerCase() !== player.name.toLowerCase()) continue;
        rating.push(Math.round(Number(p["rating"] ?? p["ratingAve"] ?? 0) * 10) / 10);
        goals.push(Number(p["goals"] ?? 0));
        assists.push(Number(p["assists"] ?? 0));
      }
    }
    return { rating, goals, assists };
  }, [matches, currentClub, player.name]);

  // ── Trend summary for display ─────────────────────────────────────────────
  const trendSummary = useMemo(() => {
    const values = allEvoData.rating;
    if (values.length < 3) return null;
    const { slope } = linearRegression(values);
    const last5 = values.slice(-5);
    const avg5 = last5.reduce((a, b) => a + b, 0) / last5.length;
    const next5 = values.map((_, i) => i).slice(-1)[0] ?? 0;
    const { slope: s, intercept: ic } = linearRegression(values);
    const projected = Array.from({ length: 5 }, (_, i) =>
      Math.max(0, Math.min(10, Math.round((s * (next5 + 1 + i) + ic) * 10) / 10))
    );
    return {
      slope: Math.round(slope * 1000) / 1000,
      avg5: Math.round(avg5 * 10) / 10,
      projectedAvg: Math.round(projected.reduce((a, b) => a + b, 0) / projected.length * 10) / 10,
      direction: slope > 0.05 ? "↑ En progression" : slope < -0.05 ? "↓ En baisse" : "→ Stable",
      dirColor: slope > 0.05 ? "var(--green)" : slope < -0.05 ? "var(--red)" : "#eab308",
    };
  }, [allEvoData.rating]);

  const handleShareDiscord = async () => {
    if (!discordWebhook) { addToast(t("discord.noWebhook"), "error"); return; }
    setSharing(true);
    try {
      const colorHex = avatarColor(player.name);
      const color = parseInt(colorHex.replace("#", ""), 16);
      const fields: { name: string; value: string; inline?: boolean }[] = [
        { name: "🎮 MJ",           value: String(player.gamesPlayed), inline: true },
        { name: "⚽ Buts",         value: String(player.goals),       inline: true },
        { name: "🅰️ Passes D.",   value: String(player.assists),     inline: true },
        { name: "🎯 Passes",       value: String(player.passesMade),  inline: true },
        { name: "🛡️ Tacles",      value: String(player.tacklesMade), inline: true },
        { name: "★ MOTM",          value: `${player.motm}x`,          inline: true },
      ];
      if (player.shotsOnTarget)  fields.push({ name: "🎯 Tirs cadrés",   value: String(player.shotsOnTarget),  inline: true });
      if (player.interceptions)  fields.push({ name: "🔵 Interceptions", value: String(player.interceptions),  inline: true });
      if (player.yellowCards)    fields.push({ name: "🟨 Cartons J.",    value: String(player.yellowCards),    inline: true });
      if (player.redCards)       fields.push({ name: "🟥 Cartons R.",    value: String(player.redCards),       inline: true });
      if (player.cleanSheets)    fields.push({ name: "🧤 Clean sheets",  value: String(player.cleanSheets),    inline: true });
      if (player.saveAttempts)   fields.push({ name: "🧤 Arrêts",        value: String(player.saveAttempts),   inline: true });
      const BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
      const ratingSparkline = (arr: number[]) => {
        const min = Math.min(...arr), max = Math.max(...arr);
        const range = max - min || 1;
        const bar = arr.map(v => BLOCKS[Math.round(((v - min) / range) * (BLOCKS.length - 1))]).join("");
        const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
        const trend = arr[arr.length - 1] >= arr[0] ? "↑" : "↓";
        return `\`${bar}\`\nMoy. **${avg}** ★  |  Min ${min.toFixed(1)}  |  Max ${max.toFixed(1)}  |  ${arr.length} matchs  ${trend}`;
      };
      const countSparkline = (arr: number[], emoji: string) => {
        const squares = arr.map(v => v === 0 ? "⬜" : v === 1 ? "🟩" : v === 2 ? "🟨" : "🟥").join("");
        const total = arr.reduce((a, b) => a + b, 0);
        return `${squares}\nTotal : **${total}** ${emoji} sur ${arr.length} matchs`;
      };
      if (allEvoData.rating.length > 1)
        fields.push({ name: "📈 Évolution Note", value: ratingSparkline(allEvoData.rating).slice(0, 1024) });
      if (allEvoData.goals.length > 1 && allEvoData.goals.some(v => v > 0))
        fields.push({ name: "⚽ Évolution Buts", value: countSparkline(allEvoData.goals, "⚽").slice(0, 1024) });
      if (allEvoData.assists.length > 1 && allEvoData.assists.some(v => v > 0))
        fields.push({ name: "🅰️ Évolution PD", value: countSparkline(allEvoData.assists, "🅰️").slice(0, 1024) });
      if (trendSummary)
        fields.push({ name: "📊 Tendance", value: `${trendSummary.direction}  |  Avg 5 derniers : **${trendSummary.avg5}**  |  Proj. 5 prochains : **${trendSummary.projectedAvg}**` });
      await sendDiscordWebhook(discordWebhook, [{
        title: `👤 ${player.name} — ${posLabel}`,
        color,
        description: player.rating > 0 ? `Note moyenne : **${player.rating.toFixed(1)}** ★` : undefined,
        fields,
        footer: { text: "ProClubs Stats" },
      }]);
      addToast(t("discord.sent"), "success");
    } catch (e) {
      addToast(`Discord: ${String(e)}`, "error");
    } finally {
      setSharing(false);
    }
  };

  const baseStats: [string, string | number, string][] = [
    [t("players.gp"),       player.gamesPlayed,          "var(--text)"],
    [t("players.goals"),    player.goals,                "var(--accent)"],
    [t("players.assists"),  player.assists,              "var(--text)"],
    [t("players.passes"),   player.passesMade,           "var(--muted)"],
    [t("players.tackles"),  player.tacklesMade,          "var(--muted)"],
    [t("session.motm"),     player.motm,                 "#ffd700"],
    [t("players.rating"),   player.rating > 0 ? player.rating.toFixed(1) : "—", ratingColor(player.rating)],
  ];

  const advStats: [string, string | number, string][] = [
    ...(player.shotsOnTarget  ? [[t("players.shotsOnTarget"),  player.shotsOnTarget,  "var(--accent)"] as [string, number, string]] : []),
    ...(player.interceptions  ? [[t("players.interceptions"),  player.interceptions,  "var(--text)"] as [string, number, string]] : []),
    ...(player.foulsCommitted ? [[t("players.fouls"),          player.foulsCommitted, "var(--muted)"] as [string, number, string]] : []),
    ...(player.yellowCards    ? [[t("players.yellowCards"),     player.yellowCards,    "#eab308"] as [string, number, string]] : []),
    ...(player.redCards       ? [[t("players.redCards"),        player.redCards,       "var(--red)"] as [string, number, string]] : []),
    ...(player.cleanSheets    ? [[t("players.cleanSheets"),    player.cleanSheets,    "var(--green)"] as [string, number, string]] : []),
    ...(player.saveAttempts   ? [[t("players.saves"),          player.saveAttempts,   "var(--text)"] as [string, number, string]] : []),
  ];

  const BTN_SM: React.CSSProperties = {
    padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600,
  };

  return (
    <>
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 520,
        maxHeight: "92vh", overflowY: "auto",
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PlayerAvatar name={player.name} size={44} />
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "var(--text)",
                letterSpacing: "0.06em", lineHeight: 1 }}>{player.name}</h3>
              <span style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 4,
                background: "var(--bg)", border: "1px solid var(--border)",
                fontSize: 11, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif" }}>
                {posLabel}
              </span>
              {trendSummary && (
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: trendSummary.dirColor }}>
                  {trendSummary.direction}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShowPdfModal(true)} disabled={exporting} title="Exporter en PDF"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.3)",
                borderRadius: 6, color: "#ff6b35", fontSize: 11,
                cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.5 : 1 }}>
              <FileText size={12} /> PDF
            </button>
            {discordWebhook && (
              <button onClick={handleShareDiscord} disabled={sharing} title="Envoyer sur Discord"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                  background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.35)",
                  borderRadius: 6, color: "#8b9cf4", fontSize: 11,
                  cursor: sharing ? "default" : "pointer", opacity: sharing ? 0.5 : 1 }}>
                <Send size={12} /> Discord
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)",
              cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
          </div>
        </div>

        {/* Base stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {baseStats.map(([label, value, color]) => (
            <StatCell key={label} label={label} value={value} color={color} />
          ))}
        </div>

        {/* Advanced stats */}
        {advStats.length > 0 && (
          <>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif", margin: "14px 0 8px" }}>
              {t("players.advancedStats")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {advStats.map(([label, value, color]) => (
                <StatCell key={label} label={label} value={value} color={color} />
              ))}
            </div>
          </>
        )}

        {/* ── Evolution / Monthly chart ─────────────────────────────────── */}
        {(evoData.length > 1 || monthlyData.length > 1) && (
          <>
            {/* Row 1: chart view toggle (Par match / Par mois) */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "16px 0 0" }}>
              <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                fontFamily: "'Bebas Neue', sans-serif" }}>{t("players.evolution")}</span>
              <div style={{ display: "flex", gap: 2, background: "var(--bg)", borderRadius: 4, padding: 2 }}>
                {(["match", "monthly"] as const).map((v) => (
                  <button key={v} onClick={() => setChartView(v)}
                    style={{ ...BTN_SM,
                      background: chartView === v ? "var(--accent)" : "none",
                      color: chartView === v ? "#000" : "var(--muted)",
                      border: "none" }}>
                    {v === "match" ? "Par match" : "Par mois"}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: stat toggles + trend toggle (only in match view) */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 8px", flexWrap: "wrap" }}>
              {chartView === "match" && (["rating", "goals", "assists"] as const).map((s) => (
                <button key={s} onClick={() => setEvoStat(s)}
                  style={{ ...BTN_SM,
                    background: evoStat === s ? "var(--accent)" : "var(--bg)",
                    color: evoStat === s ? "#000" : "var(--muted)",
                    border: evoStat === s ? "1px solid var(--accent)" : "1px solid var(--border)" }}>
                  {s === "rating" ? t("players.rating") : s === "goals" ? t("players.goals") : t("players.assistsShort")}
                </button>
              ))}
              {chartView === "match" && evoStat === "rating" && evoData.length >= 3 && (
                <button onClick={() => setShowTrend((v) => !v)}
                  style={{ ...BTN_SM,
                    background: showTrend ? "rgba(139,92,246,0.15)" : "var(--bg)",
                    color: showTrend ? "#8b5cf6" : "var(--muted)",
                    border: showTrend ? "1px solid #8b5cf680" : "1px solid var(--border)" }}>
                  📈 Tendance
                </button>
              )}
            </div>

            {/* Chart — par match */}
            {chartView === "match" && evoData.length > 1 && (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="match" tick={{ fill: "var(--muted)", fontSize: 9 }} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }}
                      domain={evoStat === "rating" ? [0, 10] : [0, "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }}
                      labelStyle={{ color: "var(--muted)" }}
                      formatter={(v: unknown, name: unknown) => {
                        const n = Number(v);
                        const nameStr = String(name ?? "");
                        if (isNaN(n)) return [null, nameStr];
                        const label = nameStr === "trendValue" ? "Tendance" : nameStr === "projected" ? "Projection" :
                          evoStat === "rating" ? t("players.rating") :
                          evoStat === "goals"  ? t("players.goals")  : t("players.assistsShort");
                        return [evoStat === "rating" ? n.toFixed(1) : n, label];
                      }}
                      labelFormatter={(_l: unknown, payload: unknown) => {
                        const p = payload as Array<{ payload?: { date?: string } }>;
                        return p?.[0]?.payload?.date ?? "";
                      }}
                    />
                    {/* Actual values */}
                    <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2}
                      dot={{ r: 3, fill: "var(--accent)" }} connectNulls={false} name="value" />
                    {/* Trend line */}
                    {showTrend && evoStat === "rating" && (
                      <Line type="monotone" dataKey="trendValue" stroke="#8b5cf6" strokeWidth={1.5}
                        strokeDasharray="4 3" dot={false} name="trendValue" />
                    )}
                    {/* Projection segment */}
                    {showTrend && evoStat === "rating" && (
                      <Line type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={1.5}
                        strokeDasharray="2 2" dot={{ r: 2, fill: "#8b5cf6" }} connectNulls={false} name="projected" />
                    )}
                    {/* Separator between real and projected */}
                    {showTrend && evoData.length > 0 && (
                      <ReferenceLine x={`M${evoData.length}`} stroke="var(--border)" strokeDasharray="3 3" />
                    )}
                  </LineChart>
                </ResponsiveContainer>

                {/* Trend summary card */}
                {showTrend && trendSummary && (
                  <div style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: 6, padding: "8px 12px", marginTop: 8, fontSize: 11,
                    display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ color: trendSummary.dirColor, fontWeight: 700 }}>{trendSummary.direction}</span>
                    <span style={{ color: "var(--muted)" }}>Moy. 5 derniers : <strong style={{ color: "var(--text)" }}>{trendSummary.avg5}</strong></span>
                    <span style={{ color: "var(--muted)" }}>Projection 5 prochains : <strong style={{ color: "#8b5cf6" }}>{trendSummary.projectedAvg}</strong></span>
                    <span style={{ color: "var(--muted)" }}>Pente : <strong style={{ color: "var(--text)" }}>{trendSummary.slope > 0 ? "+" : ""}{trendSummary.slope}</strong> / match</span>
                  </div>
                )}
              </>
            )}

            {/* Chart — par mois */}
            {chartView === "monthly" && monthlyData.length > 0 && (
              <>
                <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                  {(["goals", "assists", "rating", "games"] as const).map((k) => (
                    <span key={k} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3,
                      background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                      {k === "goals" ? "⚽ Buts" : k === "assists" ? "🅰️ PD" : k === "rating" ? "★ Note moy" : "🎮 MJ"}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 8 }} />
                    <YAxis yAxisId="left" tick={{ fill: "var(--muted)", fontSize: 8 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]}
                      tick={{ fill: "var(--muted)", fontSize: 8 }} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }}
                      formatter={(v: unknown, name: unknown) => {
                        const nameStr = String(name ?? "");
                        const labels: Record<string, string> = { goals: "Buts", assists: "PD", rating: "Note moy", games: "MJ" };
                        return [Number(v), labels[nameStr] ?? nameStr];
                      }}
                    />
                    <Bar yAxisId="left" dataKey="goals"   fill="var(--accent)" name="goals"   opacity={0.9} radius={[2,2,0,0]} />
                    <Bar yAxisId="left" dataKey="assists" fill="#8b5cf6"        name="assists" opacity={0.8} radius={[2,2,0,0]} />
                    <Bar yAxisId="left" dataKey="games"   fill="var(--muted)"   name="games"   opacity={0.3} radius={[2,2,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#ffd700"
                      strokeWidth={2} dot={{ r: 3, fill: "#ffd700" }} name="rating" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4, textAlign: "center" }}>
                  {monthlyData.length} mois · tous types de matchs
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>

    {showPdfModal && (
      <PdfSaveModal
        filename={getPlayerPdfFilename(player.name)}
        onConfirm={async () => {
          setShowPdfModal(false);
          setExporting(true);
          try {
            await generatePlayerPdf(player, posLabel, allEvoData.rating, monthlyData);
          } finally { setExporting(false); }
        }}
        onCancel={() => setShowPdfModal(false)}
      />
    )}
    </>
  );
}
