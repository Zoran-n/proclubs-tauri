import { useState, useEffect, useRef } from "react";
import { Star, GripVertical, Bell, BellOff, Folder, FolderPlus, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import type { Club } from "../../types";

const PLABEL: Record<string, string> = { "common-gen5": "PS5/XSX", "common-gen4": "PS4/XBO", "pc": "PC" };

function ClubHoverTooltip({ club, anchorRect }: { club: Club; anchorRect: DOMRect }) {
  const total = club.wins + club.losses + club.ties;
  return (
    <div style={{
      position: "fixed",
      left: anchorRect.right + 8,
      top: anchorRect.top + anchorRect.height / 2,
      transform: "translateY(-50%)",
      background: "var(--surface)",
      border: "1px solid var(--accent)",
      borderRadius: 8,
      padding: "10px 14px",
      zIndex: 1000,
      width: 158,
      pointerEvents: "none",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: "var(--accent)", marginBottom: 2 }}>
        {club.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6 }}>{PLABEL[club.platform] ?? club.platform}</div>
      <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted)" }}>SR</span>
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>{club.skillRating ?? "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted)" }}>MJ</span>
          <span style={{ color: "var(--text)" }}>{total}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ color: "var(--green)" }}>V {club.wins}</span>
          <span style={{ color: "var(--muted)" }}>N {club.ties}</span>
          <span style={{ color: "var(--red)" }}>D {club.losses}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--gold, #f59e0b)" }}>⚽</span>
          <span style={{ color: "var(--text)" }}>{club.goals}</span>
        </div>
      </div>
    </div>
  );
}

