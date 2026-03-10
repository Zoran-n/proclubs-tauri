import { useState } from "react";
import { Save, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { FORMATIONS, type Tactic } from "../../types";

// Formation positions: [x, y] in SVG coords (0-100% of pitch)
const FORMATION_POSITIONS: Record<string, { x: number; y: number; role: string }[]> = {
  "4-4-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 15, y: 45, role: "LM" }, { x: 37, y: 45, role: "CM" }, { x: 63, y: 45, role: "CM" }, { x: 85, y: 45, role: "RM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "4-3-3": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 25, y: 45, role: "CM" }, { x: 50, y: 45, role: "CDM" }, { x: 75, y: 45, role: "CM" },
    { x: 15, y: 20, role: "LW" }, { x: 50, y: 20, role: "ST" }, { x: 85, y: 20, role: "RW" },
  ],
  "4-2-3-1": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 35, y: 55, role: "CDM" }, { x: 65, y: 55, role: "CDM" },
    { x: 15, y: 35, role: "LM" }, { x: 50, y: 35, role: "CAM" }, { x: 85, y: 35, role: "RM" },
    { x: 50, y: 15, role: "ST" },
  ],
  "3-5-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 25, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 75, y: 68, role: "CB" },
    { x: 10, y: 45, role: "LM" }, { x: 30, y: 45, role: "CM" }, { x: 50, y: 45, role: "CDM" }, { x: 70, y: 45, role: "CM" }, { x: 90, y: 45, role: "RM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "4-1-2-1-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 70, role: "LB" }, { x: 37, y: 70, role: "CB" }, { x: 63, y: 70, role: "CB" }, { x: 85, y: 70, role: "RB" },
    { x: 50, y: 57, role: "CDM" },
    { x: 25, y: 43, role: "CM" }, { x: 75, y: 43, role: "CM" },
    { x: 50, y: 30, role: "CAM" },
    { x: 30, y: 15, role: "ST" }, { x: 70, y: 15, role: "ST" },
  ],
  "5-3-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 10, y: 68, role: "LWB" }, { x: 28, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 72, y: 68, role: "CB" }, { x: 90, y: 68, role: "RWB" },
    { x: 25, y: 45, role: "CM" }, { x: 50, y: 45, role: "CM" }, { x: 75, y: 45, role: "CM" },
    { x: 35, y: 20, role: "ST" }, { x: 65, y: 20, role: "ST" },
  ],
  "4-5-1": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 10, y: 45, role: "LM" }, { x: 30, y: 45, role: "CM" }, { x: 50, y: 45, role: "CM" }, { x: 70, y: 45, role: "CM" }, { x: 90, y: 45, role: "RM" },
    { x: 50, y: 18, role: "ST" },
  ],
  "3-4-3": [
    { x: 50, y: 90, role: "GK" },
    { x: 25, y: 68, role: "CB" }, { x: 50, y: 68, role: "CB" }, { x: 75, y: 68, role: "CB" },
    { x: 15, y: 48, role: "LM" }, { x: 37, y: 48, role: "CM" }, { x: 63, y: 48, role: "CM" }, { x: 85, y: 48, role: "RM" },
    { x: 15, y: 20, role: "LW" }, { x: 50, y: 20, role: "ST" }, { x: 85, y: 20, role: "RW" },
  ],
  "4-2-2-2": [
    { x: 50, y: 90, role: "GK" },
    { x: 15, y: 68, role: "LB" }, { x: 37, y: 68, role: "CB" }, { x: 63, y: 68, role: "CB" }, { x: 85, y: 68, role: "RB" },
    { x: 35, y: 52, role: "CDM" }, { x: 65, y: 52, role: "CDM" },
    { x: 25, y: 33, role: "CAM" }, { x: 75, y: 33, role: "CAM" },
    { x: 35, y: 15, role: "ST" }, { x: 65, y: 15, role: "ST" },
  ],
};

const SLIDERS = [
  { key: "defensiveStyle", label: "Style défensif" },
  { key: "defensiveWidth", label: "Largeur (déf)" },
  { key: "defensiveDepth", label: "Profondeur" },
  { key: "offensiveStyle", label: "Style offensif" },
  { key: "offensiveWidth", label: "Largeur (off)" },
  { key: "playersInBox", label: "Joueurs dans la boîte" },
];

const defaultTactic = (): Tactic => ({
  id: Date.now().toString(),
  name: "Nouvelle tactique",
  formation: "4-3-3",
  sliders: Object.fromEntries(SLIDERS.map((s) => [s.key, 50])),
  notes: "",
  eaCode: "",
});

