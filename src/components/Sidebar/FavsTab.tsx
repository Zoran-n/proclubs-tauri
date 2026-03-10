import { Star } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";

export function FavsTab() {
  const { favs, toggleFav, persistSettings } = useAppStore();
  const { load } = useClub();

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
      {favs.map((club) => (
        <div key={`${club.id}_${club.platform}`}
          style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
          onClick={() => load(club.id, club.platform)}>
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
    </div>
  );
}
