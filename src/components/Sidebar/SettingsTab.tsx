import { useState, useEffect } from "react";
import { RefreshCw, Download, Palette, Check } from "lucide-react";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../store/useAppStore";
import { setPendingUpdate, setPendingManualUrl } from "../../utils/pendingUpdate";
import { THEMES } from "../../types";
import { useT, LANGUAGES } from "../../i18n";
import type { Lang } from "../../i18n";

export function SettingsTab() {
  const { theme, darkMode, showAnimations, showLogs, showIdSearch, fontSize, fontFamily,
    customAccent, customBg, customSurface, customCard,
    language, setTheme, setDarkMode, setShowAnimations, setShowLogs,
    setShowIdSearch, setFontSize, setFontFamily, setCustomAccent,
    setCustomBg, setCustomSurface, setCustomCard, setLanguage,
    autoUpdate, setAutoUpdate, setUpdateAvailable, setUpdateInfo,
    navLayout, setNavLayout,
    persistSettings } = useAppStore();
  const t = useT();

  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "downloading" | "up-to-date" | "error">("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState("…");

  useEffect(() => { getVersion().then(setAppVersion).catch(() => {}); }, []);

  // Auto-check on mount if enabled
  useEffect(() => {
    if (autoUpdate) handleCheckUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = (fn: () => void) => { fn(); persistSettings(); };

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    setUpdateVersion(null);
    setUpdateError(null);
    try {
      const update = await checkUpdate();
      if (update?.available) {
        setPendingUpdate(update);
        setUpdateInfo(update.version ?? null, update.body ?? null);
        setUpdateAvailable(true);
        setUpdateVersion(update.version ?? null);
        setUpdateStatus("idle");
      } else {
        setUpdateAvailable(false);
        setPendingUpdate(null);
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
          const url = `https://github.com/Zoran-n/proclubs-tauri/releases/latest`;
          setPendingManualUrl(url);
          setUpdateInfo(result.version ?? null, result.notes ?? null);
          setUpdateAvailable(true);
          setUpdateVersion(result.version ?? null);
          setUpdateStatus("idle");
        } else {
          setUpdateAvailable(false);
          setPendingUpdate(null);
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
          {/* color picker is in the custom theme panel below */}
        </div>
      </div>
      {theme === "custom" && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {([
            { id: "accent",  label: "Accent",      value: customAccent,  setter: setCustomAccent,  inputId: "custom-color-picker",         default: "#00d4ff" },
            { id: "bg",      label: "Background",  value: customBg,      setter: setCustomBg,      inputId: "custom-bg-picker",            default: "#1e1f22" },
            { id: "surface", label: "Surface",     value: customSurface, setter: setCustomSurface, inputId: "custom-surface-picker",       default: "#2b2d31" },
            { id: "card",    label: "Card",        value: customCard,    setter: setCustomCard,    inputId: "custom-card-picker",          default: "#313338" },
          ] as const).map((row) => (
            <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--muted)", width: 68 }}>{row.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => { document.getElementById(row.inputId)?.click(); }}
                    style={{
                      width: 24, height: 24, borderRadius: 5, padding: 0, cursor: "pointer",
                      border: "2px solid var(--border)",
                      background: row.value || row.default,
                    }}
                  />
                  <input id={row.inputId} type="color"
                    value={row.value || row.default}
                    onChange={(e) => { row.setter(e.target.value); persistSettings(); }}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>
                  {row.value || row.default}
                </span>
                {row.value && (
                  <button
                    onClick={() => { row.setter(""); persistSettings(); }}
                    title="Réinitialiser"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
                      fontSize: 10, padding: "0 2px", marginLeft: "auto" }}
                  >↺</button>
                )}
              </div>
            </div>
          ))}
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

      {/* Navigation layout */}
      <div style={{ padding: "8px 0" }}>
        <span style={{ fontSize: 13, color: "var(--text)", display: "block", marginBottom: 8 }}>
          Disposition de la navigation
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {([
            { id: "horizontal", label: "Horizontale", desc: "Barre en haut" },
            { id: "vertical",   label: "Verticale",   desc: "Panneau à gauche" },
          ] as const).map((opt) => {
            const active = navLayout === opt.id;
            return (
              <button key={opt.id}
                onClick={() => { setNavLayout(opt.id); persistSettings(); }}
                aria-pressed={active}
                style={{
                  flex: 1, padding: "8px 6px",
                  background: active ? "rgba(var(--accent-rgb,0,212,255),0.12)" : "var(--hover)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}
              >
                {/* Mini preview icon */}
                <div style={{ width: 36, height: 24, borderRadius: 3, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, position: "relative", overflow: "hidden", background: "var(--bg)" }}>
                  {opt.id === "horizontal" ? (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: active ? "var(--accent)" : "var(--muted)", opacity: 0.6 }} />
                  ) : (
                    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 8, background: active ? "var(--accent)" : "var(--muted)", opacity: 0.6 }} />
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? "var(--accent)" : "var(--text)" }}>{opt.label}</span>
                <span style={{ fontSize: 9, color: "var(--muted)" }}>{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

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
      <Toggle
        label={t("settings.autoUpdate")}
        value={autoUpdate}
        onChange={(v) => { setAutoUpdate(v); persistSettings(); }}
      />
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
        {updateStatus === "checking"  && <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> {t("settings.checking")}</>}
        {updateStatus === "up-to-date" && <><Check size={14} /> {t("settings.upToDate")}</>}
        {updateStatus === "error"      && <><RefreshCw size={14} /> {t("settings.retry")}</>}
        {updateStatus === "idle" && !updateVersion && <><RefreshCw size={14} /> {t("settings.checkUpdates")}</>}
        {updateStatus === "idle" && updateVersion  && <><Download size={14} /> v{updateVersion} {t("settings.available")}</>}
      </button>
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
