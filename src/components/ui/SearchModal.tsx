import { Star, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import type { Club } from "../../types";

const P_LABEL: Record<string, string> = { "common-gen5": "PS5", "common-gen4": "PS4", "pc": "PC" };
const P_COLOR: Record<string, string> = { "common-gen5": "#3b82f6", "common-gen4": "#8b5cf6", "pc": "#22c55e" };

export function SearchModal() {
  const { searchResults, showSearchModal, closeSearchModal, favs, toggleFav, persistSettings } = useAppStore();
  const { load } = useClub();

  if (!showSearchModal) return null;

  const isFav = (c: Club) => favs.some((f) => f.id === c.id && f.platform === c.platform);

  const handleLoad = (club: Club) => {
    load(club.id, club.platform);
    persistSettings();
    closeSearchModal();
  };

  return (
    <div
      onClick={closeSearchModal}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
          width: 560, maxHeight: "70vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <span style={{ flex: 1, fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.1em", color: "var(--accent)" }}>
            RÉSULTATS ({searchResults.length})
          </span>
          <button onClick={closeSearchModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Results list */}
        <div style={{ overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {searchResults.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: "30px 0", fontSize: 13 }}>Aucun résultat</p>
          ) : searchResults.map((club) => (
            <div
              key={`${club.id}_${club.platform}`}
              onClick={() => handleLoad(club)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                cursor: "pointer", background: "var(--card)",
                border: "1px solid var(--border)", borderRadius: 7,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
            >
              {/* Club initial */}
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: "var(--bg)",
                border: "1px solid var(--border)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--accent)",
              }}>
                {(club.name || "?")[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club.name || `Club #${club.id}`}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  ID {club.id}
                  {club.skillRating && <span style={{ color: "var(--gold)", marginLeft: 8 }}>★ {club.skillRating} SR</span>}
                  {(club.wins + club.losses + club.ties) > 0 && (
                    <span style={{ marginLeft: 8 }}>{club.wins}V {club.losses}D {club.ties}N</span>
                  )}
                </div>
              </div>

              {/* Platform badge */}
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#000",
                background: P_COLOR[club.platform] ?? "var(--muted)",
                padding: "3px 8px", borderRadius: 4, flexShrink: 0,
              }}>
                {P_LABEL[club.platform] ?? club.platform}
              </span>

              {/* Fav button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: isFav(club) ? "var(--gold, #f59e0b)" : "var(--muted)", flexShrink: 0 }}
              >
                <Star size={15} fill={isFav(club) ? "currentColor" : "none"} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
