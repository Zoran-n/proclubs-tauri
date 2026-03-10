import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const win = getCurrentWindow();

export function TitleBar() {
  return (
    <div
      data-tauri-drag-region=""
      className="h-9 flex items-center justify-between px-4 bg-[#0d1117] border-b border-white/5 select-none shrink-0"
    >
      {/* Logo + title */}
      <div className="flex items-center gap-2 pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        <span
          className="text-sm tracking-[0.2em] font-bold text-[var(--accent)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.25em" }}
        >
          PROCLUBS STATS
        </span>
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => win.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => win.toggleMaximize()}
          className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => win.close()}
          className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
