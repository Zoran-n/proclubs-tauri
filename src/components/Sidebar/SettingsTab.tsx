import { useState, useEffect } from "react";
import { RefreshCw, Download, ExternalLink, Palette, Check } from "lucide-react";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../../store/useAppStore";
import { THEMES } from "../../types";
import { useT, LANGUAGES } from "../../i18n";
import type { Lang } from "../../i18n";

export function SettingsTab() {
  const { theme, darkMode, showAnimations, showLogs, showIdSearch, fontSize, fontFamily, customAccent,
    language, setTheme, setDarkMode, setShowAnimations, setShowLogs,
    setShowIdSearch, setFontSize, setFontFamily, setCustomAccent, setLanguage, persistSettings } = useAppStore();
  const t = useT();

  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "downloading" | "up-to-date" | "error">("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState("…");
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  useEffect(() => { getVersion().then(setAppVersion).catch(() => {}); }, []);

  const apply = (fn: () => void) => { fn(); persistSettings(); };

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    setUpdateVersion(null);
    setUpdateError(null);
    setUpdateUrl(null);
    try {
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

  const Section = ({ label }: { label: string }) => (
    <div className="category-header" style={{ padding: "16px 0 4px", margin: 0 }}>
      {label}
    </div>
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0" }} role="switch" aria-checked={value} aria-label={label} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); apply(() => onChange(!value)); } }}>
      <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>
      <div onClick={() => apply(() => onChange(!value))} style={{
        width: 40, height: 24, borderRadius: 12, flexShrink: 0, cursor: "pointer",
        background: value ? "var(--green)" : "var(--border)",
        position: "relative", transition: "background 0.15s",
      }}>
        <div style={{
          position: "absolute", top: 3, left: value ? 19 : 3,
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px 20px" }} role="region" aria-label={t("settings.title")}>

      {/* ── APPARENCE ── */}
      <Section label={t("settings.appearance")} />
      <Toggle label={t("settings.darkMode")} value={darkMode} onChange={setDarkMode} />

      {/* ── LANGUE ── */}
      <Section label={t("settings.language")} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {LANGUAGES.map((l) => {
          const active = language === l.id;
          return (
            <button key={l.id} onClick={() => apply(() => setLanguage(l.id as Lang))}
              aria-pressed={active}
              style={{
                flex: 1, minWidth: 60, padding: "6px 4px",
                background: active ? "var(--accent)" : "var(--hover)",
                color: active ? "#fff" : "var(--text)",
                border: "none", borderRadius: 4, cursor: "pointer",
                fontSize: 11, fontWeight: active ? 700 : 400,
                transition: "all 0.1s",
              }}>
              <div style={{ fontSize: 10, marginBottom: 1 }}>{l.flag}</div>
              {l.label}
            </button>
          );
        })}
      </div>

      {/* ── THEME DE COULEUR ── */}
      <Section label={t("settings.accentColor")} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {THEMES.map((th) => {
          const active = theme === th.id;
          return (
            <button key={th.id} title={th.label} onClick={() => apply(() => setTheme(th.id))}
              aria-pressed={active}
              style={{
                width: 32, height: 32, borderRadius: "50%", padding: 0, cursor: "pointer",
                border: active ? `3px solid var(--text)` : "3px solid transparent",
                background: th.color,
                transition: "all 0.15s", flexShrink: 0,
                boxShadow: active ? `0 0 0 2px ${th.color}` : "none",
              }} />
          );
        })}
        {/* Custom color button */}
        <div style={{ position: "relative" }}>
          <button title={t("settings.custom")} onClick={() => {
            const el = document.getElementById("custom-color-picker");
            if (el) el.click();
          }} aria-pressed={theme === "custom"} style={{
            width: 32, height: 32, borderRadius: "50%", padding: 0, cursor: "pointer",
            border: theme === "custom" ? `3px solid var(--text)` : "3px solid transparent",
            background: theme === "custom" ? (customAccent || "#888") : "linear-gradient(135deg, #ff0000, #00ff00, #0000ff)",
            transition: "all 0.15s", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: theme === "custom" ? `0 0 0 2px ${customAccent}` : "none",
          }}>
            {theme !== "custom" && <Palette size={14} color="#fff" />}
          </button>
          <input id="custom-color-picker" type="color" aria-label={t("settings.custom")}
            value={customAccent || "#00d4ff"}
            onChange={(e) => { setCustomAccent(e.target.value); persistSettings(); }}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
          />
        </div>
      </div>
      {theme === "custom" && (
        <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: customAccent }} />
          {customAccent}
        </div>
      )}

      {/* ── TAILLE DU TEXTE ── */}
      <Section label={t("settings.textSize")} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>A</span>
        <input
          type="range" min={10} max={20} step={1}
          value={fontSize}
          onChange={(e) => apply(() => setFontSize(Number(e.target.value)))}
          className="settings-slider"
          aria-label={t("settings.textSize")}
        />
        <span style={{ fontSize: 15, color: "var(--muted)", flexShrink: 0 }}>A</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
        {fontSize}px
      </div>

      {/* ── POLICE ── */}
      <Section label={t("settings.font")} />
      <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
        {([
          { id: "barlow",  label: "Barlow",  font: '"Barlow", sans-serif' },
          { id: "inter",   label: "Inter",   font: '"Inter", sans-serif' },
          { id: "roboto",  label: "Roboto",  font: '"Roboto", sans-serif' },
          { id: "system",  label: t("settings.system"), font: 'system-ui, sans-serif' },
        ] as const).map((f) => {
          const active = fontFamily === f.id;
          return (
            <button key={f.id} onClick={() => apply(() => setFontFamily(f.id))}
              aria-pressed={active}
              style={{
                flex: 1, padding: "6px 4px",
                background: active ? "var(--accent)" : "var(--hover)",
                color: active ? "#fff" : "var(--text)",
                border: "none", borderRadius: 4, cursor: "pointer",
                fontSize: 12, fontWeight: active ? 600 : 400,
                fontFamily: f.font,
                transition: "all 0.1s",
              }}>{f.label}</button>
          );
        })}
      </div>

      {/* ── EFFETS VISUELS ── */}
      <Section label={t("settings.effects")} />
      <Toggle label={t("settings.animations")} value={showAnimations} onChange={setShowAnimations} />

      {/* ── INTERFACE ── */}
      <Section label={t("settings.interface")} />
      <Toggle label={t("settings.showLogs")}  value={showLogs}     onChange={setShowLogs} />
      <Toggle label={t("settings.idSearch")}   value={showIdSearch} onChange={setShowIdSearch} />

      {/* ── RACCOURCIS ── */}
      <Section label={t("settings.shortcuts")} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
        {[
          { keys: "F11",           label: t("shortcut.fullscreen") },
          { keys: "Ctrl+F",       label: t("shortcut.search") },
          { keys: "Ctrl+E",       label: t("shortcut.export") },
          { keys: "Ctrl+1-5",     label: t("nav.players") + " / " + t("nav.matches") + " / ..." },
          { keys: "Ctrl+Shift+D", label: t("shortcut.devPanel") },
        ].map((s) => (
          <div key={s.keys} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "4px 0",
          }}>
            <span style={{ fontSize: 12, color: "var(--text)" }}>{s.label}</span>
            <kbd style={{
              padding: "2px 6px", background: "var(--hover)", borderRadius: 3,
              fontSize: 10, fontWeight: 700, color: "var(--accent)",
              border: "1px solid var(--border)", fontFamily: "monospace",
            }}>{s.keys}</kbd>
          </div>
        ))}
      </div>

      {/* ── MISES A JOUR ── */}
      <Section label={t("settings.updates")} />
      <button onClick={handleCheckUpdate}
        disabled={updateStatus === "checking" || updateStatus === "downloading"}
        style={{
          width: "100%", padding: "8px 10px",
          background: updateStatus === "up-to-date" ? "rgba(35,165,89,0.15)"
            : updateStatus === "error" ? "rgba(218,55,60,0.15)"
            : "var(--hover)",
          border: "none",
          color: updateStatus === "up-to-date" ? "var(--green)"
            : updateStatus === "error" ? "var(--red)"
            : "var(--text)",
          borderRadius: 4, cursor: updateStatus === "checking" || updateStatus === "downloading" ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 13, fontWeight: 600,
          opacity: updateStatus === "checking" || updateStatus === "downloading" ? 0.7 : 1,
          transition: "all 0.15s",
        }}>
        {updateStatus === "checking" && <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> {t("settings.checking")}</>}
        {updateStatus === "downloading" && !updateUrl && <><Download size={14} /> {t("settings.installing")} v{updateVersion}…</>}
        {updateStatus === "downloading" && updateUrl && <><ExternalLink size={14} /> v{updateVersion} {t("settings.available")}</>}
        {updateStatus === "up-to-date" && <><Check size={14} /> {t("settings.upToDate")}</>}
        {updateStatus === "error" && <><RefreshCw size={14} /> {t("settings.retry")}</>}
        {updateStatus === "idle" && <><RefreshCw size={14} /> {t("settings.checkUpdates")}</>}
      </button>
      {updateStatus === "downloading" && updateUrl && (
        <button onClick={() => openUrl(updateUrl)} style={{
          width: "100%", marginTop: 6, padding: "8px 10px",
          background: "var(--accent)", color: "#fff", border: "none",
          borderRadius: 4, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 13, fontWeight: 600,
        }}>
          <Download size={14} /> {t("settings.download")} v{updateVersion}
        </button>
      )}
      {updateStatus === "error" && updateError && (
        <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(218,55,60,0.1)", borderRadius: 4 }}>
          <p style={{ fontSize: 10, color: "var(--red)", fontFamily: "monospace", wordBreak: "break-all",
            lineHeight: 1.5 }}>{updateError}</p>
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--muted)" }}>ProClubs Stats v{appVersion}</p>
        <p style={{ fontSize: 10, color: "var(--border)", marginTop: 2 }}>Tauri 2 · Rust · React</p>
      </div>
    </div>
  );
}
