import { useAppStore, type SidebarTab } from "../../store/useAppStore";

const TABS: { id: SidebarTab; label: string }[] = [
  { id: "search",   label: "CHERCHE" },
  { id: "favs",     label: "FAVORIS" },
  { id: "session",  label: "SESSION" },
  { id: "compare",  label: "COMPARER" },
  { id: "settings", label: "PARAMS" },
];

export function SidebarNav() {
  const { sidebarTab, setSidebarTab, activeSession } = useAppStore();
  return (
    <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setSidebarTab(t.id)}
          style={{
            flex: 1, padding: "8px 2px", fontSize: 9, fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: "0.05em", border: "none", cursor: "pointer", position: "relative",
            background: sidebarTab === t.id ? "var(--card)" : "transparent",
            color: sidebarTab === t.id ? "var(--accent)" : "var(--muted)",
            borderBottom: sidebarTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "all 0.15s",
          }}
        >
          {t.label}
          {t.id === "session" && activeSession && (
            <span className="pulse-dot" style={{ position: "absolute", top: 4, right: 4 }} />
          )}
        </button>
      ))}
    </div>
  );
}
