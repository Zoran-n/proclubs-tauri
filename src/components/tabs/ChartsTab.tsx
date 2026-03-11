import { useState, useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, Label, ResponsiveContainer } from "recharts";
import { useAppStore } from "../../store/useAppStore";
import { exportPng } from "../../utils/export";
import type { Match, Player } from "../../types";

function aggregateMatchPlayers(matches: Match[], clubId: string): Player[] {
  const acc: Record<string, { goals: number; assists: number; passesMade: number }> = {};
  for (const m of matches) {
    const clubPlayers = m.players[clubId] as Record<string, Record<string, string>> | undefined;
    if (!clubPlayers || typeof clubPlayers !== "object") continue;
    for (const [_id, s] of Object.entries(clubPlayers)) {
      const name = s.name || s.playername || s.playerName || _id;
      if (!acc[name]) acc[name] = { goals: 0, assists: 0, passesMade: 0 };
      acc[name].goals      += Number(s.goals)      || 0;
      acc[name].assists    += Number(s.assists)     || 0;
      acc[name].passesMade += Number(s.passesMade) || Number(s.passesmade) || 0;
    }
  }
  return Object.entries(acc).map(([name, s]) => ({
    name, goals: s.goals, assists: s.assists, passesMade: s.passesMade,
    position: "", tacklesMade: 0, motm: 0, rating: 0, gamesPlayed: 0,
  }));
}

type Mode = "last10" | "alltime";

const BTN: React.CSSProperties = {
  padding: "6px 10px",
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  cursor: "pointer",
  color: "var(--muted)",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px" }}>
      <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
        fontFamily: "'Bebas Neue', sans-serif", marginBottom: 10 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function DonutCenter({ viewBox, value, sub }: { viewBox?: { cx: number; cy: number }; value: number | string; sub: string }) {
  const cx = viewBox?.cx ?? 0, cy = viewBox?.cy ?? 0;
  return (
    <g>
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff"
        fontFamily="'Bebas Neue', sans-serif" fontSize={30} dominantBaseline="auto">{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize={10} dominantBaseline="auto">{sub}</text>
    </g>
  );
}

function DonutChart({ data, centerValue, centerSub }: {
  data: { name: string; value: number; color: string }[];
  centerValue: number | string; centerSub: string;
}) {
  const safe = data.every(d => d.value === 0) ? data.map(d => ({ ...d, value: 1 })) : data;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={safe} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
          dataKey="value" startAngle={90} endAngle={-270} strokeWidth={2} stroke="var(--card)">
          {safe.map((d, i) => <Cell key={i} fill={d.color} />)}
          <Label content={(props: unknown) => {
            const p = props as { viewBox?: { cx: number; cy: number } };
            return <DonutCenter viewBox={p.viewBox} value={centerValue} sub={centerSub} />;
          }} />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function WdlLegend({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 4 }}>
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <div key={d.name} style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "#fff" }}>{d.value}</span>
            </div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em" }}>{d.name}</div>
            <div style={{ fontSize: 9, color: d.color }}>({pct}%)</div>
          </div>
        );
      })}
    </div>
  );
}

const GRADIENTS: Record<string, string> = {
  cyan:   "linear-gradient(90deg, #0098b8, #00d4ff)",
  orange: "linear-gradient(90deg, #c2410c, #f97316)",
  purple: "linear-gradient(90deg, #6d28d9, #a855f7)",
};
const VALUE_COLORS: Record<string, string> = {
  cyan: "#00d4ff", orange: "#f97316", purple: "#a855f7",
};

function HBarChart({ players, valueKey, color }: {
  players: Player[]; valueKey: keyof Player; color: "cyan" | "orange" | "purple";
}) {
  const maxVal = Math.max(...players.map((p) => Number(p[valueKey]) || 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {players.map((p) => {
        const val = Number(p[valueKey]) || 0;
        return (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 82, textAlign: "right", fontSize: 11, color: "var(--muted)",
              flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.name}
            </div>
            <div style={{ flex: 1, background: "var(--bg)", borderRadius: 3, height: 30, overflow: "hidden" }}>
              <div style={{ width: `${(val / maxVal) * 100}%`, height: "100%",
                background: GRADIENTS[color], borderRadius: "0 3px 3px 0", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ width: 32, fontSize: 13, fontWeight: 700,
              color: VALUE_COLORS[color], flexShrink: 0, textAlign: "right" }}>{val}</div>
          </div>
        );
      })}
    </div>
  );
}

