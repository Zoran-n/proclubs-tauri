import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

const win = getCurrentWindow();

export function TitleBar() {
  const { activeSession, proxyInfo } = useAppStore();
  return (
    <div data-tauri-drag-region="" style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0, userSelect: "none" }}>
      {/* Left: logo + session badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: "0.2em", color: "var(--accent)" }}>
          PRO <span style={{ color: "var(--text)" }}>CLUBS</span> STATS
        </span>
        {activeSession && (
          <span style={{ fontSize: 9, color: "var(--red)", display: "flex", alignItems: "center", gap: 3 }}>
            <span className="pulse-dot" />
            SESSION
          </span>
        )}
      </div>

      {/* Center: proxy indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, pointerEvents: "none" }}>
        {proxyInfo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--green)", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", padding: "2px 7px", borderRadius: 4 }}>
            <Wifi size={9} />
            PROXY ACTIF
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--muted)", background: "rgba(100,116,139,0.08)", border: "1px solid var(--border)", padding: "2px 7px", borderRadius: 4 }}>
            <WifiOff size={9} />
            DIRECT
          </div>
        )}
      </div>

      {/* Right: window controls */}
      <div style={{ display: "flex", gap: 2 }}>
        <button className="win-btn" onClick={() => win.minimize()}><Minus size={12} /></button>
        <button className="win-btn" onClick={() => win.toggleMaximize()}><Square size={10} /></button>
        <button className="win-btn close-btn" onClick={() => win.close()}><X size={12} /></button>
      </div>
    </div>
  );
}
