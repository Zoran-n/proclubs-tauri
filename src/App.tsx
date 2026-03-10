import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { TitleBar } from "./components/Layout/TitleBar";
import { Sidebar } from "./components/Layout/Sidebar";
import { MainPanel } from "./components/Layout/MainPanel";
import { DevPanel } from "./components/DevPanel/DevPanel";
import { useAppStore } from "./store/useAppStore";
import { checkProxy } from "./api/tauri";

function App() {
  const {
    loadSettings, theme, showGrid, showAnimations, darkMode, fontSize,
    addRawLog, toggleDevPanel, showDevPanel, setProxyInfo,
  } = useAppStore();

  // Apply theme + CSS attributes on mount
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-fs", fontSize);
    root.toggleAttribute("data-no-grid", !showGrid);
    root.toggleAttribute("data-no-anim", !showAnimations);
    root.toggleAttribute("data-light", !darkMode);
    loadSettings();
    // Check proxy
    checkProxy().then((p) => setProxyInfo(p)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to Rust api_log events → rawLogs
  useEffect(() => {
    const unlisten = listen<string>("api_log", (event) => {
      addRawLog(event.payload);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [addRawLog]);

  // Ctrl+Shift+D → toggle dev panel
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
      <TitleBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <MainPanel />
      </div>
      {showDevPanel && <DevPanel />}
    </div>
  );
}

export default App;