export function ChartsTab() {
  const [mode, setMode] = useState<Mode>("last10");
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { currentClub, players, matches } = useAppStore();

  const last10 = useMemo(() => {
    if (!currentClub || matches.length === 0)
      return { wins: 0, ties: 0, losses: 0, goals: 0, assists: 0, count: 0 };
    const sorted = [...matches].sort((a, b) => Number(a.timestamp) - Number(b.timestamp)).slice(-10);
    let wins = 0, ties = 0, losses = 0, goals = 0, assists = 0;
    for (const m of sorted) {
      const c = m.clubs[currentClub.id] as Record<string, string> | undefined;
      if (!c) continue;
      if (Number(c.wins)  > 0) wins++;
      else if (Number(c.ties) > 0) ties++;
      else losses++;
      goals   += Number(c.goals)   || 0;
      assists += Number(c.assists) || 0;
    }
    return { wins, ties, losses, goals, assists, count: sorted.length };
  }, [matches, currentClub]);

  const allTimeAssists = useMemo(() => players.reduce((s, p) => s + p.assists, 0), [players]);

  const wdlData = useMemo(() => {
    if (!currentClub) return [];
    const src = mode === "alltime"
      ? { wins: currentClub.wins, ties: currentClub.ties, losses: currentClub.losses }
      : last10;
    return [
      { name: "Victoires", value: src.wins,   color: "#22c55e" },
      { name: "Nuls",      value: src.ties,   color: "#eab308" },
      { name: "Défaites",  value: src.losses, color: "#ef4444" },
    ];
  }, [currentClub, mode, last10]);

  const wdlTotal = wdlData.reduce((s, d) => s + d.value, 0);

  const butsData = useMemo(() => {
    if (!currentClub) return { data: [], total: 0 };
    const goals   = mode === "alltime" ? currentClub.goals : last10.goals;
    const assists = mode === "alltime" ? allTimeAssists    : last10.assists;
    return {
      data: [
        { name: "Buts",      value: goals,   color: "#00d4ff" },
        { name: "Passes D.", value: assists, color: "#22c55e" },
      ],
      total: goals + assists,
    };
  }, [currentClub, mode, last10, allTimeAssists]);

  const playerSource = useMemo(() => {
    if (mode === "alltime" || !currentClub) return players;
    const sorted = [...matches].sort((a, b) => Number(a.timestamp) - Number(b.timestamp)).slice(-10);
    return aggregateMatchPlayers(sorted, currentClub.id);
  }, [mode, players, matches, currentClub]);

  const topScorers = useMemo(() => [...playerSource].sort((a, b) => b.goals      - a.goals).slice(0, 5),      [playerSource]);
  const topAssists = useMemo(() => [...playerSource].sort((a, b) => b.assists     - a.assists).slice(0, 5),    [playerSource]);
  const topPasses  = useMemo(() => [...playerSource].sort((a, b) => b.passesMade  - a.passesMade).slice(0, 5), [playerSource]);

  const handlePng = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    await exportPng(contentRef.current, `graphiques-${new Date().toISOString().slice(0, 10)}`).finally(() => setExporting(false));
  };

  if (!currentClub) return null;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px 20px" }}>

      {/* Toggle + export */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 20 }}>
        {(["last10", "alltime"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 18px", borderRadius: 20, fontSize: 11,
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em", cursor: "pointer",
            border: `1px solid ${mode === m ? "var(--accent)" : "var(--border)"}`,
            background: "transparent",
            color: mode === m ? "var(--accent)" : "var(--muted)",
            transition: "all 0.15s",
          }}>
            {m === "last10" ? "10 DERNIERS MATCHS" : "ALL TIME"}
          </button>
        ))}
        <button onClick={handlePng} disabled={exporting} style={{ ...BTN, marginLeft: 8 }}>
          <Download size={11} /> PNG
        </button>
      </div>

      <div ref={contentRef} style={{ background: "var(--bg)" }}>
        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <ChartCard title="VICTOIRES / NULS / DEFAITES">
            <DonutChart data={wdlData} centerValue={wdlTotal} centerSub="MATCHS" />
            <WdlLegend data={wdlData} total={wdlTotal} />
          </ChartCard>
          <ChartCard title="BUTS / PASSES DECISIVES">
            <DonutChart data={butsData.data} centerValue={butsData.total} centerSub="TOTAL" />
            <WdlLegend data={butsData.data} total={butsData.total} />
          </ChartCard>
          <ChartCard title="TOP BUTEURS">
            <HBarChart players={topScorers} valueKey="goals" color="cyan" />
          </ChartCard>
        </div>

        {/* Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <ChartCard title="TOP PASSES DECISIVES">
            <HBarChart players={topAssists} valueKey="assists" color="orange" />
          </ChartCard>
          <ChartCard title="TOP PASSES REUSSIES">
            <HBarChart players={topPasses} valueKey="passesMade" color="purple" />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
