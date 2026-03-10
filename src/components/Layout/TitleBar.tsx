import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

const win = getCurrentWindow();

export function TitleBar() {
  const activeSession = useAppStore((s) => s.activeSession);
  return (
    <div data-tauri-drag-region="" className="titlebar" style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0, userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.2em", color: "var(--accent)" }}>
          PRO <span style={{ color: "var(--text)" }}>CLUBS</span> STATS
        </span>
        {activeSession && (
          <span style={{ marginLeft: 8, fontSize: 10, color: "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
            <span className="pulse-dot" />
            SESSION ACTIVE
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button className="win-btn" onClick={() => win.minimize()}><Minus size={12} /></button>
        <button className="win-btn" onClick={() => win.toggleMaximize()}><Square size={10} /></button>
        <button className="win-btn close-btn" onClick={() => win.close()}><X size={12} /></button>
      </div>
    </div>
  );
}
