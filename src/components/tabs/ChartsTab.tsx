import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Legend,
} from "recharts";
import { useAppStore } from "../../store/useAppStore";

const ACCENT = "var(--accent)";
const COLORS_WDL = ["#22c55e", "#eab308", "#ef4444"];

export function ChartsTab() {
  const { currentClub, players, matches } = useAppStore();

  const wdlData = useMemo(() => {
    if (!currentClub) return [];
    return [
      { name: "Victoires", value: currentClub.wins },
      { name: "Nuls", value: currentClub.ties },
      { name: "Défaites", value: currentClub.losses },
    ];
  }, [currentClub]);

  const topScorers = useMemo(
    () =>
      [...players]
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5)
        .map((p) => ({ name: p.name.split(" ")[0], goals: p.goals })),
    [players]
  );

  const topAssists = useMemo(
    () =>
      [...players]
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 5)
        .map((p) => ({ name: p.name.split(" ")[0], assists: p.assists })),
    [players]
  );

  const radarData = useMemo(() => {
    const top5 = [...players]
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, 1)[0];
    if (!top5) return [];
    const max = (key: keyof typeof top5) =>
      Math.max(...players.map((p) => Number(p[key]) || 0)) || 1;
    return [
      { subject: "Buts", value: (top5.goals / max("goals")) * 100 },
      { subject: "PD", value: (top5.assists / max("assists")) * 100 },
      { subject: "Passes", value: (top5.passesMade / max("passesMade")) * 100 },
      { subject: "Tacles", value: (top5.tacklesMade / max("tacklesMade")) * 100 },
      { subject: "Note", value: (top5.rating / 10) * 100 },
    ];
  }, [players]);

  const trendData = useMemo(() => {
    return [...matches]
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
      .slice(-10)
      .map((m, i) => {
        const clubData = currentClub
          ? (m.clubs[currentClub.id] as Record<string, unknown>)
          : null;
        return {
          match: i + 1,
          buts: Number(clubData?.["goals"] ?? 0),
        };
      });
  }, [matches, currentClub]);

  const chartStyle = { fontSize: 11, fill: "#64748b" };

  return (
    <div className="h-full overflow-y-auto px-4 py-3 grid grid-cols-2 gap-4">
      {/* W/D/L Donut */}
      <div className="bg-[#111820] rounded-xl p-4 border border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Résultats</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={wdlData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
              {wdlData.map((_, i) => (
                <Cell key={i} fill={COLORS_WDL[i]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#111820", border: "1px solid #ffffff20", borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Scorers */}
      <div className="bg-[#111820] rounded-xl p-4 border border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Buteurs</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topScorers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
            <XAxis type="number" tick={chartStyle} />
            <YAxis type="category" dataKey="name" tick={chartStyle} width={70} />
            <Tooltip contentStyle={{ background: "#111820", border: "1px solid #ffffff20", borderRadius: 8 }} />
            <Bar dataKey="goals" fill={ACCENT} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Assists */}
      <div className="bg-[#111820] rounded-xl p-4 border border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Passeurs</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topAssists} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
            <XAxis type="number" tick={chartStyle} />
            <YAxis type="category" dataKey="name" tick={chartStyle} width={70} />
            <Tooltip contentStyle={{ background: "#111820", border: "1px solid #ffffff20", borderRadius: 8 }} />
            <Bar dataKey="assists" fill="#a855f7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Goals Trend */}
      <div className="bg-[#111820] rounded-xl p-4 border border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Buts (10 derniers)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
            <XAxis dataKey="match" tick={chartStyle} />
            <YAxis tick={chartStyle} />
            <Tooltip contentStyle={{ background: "#111820", border: "1px solid #ffffff20", borderRadius: 8 }} />
            <Line type="monotone" dataKey="buts" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Radar */}
      {radarData.length > 0 && (
        <div className="bg-[#111820] rounded-xl p-4 border border-white/5 col-span-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Profil meilleur joueur</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ffffff15" />
              <PolarAngleAxis dataKey="subject" tick={chartStyle} />
              <Radar dataKey="value" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
