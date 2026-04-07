import { useRef, useState } from "react";
import { Star, GripVertical } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import type { Club } from "../../types";

export function FavsTab() {
  const { favs, toggleFav, reorderFavs, persistSettings } = useAppStore();
  const { load } = useClub();

  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDragStart = (i: number) => { dragIdx.current = i; };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOver(i);
  };

  const handleDrop = (targetIdx: number) => {
    const from = dragIdx.current;
    if (from === null || from === targetIdx) { setDragOver(null); return; }
    const next = [...favs];
    const [moved] = next.splice(from, 1);
    next.splice(targetIdx, 0, moved);
    reorderFavs(next);
    persistSettings();
    dragIdx.current = null;
    setDragOver(null);
  };

  const handleDragEnd = () => { dragIdx.current = null; setDragOver(null); };

  if (favs.length === 0) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)", gap: 8 }}>
      <Star size={32} />
      <p style={{ fontSize: 12 }}>Aucun favori</p>
      <p style={{ fontSize: 10, textAlign: "center", padding: "0 20px" }}>Clique sur ★ dans la recherche pour ajouter un club</p>
    </div>
  );

  const pLabel: Record<string, string> = { "common-gen5": "PS5/XSX", "common-gen4": "PS4/XBO", "pc": "PC" };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
      <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 8 }}>
        FAVORIS ({favs.length})
      </label>
      {favs.map((club: Club, i: number) => (
        <div
          key={`${club.id}_${club.platform}`}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={handleDragEnd}
          style={{
            display: "flex", alignItems: "center", padding: "8px 0",
            borderBottom: dragOver === i ? "2px solid var(--accent)" : "1px solid var(--border)",
            cursor: "pointer",
            opacity: dragIdx.current === i ? 0.45 : 1,
            transition: "opacity 0.1s",
          }}
          onClick={() => load(club.id, club.platform)}
        >
          <span
            style={{ color: "var(--border)", marginRight: 6, cursor: "grab", flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={13} />
          </span>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, fontSize: 12, fontWeight: "bold", color: "var(--accent)", flexShrink: 0 }}>
            {club.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <p style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.name}</p>
            <p style={{ fontSize: 10, color: "var(--muted)" }}>{pLabel[club.platform] ?? club.platform} · SR {club.skillRating ?? "—"}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", padding: 4 }}>
            <Star size={14} fill="currentColor" />
          </button>
        </div>
      ))}
      {favs.length > 1 && (
        <p style={{ fontSize: 9, color: "var(--border)", textAlign: "center", marginTop: 8, letterSpacing: "0.06em" }}>
          ⠿ GLISSER POUR RÉORDONNER
        </p>
      )}
    </div>
  );
}
