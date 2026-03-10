import { Search, Play, GitCompare, Settings } from "lucide-react";
import { useAppStore, type SidebarTab } from "../../store/useAppStore";
import { SearchTab } from "../Sidebar/SearchTab";
import { SessionSidebarTab } from "../Sidebar/SessionSidebarTab";
import { CompareTab } from "../Sidebar/CompareTab";
import { SettingsTab } from "../Sidebar/SettingsTab";

const TABS: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
  { id: "search", icon: <Search size={18} />, label: "Recherche" },
  { id: "session", icon: <Play size={18} />, label: "Session" },
  { id: "compare", icon: <GitCompare size={18} />, label: "Comparaison" },
  { id: "settings", icon: <Settings size={18} />, label: "Paramètres" },
];

export function Sidebar() {
  const { sidebarTab, setSidebarTab } = useAppStore();

  return (
    <aside className="w-[255px] flex shrink-0 h-full border-r border-white/5">
      {/* Tab icon strip */}
      <div className="w-12 flex flex-col items-center py-3 gap-1 bg-[#090c10] border-r border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            title={tab.label}
            onClick={() => setSidebarTab(tab.id)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              sidebarTab === tab.id
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
        {sidebarTab === "search" && <SearchTab />}
        {sidebarTab === "session" && <SessionSidebarTab />}
        {sidebarTab === "compare" && <CompareTab />}
        {sidebarTab === "settings" && <SettingsTab />}
      </div>
    </aside>
  );
}
