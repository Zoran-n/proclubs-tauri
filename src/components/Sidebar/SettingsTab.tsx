import { useState, useEffect } from "react";
import { Check, RefreshCw, Download, ExternalLink } from "lucide-react";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../../store/useAppStore";
import { THEMES } from "../../types";

export function SettingsTab() {
  const { theme, darkMode, showAnimations, showLogs, showIdSearch, fontSize,
    proxyUrl, setTheme, setDarkMode, setShowAnimations, setShowLogs,
    setShowIdSearch, setFontSize, persistSettings, applyProxy } = useAppStore();

  const [localProxy, setLocalProxy] = useState(proxyUrl);
  const [proxySaved, setProxySaved] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "downloading" | "up-to-date" | "error">("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState("…");

  useEffect(() => { getVersion().then(setAppVersion).catch(() => {}); }, []);

  const apply = (fn: () => void) => { fn(); persistSettings(); };

  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    setUpdateVersion(null);
    setUpdateError(null);
    setUpdateUrl(null);
    try {
      // Try plugin updater first (supports auto-install)
      const update = await checkUpdate();
      if (update?.available) {
        setUpdateVersion(update.version);
        setUpdateStatus("downloading");
        await update.downloadAndInstall();
        await relaunch();
      } else {
        setUpdateStatus("up-to-date");
        setTimeout(() => setUpdateStatus("idle"), 3000);
      }
    } catch (pluginErr) {
      console.warn("[updater] plugin failed, trying manual check...", pluginErr);
      try {
        // Fallback: check via our own Rust backend (reqwest)
        const result = await invoke<{ available: boolean; version: string; notes: string; url: string }>(
          "check_for_update", { currentVersion: appVersion }
        );
        if (result.available) {
          setUpdateVersion(result.version);
          setUpdateUrl(`https://github.com/Zoran-n/proclubs-tauri/releases/latest`);
          setUpdateStatus("downloading");
        } else {
          setUpdateStatus("up-to-date");
          setTimeout(() => setUpdateStatus("idle"), 3000);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[updater]", msg);
        setUpdateError(msg);
        setUpdateStatus("error");
        setTimeout(() => { setUpdateStatus("idle"); setUpdateError(null); }, 10000);
      }
    }
  };

  const saveProxy = async () => {
    await applyProxy(localProxy);
    await persistSettings();
    setProxySaved(true);
    setTimeout(() => setProxySaved(false), 2000);
  };

  const Section = ({ label }: { label: string }) => (
    <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif",
      letterSpacing: "0.1em", marginTop: 18, marginBottom: 8 }}>
      {label}
    </div>
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>
      <div onClick={() => apply(() => onChange(!value))} style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, cursor: "pointer",
        background: value ? "var(--accent)" : "rgba(255,255,255,0.12)",
        position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          position: "absolute", top: 3, left: value ? 17 : 3,
          width: 14, height: 14, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 14px 20px" }}>

      {/* ── APPARENCE ── */}
      <Section label="APPARENCE" />
      <Toggle label="Mode sombre" value={darkMode} onChange={setDarkMode} />

      {/* ── THEME DE COULEUR ── */}
      <Section label="THEME DE COULEUR" />
      <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button key={t.id} title={t.label} onClick={() => apply(() => setTheme(t.id))} style={{
              width: 38, height: 38, borderRadius: 8, padding: 0, cursor: "pointer",
              border: active ? `2px solid ${t.color}` : "2px solid var(--border)",
              background: `linear-gradient(135deg, #0d1117 50%, ${t.color} 50%)`,
              transform: active ? "scale(1.12)" : "scale(1)",
              transition: "all 0.15s", flexShrink: 0,
              outline: active ? `2px solid ${t.color}` : "none",
              outlineOffset: 2,
            }} />
          );
        })}
      </div>

      {/* ── TAILLE DU TEXTE ── */}
      <Section label="TAILLE DU TEXTE" />
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        {(["small", "medium", "large"] as const).map((s, i) => {
          const active = fontSize === s;
          const sizes = [11, 14, 17];
          return (
            <button key={s} onClick={() => apply(() => setFontSize(s))} style={{
              flex: 1, padding: "8px 4px",
              background: active ? "var(--accent)" : "var(--card)",
              color: active ? "#000" : "var(--text)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 6, cursor: "pointer",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: sizes[i], lineHeight: 1,
              transition: "all 0.15s",
            }}>A</button>
          );
        })}
      </div>

      {/* ── EFFETS VISUELS ── */}
      <Section label="EFFETS VISUELS" />
      <Toggle label="Animations" value={showAnimations} onChange={setShowAnimations} />

      {/* ── INTERFACE ── */}
      <Section label="INTERFACE" />
      <Toggle label="Afficher les logs"  value={showLogs}     onChange={setShowLogs} />
      <Toggle label="Recherche par ID"   value={showIdSearch} onChange={setShowIdSearch} />

      {/* ── PROXY ── */}
      <Section label="PROXY HTTP/SOCKS5" />
      <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8, lineHeight: 1.6 }}>
        Contourne le blocage Akamai de l'API EA.<br />
        Ex: <span style={{ color: "var(--accent)", fontFamily: "monospace" }}>http://user:pass@host:port</span>
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={localProxy} onChange={(e) => setLocalProxy(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveProxy()}
          placeholder="http://... ou socks5://..."
          style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)",
            padding: "6px 8px", borderRadius: 4, fontSize: 11, outline: "none", fontFamily: "monospace" }}
        />
        <button onClick={saveProxy} style={{
          padding: "6px 10px", background: proxySaved ? "var(--green)" : "var(--accent)",
          color: "#000", border: "none", borderRadius: 4, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, fontSize: 11,
          transition: "background 0.2s", flexShrink: 0,
        }}>
          {proxySaved ? <><Check size={12} /> OK</> : "Appliquer"}
        </button>
      </div>
      {proxyUrl && (
        <p style={{ fontSize: 10, color: "var(--green)", marginTop: 6 }}>✓ Proxy actif</p>
      )}

      {/* ── MISES À JOUR ── */}
      <Section label="MISES À JOUR" />
      <button onClick={handleCheckUpdate}
        disabled={updateStatus === "checking" || updateStatus === "downloading"}
        style={{
          width: "100%", padding: "8px 10px",
          background: updateStatus === "up-to-date" ? "rgba(0,255,136,0.1)"
            : updateStatus === "error" ? "rgba(239,68,68,0.1)"
            : "var(--card)",
          border: `1px solid ${updateStatus === "up-to-date" ? "var(--green)"
            : updateStatus === "error" ? "rgba(239,68,68,0.5)"
            : "var(--border)"}`,
          color: updateStatus === "up-to-date" ? "var(--green)"
            : updateStatus === "error" ? "#ef4444"
            : "var(--text)",
          borderRadius: 6, cursor: updateStatus === "checking" || updateStatus === "downloading" ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 12, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
          opacity: updateStatus === "checking" || updateStatus === "downloading" ? 0.7 : 1,
          transition: "all 0.2s",
        }}>
        {updateStatus === "checking" && <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> VÉRIFICATION…</>}
        {updateStatus === "downloading" && !updateUrl && <><Download size={12} /> INSTALLATION v{updateVersion}…</>}
        {updateStatus === "downloading" && updateUrl && <><ExternalLink size={12} /> v{updateVersion} DISPONIBLE</>}
        {updateStatus === "up-to-date" && <><Check size={12} /> À JOUR</>}
        {updateStatus === "error" && <><RefreshCw size={12} /> ERREUR — RÉESSAYER</>}
        {updateStatus === "idle" && <><RefreshCw size={12} /> VÉRIFIER LES MISES À JOUR</>}
      </button>
      {updateStatus === "downloading" && updateUrl && (
        <button onClick={() => openUrl(updateUrl)} style={{
          width: "100%", marginTop: 6, padding: "8px 10px",
          background: "var(--accent)", color: "#000", border: "none",
          borderRadius: 6, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 12, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
        }}>
          <Download size={12} /> TÉLÉCHARGER v{updateVersion}
        </button>
      )}
      {updateStatus === "error" && updateError && (
        <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6 }}>
          <p style={{ fontSize: 9, color: "#ef4444", fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: "0.08em", marginBottom: 4 }}>ERREUR DE MISE A JOUR</p>
          <p style={{ fontSize: 10, color: "#ef4444", fontFamily: "monospace", wordBreak: "break-all",
            lineHeight: 1.5, opacity: 0.85 }}>{updateError}</p>
        </div>
      )}

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, color: "var(--muted)" }}>ProClubs Stats v{appVersion}</p>
        <p style={{ fontSize: 10, color: "var(--border)" }}>Tauri 2 · Rust · React</p>
      </div>
    </div>
  );
}
