import { useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export function DevPanel() {
  const { logs, rawLogs, clearRawLogs, toggleDevPanel, proxyInfo } = useAppStore();
  const rawRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rawRef.current?.scrollTo(0, rawRef.current.scrollHeight);
  }, [rawLogs]);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [logs]);

  const classify = (line: string): string => {
    if (line.startsWith("→") || line.startsWith("←")) return "api";
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("erreur")) return "err";
    if (line.toLowerCase().includes("ok") || line.toLowerCase().includes("résultat")) return "ok";
    return "info";
  };

  return (
    <div className="dev-panel">
      <div className="dev-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.15em", color: "var(--accent)" }}>
            DEV PANEL
          </span>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: proxyInfo ? "rgba(34,197,94,0.2)" : "rgba(100,116,139,0.2)", color: proxyInfo ? "var(--green)" : "var(--muted)", border: `1px solid ${proxyInfo ? "var(--green)" : "var(--border)"}` }}>
            {proxyInfo ? `PROXY: ${proxyInfo}` : "DIRECT"}
          </span>
          <span style={{ fontSize: 9, color: "var(--muted)" }}>Ctrl+Shift+D</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={clearRawLogs} title="Vider les logs API" style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex" }}>
            <Trash2 size={12} />
          </button>
          <button onClick={toggleDevPanel} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* API Traffic */}
        <div style={{ padding: "6px 8px 4px", fontSize: 9, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          TRAFIC API ({rawLogs.length})
        </div>
        <div ref={rawRef} className="dev-panel-body" style={{ flex: "0 0 55%", borderBottom: "1px solid var(--border)" }}>
          {rawLogs.length === 0 ? (
            <span style={{ color: "var(--muted)", fontSize: 10 }}>Aucun trafic — lance une recherche</span>
          ) : (
            rawLogs.map((line, i) => (
              <div key={i} className={`dev-log-entry ${classify(line)}`}>{line}</div>
            ))
          )}
        </div>

        {/* App Logs */}
        <div style={{ padding: "6px 8px 4px", fontSize: 9, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em", flexShrink: 0 }}>
          LOGS APP ({logs.length})
        </div>
        <div ref={logRef} className="dev-panel-body" style={{ flex: 1 }}>
          {logs.map((line, i) => (
            <div key={i} className={`dev-log-entry ${classify(line)}`}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
