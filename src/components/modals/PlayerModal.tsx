import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Send, FileText } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useT } from "../../i18n";
import { sendDiscordWebhook } from "../../api/discord";
import { generatePlayerPdf, getPlayerPdfFilename } from "../../utils/pdfExport";
import { PdfSaveModal } from "../ui/PdfSaveModal";
import type { Player } from "../../types";

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

export function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const t = useT();
  const { matches, currentClub, discordWebhook, addToast } = useAppStore();
  const [evoStat, setEvoStat] = useState<"rating" | "goals" | "assists">("rating");
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const posLabel = POS_LABELS[player.position] ?? player.position ?? "—";

  // Build per-match evolution data
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
        const date = ts > 0 ? new Date(ts * 1000).toLocaleDateString() : "";
        points.push({ match: `M${points.length + 1}`, value: Math.round(val * 100) / 100, date });
      }
    }
    return points;
  }, [matches, currentClub, player.name, evoStat]);

  // Compute evolution for all 3 stats at once (for Discord)
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

      // Advanced stats
      if (player.shotsOnTarget)  fields.push({ name: "🎯 Tirs cadrés",   value: String(player.shotsOnTarget),  inline: true });
      if (player.interceptions)  fields.push({ name: "🔵 Interceptions", value: String(player.interceptions),  inline: true });
      if (player.yellowCards)    fields.push({ name: "🟨 Cartons J.",    value: String(player.yellowCards),    inline: true });
      if (player.redCards)       fields.push({ name: "🟥 Cartons R.",    value: String(player.redCards),       inline: true });
      if (player.cleanSheets)    fields.push({ name: "🧤 Clean sheets",  value: String(player.cleanSheets),    inline: true });
      if (player.saveAttempts)   fields.push({ name: "🧤 Arrêts",        value: String(player.saveAttempts),   inline: true });

      // Evolution — sparklines visuelles
      const BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
      const ratingSparkline = (arr: number[]) => {
        const min = Math.min(...arr), max = Math.max(...arr);
        const range = max - min || 1;
        const bar = arr.map(v => BLOCKS[Math.round(((v - min) / range) * (BLOCKS.length - 1))]).join("");
        const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
        const trend = arr[arr.length - 1] >= arr[0] ? "↑" : "↓";
        const last = arr.length;
        return `\`${bar}\`\nMoy. **${avg}** ★  |  Min ${min.toFixed(1)}  |  Max ${max.toFixed(1)}  |  ${last} matchs  ${trend}`;
      };
      const countSparkline = (arr: number[], emoji: string) => {
        const squares = arr.map(v => v === 0 ? "⬜" : v === 1 ? "🟩" : v === 2 ? "🟨" : "🟥").join("");
        const total = arr.reduce((a, b) => a + b, 0);
        return `${squares}\nTotal : **${total}** ${emoji} sur ${arr.length} matchs`;
      };

      if (allEvoData.rating.length > 1)
        fields.push({ name: "📈 Évolution Note", value: ratingSparkline(allEvoData.rating).slice(0, 1024), inline: false });
      if (allEvoData.goals.length > 1 && allEvoData.goals.some((v) => v > 0))
        fields.push({ name: "⚽ Évolution Buts", value: countSparkline(allEvoData.goals, "⚽").slice(0, 1024), inline: false });
      if (allEvoData.assists.length > 1 && allEvoData.assists.some((v) => v > 0))
        fields.push({ name: "🅰️ Évolution PD", value: countSparkline(allEvoData.assists, "🅰️").slice(0, 1024), inline: false });

      await sendDiscordWebhook(discordWebhook, [{
        title: `👤 ${player.name} — ${posLabel}`,
        color,
        description: player.rating > 0
          ? `Note moyenne : **${player.rating.toFixed(1)}** ★`
          : undefined,
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

  // Advanced stats — only show if at least one is non-zero
  const advStats: [string, string | number, string][] = [
    ...(player.shotsOnTarget  ? [[t("players.shotsOnTarget"),  player.shotsOnTarget,  "var(--accent)"] as [string, number, string]] : []),
    ...(player.interceptions  ? [[t("players.interceptions"),  player.interceptions,  "var(--text)"] as [string, number, string]] : []),
    ...(player.foulsCommitted ? [[t("players.fouls"),          player.foulsCommitted, "var(--muted)"] as [string, number, string]] : []),
    ...(player.yellowCards    ? [[t("players.yellowCards"),     player.yellowCards,    "#eab308"] as [string, number, string]] : []),
    ...(player.redCards       ? [[t("players.redCards"),        player.redCards,       "var(--red)"] as [string, number, string]] : []),
    ...(player.cleanSheets    ? [[t("players.cleanSheets"),    player.cleanSheets,    "var(--green)"] as [string, number, string]] : []),
    ...(player.saveAttempts   ? [[t("players.saves"),          player.saveAttempts,   "var(--text)"] as [string, number, string]] : []),
  ];

  return (
    <>
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 500,
        maxHeight: "90vh", overflowY: "auto",
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PlayerAvatar name={player.name} size={44} />
            <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "var(--text)",
              letterSpacing: "0.06em", lineHeight: 1 }}>
              {player.name}
            </h3>
            <span style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 4,
              background: "var(--bg)", border: "1px solid var(--border)",
              fontSize: 11, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif" }}>
              {posLabel}
            </span>
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
              <button onClick={handleShareDiscord} disabled={sharing}
                title="Envoyer sur Discord"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                  background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.35)",
                  borderRadius: 6, color: "#8b9cf4", fontSize: 11, cursor: sharing ? "default" : "pointer",
                  opacity: sharing ? 0.5 : 1 }}>
                <Send size={12} /> Discord
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)",
              cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {baseStats.map(([label, value, color]) => (
            <StatCell key={label} label={label} value={value} color={color} />
          ))}
        </div>

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

        {/* Evolution chart */}
        {evoData.length > 1 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 8px" }}>
              <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                fontFamily: "'Bebas Neue', sans-serif" }}>{t("players.evolution")}</span>
              {(["rating", "goals", "assists"] as const).map((s) => (
                <button key={s} onClick={() => setEvoStat(s)}
                  style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer",
                    background: evoStat === s ? "var(--accent)" : "var(--bg)",
                    color: evoStat === s ? "#000" : "var(--muted)",
                    border: evoStat === s ? "1px solid var(--accent)" : "1px solid var(--border)",
                    fontWeight: 600,
                  }}>
                  {s === "rating" ? t("players.rating") : s === "goals" ? t("players.goals") : t("players.assistsShort")}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={evoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="match" tick={{ fill: "var(--muted)", fontSize: 9 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} domain={evoStat === "rating" ? [0, 10] : [0, "auto"]} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: "var(--muted)" }}
                  formatter={(v: unknown) => { const n = Number(v); return [evoStat === "rating" ? n.toFixed(1) : n, evoStat === "rating" ? t("players.rating") : evoStat === "goals" ? t("players.goals") : t("players.assistsShort")]; }}
                  labelFormatter={(_l: unknown, payload: unknown) => { const p = payload as Array<{ payload?: { date?: string } }>; return p?.[0]?.payload?.date ?? ""; }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent)" }} />
              </LineChart>
            </ResponsiveContainer>
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
          try { await generatePlayerPdf(player, posLabel, allEvoData.rating); }
          finally { setExporting(false); }
        }}
        onCancel={() => setShowPdfModal(false)}
      />
    )}
    </>
  );
}
