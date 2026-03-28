import { useMemo, Fragment } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, ResponsiveContainer,
} from "recharts";
import { useT } from "../../i18n";
import type { Player } from "../../types";

/* ─── Radar Comparison Modal ─── */

export function CompareModal({ p1, p2, allPlayers, onClose }: {
  p1: Player; p2: Player; allPlayers: Player[]; onClose: () => void;
}) {
  const t = useT();

  const RADAR_STATS = useMemo(() => [
    { key: "goals" as keyof Player,       label: t("players.goalsShort") },
    { key: "assists" as keyof Player,     label: t("players.assists") },
    { key: "passesMade" as keyof Player,  label: t("players.passes") },
    { key: "tacklesMade" as keyof Player, label: t("players.tackles") },
    { key: "motm" as keyof Player,        label: t("session.motm") },
    { key: "rating" as keyof Player,      label: t("players.rating") },
  ], [t]);
  const maxV = allPlayers.reduce((acc, p) => ({
    goals:       Math.max(acc.goals,       p.goals),
    assists:     Math.max(acc.assists,     p.assists),
    passesMade:  Math.max(acc.passesMade,  p.passesMade),
    tacklesMade: Math.max(acc.tacklesMade, p.tacklesMade),
    motm:        Math.max(acc.motm,        p.motm),
    rating:      Math.max(acc.rating,      p.rating),
  }), { goals: 1, assists: 1, passesMade: 1, tacklesMade: 1, motm: 1, rating: 1 });

  const norm = (val: number, max: number) => max > 0 ? Math.round((val / max) * 100) : 0;

  const data = RADAR_STATS.map(({ key, label }) => ({
    stat: label,
    p1: norm(Number(p1[key]) || 0, maxV[key as keyof typeof maxV] ?? 1),
    p2: norm(Number(p2[key]) || 0, maxV[key as keyof typeof maxV] ?? 1),
  }));

  const rows: { label: string; v1: number; v2: number; fmt?: (v: number) => string }[] = [
    { label: t("players.gp"),       v1: p1.gamesPlayed, v2: p2.gamesPlayed },
    { label: t("players.goalsShort"),  v1: p1.goals,       v2: p2.goals },
    { label: t("players.assists"),  v1: p1.assists,     v2: p2.assists },
    { label: t("players.passes"),   v1: p1.passesMade,  v2: p2.passesMade },
    { label: t("players.tackles"),  v1: p1.tacklesMade, v2: p2.tacklesMade },
    { label: t("session.motm"),     v1: p1.motm,        v2: p2.motm },
    { label: t("players.rating"),   v1: p1.rating,      v2: p2.rating, fmt: (v) => v > 0 ? v.toFixed(1) : "—" },
  ];

  const P1_COLOR = "var(--accent)";
  const P2_COLOR = "#8b5cf6";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 520,
        maxHeight: "90vh", overflowY: "auto",
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: P1_COLOR }}>
              {p1.name}
            </span>
            <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>VS</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: P2_COLOR }}>
              {p2.name}
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Radar chart */}
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="stat"
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "'Bebas Neue', sans-serif" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name={p1.name} dataKey="p1" stroke={P1_COLOR} fill={P1_COLOR} fillOpacity={0.25} />
            <Radar name={p2.name} dataKey="p2" stroke={P2_COLOR} fill={P2_COLOR} fillOpacity={0.25} />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "'Bebas Neue', sans-serif" }}
              formatter={(value: string) => <span style={{ color: "var(--text)" }}>{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Stats comparison table */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "6px 12px", marginTop: 16,
          padding: "12px 16px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
          {rows.map(({ label, v1, v2, fmt }) => {
            const f = fmt ?? ((v: number) => String(v));
            const w1 = v1 > v2, w2 = v2 > v1;
            return (
              <Fragment key={label}>
                <div style={{ textAlign: "right", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
                  color: w1 ? P1_COLOR : "var(--muted)" }}>
                  {f(v1)}
                </div>
                <div style={{ textAlign: "center", fontSize: 9, color: "var(--muted)",
                  fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", alignSelf: "center" }}>
                  {label}
                </div>
                <div style={{ textAlign: "left", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
                  color: w2 ? P2_COLOR : "var(--muted)" }}>
                  {f(v2)}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