export function TacticsTab() {
  const { tactics, addTactic, deleteTactic, persistSettings } = useAppStore();
  const [current, setCurrent] = useState<Tactic>(defaultTactic());

  const handleSave = () => {
    addTactic(current);
    persistSettings();
  };

  const handleLoad = (t: Tactic) => setCurrent({ ...t });
  const handleDelete = (id: string) => {
    deleteTactic(id);
    persistSettings();
    if (current.id === id) setCurrent(defaultTactic());
  };

  const positions = FORMATION_POSITIONS[current.formation] ?? FORMATION_POSITIONS["4-3-3"];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: pitch */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
        {/* Formation selector */}
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATIONS.map((f) => (
            <button
              key={f}
              onClick={() => setCurrent((c) => ({ ...c, formation: f }))}
              className={`py-1.5 rounded text-xs font-medium transition-colors ${
                current.formation === f
                  ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                  : "bg-[#111820] text-slate-400 border border-white/10 hover:border-[var(--accent)]/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* SVG Pitch */}
        <div className="bg-[#0a1f0a] rounded-xl border border-white/10 overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: "3/4" }}>
            {/* Pitch markings */}
            <rect x="0" y="0" width="100" height="100" fill="#0d2010" />
            {/* Stripes */}
            {Array.from({ length: 6 }).map((_, i) => (
              <rect key={i} x="0" y={i * 17} width="100" height="8" fill="#0f2312" />
            ))}
            {/* Lines */}
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="#1a4020" strokeWidth="0.8" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="#1a4020" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            {/* Penalty areas */}
            <rect x="22" y="5" width="56" height="15" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            <rect x="22" y="80" width="56" height="15" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            {/* Goal areas */}
            <rect x="35" y="5" width="30" height="6" fill="none" stroke="#1a4020" strokeWidth="0.5" />
            <rect x="35" y="89" width="30" height="6" fill="none" stroke="#1a4020" strokeWidth="0.5" />

            {/* Player positions */}
            {positions.map((pos, i) => (
              <g key={i}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="4.5"
                  fill="var(--accent)"
                  opacity="0.9"
                />
                <text
                  x={pos.x}
                  y={pos.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2.8"
                  fill="#000"
                  fontWeight="bold"
                >
                  {pos.role}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Right: controls */}
      <div className="w-56 flex flex-col gap-2 p-3 border-l border-white/5 overflow-y-auto bg-[#0d1117]">
        <input
          value={current.name}
          onChange={(e) => setCurrent((c) => ({ ...c, name: e.target.value }))}
          placeholder="Nom de la tactique"
          className="w-full bg-[#111820] text-slate-200 text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50"
        />

        {/* Sliders */}
        {SLIDERS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-slate-500">{label}</span>
              <span className="text-[10px] text-slate-400">{Math.round(current.sliders[key] ?? 50)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={current.sliders[key] ?? 50}
              onChange={(e) =>
                setCurrent((c) => ({
                  ...c,
                  sliders: { ...c.sliders, [key]: Number(e.target.value) },
                }))
              }
              className="w-full h-1.5 accent-[var(--accent)] cursor-pointer"
            />
          </div>
        ))}

        {/* EA Code */}
        <input
          value={current.eaCode ?? ""}
          onChange={(e) => setCurrent((c) => ({ ...c, eaCode: e.target.value }))}
          placeholder="Code EA (8 car.)"
          maxLength={8}
          className="w-full bg-[#111820] text-slate-200 text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-[var(--accent)]/50 font-mono uppercase"
        />

        {/* Notes */}
        <textarea
          value={current.notes}
          onChange={(e) => setCurrent((c) => ({ ...c, notes: e.target.value }))}
          placeholder="Notes…"
          rows={3}
          className="w-full bg-[#111820] text-slate-300 text-xs rounded px-2 py-1.5 border border-white/10 focus:outline-none resize-none"
        />

        {/* Actions */}
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-1.5 py-1.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded text-sm hover:bg-[var(--accent)]/30 transition-colors"
        >
          <Save size={13} /> Sauvegarder
        </button>

        {tactics.length > 0 && (
          <div className="border-t border-white/5 pt-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sauvegardées</p>
            {tactics.map((t) => (
              <div key={t.id} className="flex items-center gap-1 group py-1">
                <button
                  onClick={() => handleLoad(t)}
                  className="flex-1 text-left text-xs text-slate-400 hover:text-slate-200 truncate"
                >
                  {t.name} <span className="text-slate-600">{t.formation}</span>
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setCurrent(defaultTactic())}
          className="flex items-center justify-center gap-1.5 py-1.5 bg-white/5 text-slate-400 rounded text-xs hover:bg-white/10 transition-colors"
        >
          <Plus size={11} /> Nouvelle
        </button>
      </div>
    </div>
  );
}
