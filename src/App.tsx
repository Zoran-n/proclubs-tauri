import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { TitleBar } from "./components/Layout/TitleBar";
import { GuildBar } from "./components/Layout/GuildBar";
import { Sidebar } from "./components/Layout/Sidebar";
import { MainPanel } from "./components/Layout/MainPanel";
import { DevPanel } from "./components/DevPanel/DevPanel";
import { SearchModal } from "./components/ui/SearchModal";
import { useAppStore } from "./store/useAppStore";
import { checkProxy } from "./api/tauri";

function App() {
  const {
    loadSettings, theme, showGrid, showAnimations, darkMode, fontSize,
    addRawLog, toggleDevPanel, showDevPanel, setProxyInfo,
  } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--fs", `${fontSize}px`);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        toggleDevPanel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleDevPanel]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg)", position: "relative" }}>
      <div id="grid-overlay" />
      <TitleBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", zIndex: 2 }}>
        {/* Discord-style guild/server icon bar */}
        <GuildBar />
        {/* Channel sidebar */}
        <Sidebar />
        {/* Main content */}
        <MainPanel />
      </div>
      {showDevPanel && <DevPanel />}
      <SearchModal />
    </div>
  );
}

export default App;
