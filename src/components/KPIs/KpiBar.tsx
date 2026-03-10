import { useAppStore } from "../../store/useAppStore";

export function KpiBar() {
  const { currentClub } = useAppStore();
  if (!currentClub) return null;

  const total = currentClub.wins + currentClub.losses + currentClub.ties;
  const winPct = total > 0 ? Math.round((currentClub.wins / total) * 100) : 0;

  const items = [
    { label: "MJ", value: total },
    { label: "V", value: currentClub.wins, color: "var(--green)" },
    { label: "N", value: currentClub.ties, color: "#eab308" },
    { label: "D", value: currentClub.losses, color: "var(--red)" },
    { label: "%V", value: `${winPct}%`, color: "var(--accent)" },
    { label: "BUTS", value: currentClub.goals, color: "var(--accent)" },
  ];

  return (
    <div style={{ display: "flex", background: "var(--card)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRight: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: color ?? "var(--text)", lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.05em" }}>{label}</p>
        </div>
      ))}
    </div>
  );
}
