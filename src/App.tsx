import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TitleBar } from "./components/Layout/TitleBar";
import { GuildBar } from "./components/Layout/GuildBar";
import { Sidebar } from "./components/Layout/Sidebar";
import { MainPanel } from "./components/Layout/MainPanel";
import { DevPanel } from "./components/DevPanel/DevPanel";
import { SearchModal } from "./components/ui/SearchModal";
import { GlobalSearchModal } from "./components/ui/GlobalSearchModal";
import { Onboarding } from "./components/ui/Onboarding";
import { ToastContainer } from "./components/ui/Toast";
import { UpdateModal } from "./components/ui/UpdateModal";
import { useAppStore } from "./store/useAppStore";
import { checkProxy } from "./api/tauri";

const win = getCurrentWindow();

function App() {
  const {
    loadSettings, theme, showGrid, showAnimations, darkMode, fontSize,
    addRawLog, toggleDevPanel, showDevPanel, setProxyInfo,
    setSidebarTab, setActiveTab, onboarded, settingsLoaded, toggleGlobalSearch,
  } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    document.documentElement.style.setProperty("--fs", `${fontSize}px`);
    root.toggleAttribute("data-no-grid", !showGrid);
    root.toggleAttribute("data-no-anim", !showAnimations);
    root.toggleAttribute("data-light", !darkMode);
    loadSettings();
    checkProxy().then((p) => setProxyInfo(p)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unlisten = listen<string>("api_log", (event) => {
      addRawLog(event.payload);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [addRawLog]);

  // ── Global keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // F11 → Fullscreen toggle
      if (e.key === "F11") {
        e.preventDefault();
        win.isFullscreen().then((fs) => win.setFullscreen(!fs));
        return;
      }
      // Ctrl+Shift+D → Dev panel
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        toggleDevPanel();
        return;
      }
      // Skip shortcuts when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Ctrl+F → Focus search
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        setSidebarTab("search");
        setTimeout(() => {
          const el = document.querySelector<HTMLInputElement>('input[placeholder*="echerch"], input[placeholder*="earch"], input[placeholder*="uscar"], input[placeholder*="uchen"], input[placeholder*="esquis"]');
          el?.focus();
        }, 50);
        return;
      }
      // Ctrl+E → Export (dispatches a custom event caught by active tab)
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("shortcut:export"));
        return;
      }
      // Ctrl+K → Global search
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        toggleGlobalSearch();
        return;
      }
      // Ctrl+1..5 → Switch tabs
      if (e.ctrlKey && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const tabs = ["players", "matches", "charts", "session", "compare"] as const;
        const idx = Number(e.key) - 1;
        setActiveTab(tabs[idx]);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleDevPanel, setSidebarTab, setActiveTab, toggleGlobalSearch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg)", position: "relative" }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div id="grid-overlay" />
      <TitleBar showDiscordLayout />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", zIndex: 2 }}>
        <GuildBar />
        <Sidebar />
        <MainPanel />
      </div>
      {showDevPanel && <DevPanel />}
      <SearchModal />
      <GlobalSearchModal />
      {settingsLoaded && !onboarded && <Onboarding />}
      <UpdateModal />
      <ToastContainer />
    </div>
  );
}

export default App;