export function FavsTab() {
  const { favs, toggleFav, reorderFavs, persistSettings,
    favFolders, srAlerts, addFavFolder, deleteFavFolder, setClubFolder, toggleSrAlert } = useAppStore();
  const { load } = useClub();

  // Drag-to-reorder state (disabled when folders exist)
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const didDrag = useRef(false);

  // UI state
  const [tooltip, setTooltip] = useState<{ club: Club; rect: DOMRect } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>([]);

  const hasFolders = favFolders.length > 0;

  useEffect(() => {
    if (dragging === null || hasFolders) return;
    const onUp = () => {
      if (dragging !== null && dragOver !== null && dragging !== dragOver) {
        const next = [...favs];
        const [moved] = next.splice(dragging, 1);
        next.splice(dragOver, 0, moved);
        reorderFavs(next);
        persistSettings();
      }
      setDragging(null);
      setDragOver(null);
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [dragging, dragOver, favs, reorderFavs, persistSettings, hasFolders]);

  if (favs.length === 0) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)", gap: 8 }}>
      <Star size={32} />
      <p style={{ fontSize: 12 }}>Aucun favori</p>
      <p style={{ fontSize: 10, textAlign: "center", padding: "0 20px" }}>Clique sur ★ dans la recherche pour ajouter un club</p>
    </div>
  );

  const exportFavs = (format: "json" | "csv") => {
    if (format === "json") {
      const data = JSON.stringify({ favs, favFolders }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `favoris_${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const header = "nom,id,plateforme,SR,victoires,nuls,defaites,buts";
      const rows = favs.map((c) =>
        `"${c.name.replace(/"/g, '""')}",${c.id},${c.platform},${c.skillRating ?? ""},${c.wins},${c.ties},${c.losses},${c.goals}`
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `favoris_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const toggleFolderCollapse = (id: string) =>
    setCollapsedFolders((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const getClubFolderId = (clubId: string) =>
    favFolders.find((f) => f.clubIds.includes(clubId))?.id ?? "";

  const renderClubCard = (club: Club, globalIdx: number, inFolder = false) => (
    <div
      key={`${club.id}_${club.platform}`}
      onPointerEnter={() => { if (!hasFolders && dragging !== null) setDragOver(globalIdx); }}
      onMouseEnter={(e) => setTooltip({ club, rect: e.currentTarget.getBoundingClientRect() })}
      onMouseLeave={() => setTooltip(null)}
      style={{
        display: "flex", alignItems: "center", padding: "8px 0",
        borderBottom: !inFolder && dragOver === globalIdx && dragging !== null
          ? "2px solid var(--accent)"
          : "1px solid var(--border)",
        cursor: dragging !== null && !hasFolders ? "grabbing" : "pointer",
        opacity: !inFolder && dragging === globalIdx ? 0.45 : 1,
        transition: "opacity 0.1s",
        userSelect: "none",
      }}
      onClick={() => {
        if (didDrag.current) { didDrag.current = false; return; }
        load(club.id, club.platform);
      }}
    >
      {/* Grip handle — only when no folders */}
      {!hasFolders && (
        <span
          style={{ color: "var(--border)", marginRight: 6, cursor: "grab", flexShrink: 0, touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            didDrag.current = true;
            setDragging(globalIdx);
            setDragOver(globalIdx);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </span>
      )}

      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--card)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginRight: 10, fontSize: 12, fontWeight: "bold", color: "var(--accent)", flexShrink: 0 }}>
        {club.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Name + platform + SR */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <p style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {club.name}
        </p>
        <p style={{ fontSize: 10, color: "var(--muted)" }}>
          {PLABEL[club.platform] ?? club.platform} · SR {club.skillRating ?? "—"}
        </p>
      </div>

      {/* Folder selector (only when folders exist) */}
      {hasFolders && (
        <select
          value={getClubFolderId(club.id)}
          onChange={(e) => { setClubFolder(club.id, e.target.value || null); persistSettings(); }}
          onClick={(e) => e.stopPropagation()}
          title="Dossier"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)",
            fontSize: 10, borderRadius: 3, padding: "1px 2px", cursor: "pointer",
            marginRight: 2, maxWidth: 58 }}>
          <option value="">—</option>
          {favFolders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      )}

      {/* SR alert bell */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleSrAlert(club.id); persistSettings(); }}
        title={srAlerts.includes(club.id) ? "Alerte SR active — cliquer pour désactiver" : "Activer l'alerte SR"}
        style={{ background: "none", border: "none", cursor: "pointer",
          color: srAlerts.includes(club.id) ? "var(--gold, #f59e0b)" : "var(--border)",
          padding: 3, flexShrink: 0 }}>
        {srAlerts.includes(club.id) ? <Bell size={13} fill="currentColor" /> : <BellOff size={13} />}
      </button>

      {/* Unfav */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFav(club); persistSettings(); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", padding: 4, flexShrink: 0 }}>
        <Star size={14} fill="currentColor" />
      </button>
    </div>
  );

  const unfiledFavs = favs.filter((c) => !favFolders.some((f) => f.clubIds.includes(c.id)));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
      {/* Fixed tooltip overlay */}
      {tooltip && <ClubHoverTooltip club={tooltip.club} anchorRect={tooltip.rect} />}

      {/* Header: title + export + new folder */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 4 }}>
        <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif" }}>
          FAVORIS ({favs.length})
        </label>
        <div style={{ flex: 1 }} />
        <button onClick={() => exportFavs("csv")} title="Exporter en CSV"
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 3,
            padding: "2px 5px", fontSize: 9, cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
          CSV
        </button>
        <button onClick={() => exportFavs("json")} title="Exporter en JSON"
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 3,
            padding: "2px 5px", fontSize: 9, cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
          JSON
        </button>
        <button onClick={() => setShowNewFolder(true)} title="Nouveau dossier"
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 3,
            padding: "3px 5px", cursor: "pointer" }}>
          <FolderPlus size={12} />
        </button>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nom du dossier..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolderName.trim()) {
                addFavFolder(newFolderName.trim()); setNewFolderName(""); setShowNewFolder(false); persistSettings();
              }
              if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
            }}
            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--accent)", color: "var(--text)",
              padding: "5px 8px", borderRadius: 4, fontSize: 11, outline: "none" }}
          />
          <button
            onClick={() => {
              if (newFolderName.trim()) { addFavFolder(newFolderName.trim()); setNewFolderName(""); setShowNewFolder(false); persistSettings(); }
            }}
            style={{ background: "var(--accent)", border: "none", color: "#fff", borderRadius: 4,
              padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>
            OK
          </button>
          <button
            onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 4,
              padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>
            ✕
          </button>
        </div>
      )}

      {/* Folder sections */}
      {favFolders.map((folder) => {
        const folderClubs = favs.filter((c) => folder.clubIds.includes(c.id));
        const isCollapsed = collapsedFolders.includes(folder.id);
        return (
          <div key={folder.id} style={{ marginBottom: 8 }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 0", marginBottom: 4,
                borderBottom: "1px solid var(--border)", cursor: "pointer" }}
              onClick={() => toggleFolderCollapse(folder.id)}
            >
              <span style={{ fontSize: 9, color: "var(--muted)", width: 8 }}>{isCollapsed ? "▶" : "▼"}</span>
              <Folder size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontFamily: "'Bebas Neue', sans-serif", color: "var(--text)", flex: 1, letterSpacing: "0.05em" }}>
                {folder.name}{" "}
                <span style={{ color: "var(--muted)", fontFamily: "inherit" }}>({folderClubs.length})</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFavFolder(folder.id); persistSettings(); }}
                title="Supprimer le dossier"
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 2 }}>
                <Trash2 size={11} />
              </button>
            </div>
            {!isCollapsed && (
              folderClubs.length > 0
                ? folderClubs.map((club) => renderClubCard(club, favs.indexOf(club), true))
                : <div style={{ fontSize: 10, color: "var(--muted)", padding: "4px 8px", fontStyle: "italic" }}>
                    Dossier vide
                  </div>
            )}
          </div>
        );
      })}

      {/* Unfiled favs */}
      {unfiledFavs.length > 0 && (
        <div>
          {hasFolders && (
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em",
              fontFamily: "'Bebas Neue', sans-serif", marginBottom: 4, paddingBottom: 4,
              borderBottom: "1px solid var(--border)" }}>
              SANS DOSSIER
            </div>
          )}
          {unfiledFavs.map((club) => renderClubCard(club, favs.indexOf(club), false))}
        </div>
      )}

      {/* Drag hint (only without folders) */}
      {!hasFolders && favs.length > 1 && (
        <p style={{ fontSize: 9, color: "var(--border)", textAlign: "center", marginTop: 8, letterSpacing: "0.06em" }}>
          ⠿ GLISSER POUR RÉORDONNER
        </p>
      )}

      {/* SR alerts summary */}
      {srAlerts.length > 0 && (
        <p style={{ fontSize: 9, color: "var(--gold, #f59e0b)", textAlign: "center", marginTop: 6, letterSpacing: "0.04em" }}>
          🔔 {srAlerts.length} alerte{srAlerts.length > 1 ? "s" : ""} SR active{srAlerts.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
