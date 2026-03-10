import { useEffect } from "react";
import { TitleBar } from "./components/Layout/TitleBar";
import { Sidebar } from "./components/Layout/Sidebar";
import { MainPanel } from "./components/Layout/MainPanel";
import { useAppStore } from "./store/useAppStore";

function App() {
  const { loadSettings, theme } = useAppStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden" style={{ background: "#090c10" }}>
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>
    </div>
  );
}

export default App;
