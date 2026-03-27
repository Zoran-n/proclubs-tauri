import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Download, Trash2, Clock, Users } from "lucide-react";
import { searchClub, loadClub, getLogo } from "../../api/tauri";
import { useAppStore } from "../../store/useAppStore";
import { ExportModal } from "../ui/ExportModal";
import type { Club, ClubData, Player } from "../../types";

const POS_LABELS: Record<string, string> = {
  "0":"GK","1":"RB","2":"RB","3":"CB","4":"CB","5":"LB","6":"LB",
  "7":"CDM","8":"CM","9":"CM","10":"CAM","11":"RM","12":"LM",
  "13":"RW","14":"LW","15":"RF","16":"CF","17":"LF","18":"ST","19":"ST",
  "20":"ST","25":"CF","26":"CAM",
};

const POS_GROUPS: Record<string, string[]> = {
  "GK": ["GK"],
  "DEF": ["RB", "CB", "LB"],
  "MIL": ["CDM", "CM", "CAM", "RM", "LM"],
  "ATT": ["RW", "LW", "RF", "CF", "LF", "ST"],
};

function ClubLogo({ club, size = 32 }: { club: Club; size?: number }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (club.crestAssetId) getLogo(club.crestAssetId).then(setLogo).catch(() => {});
  }, [club.crestAssetId]);
  const initial = (club.name || "?")[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: "var(--bg)",
      border: "1px solid var(--border)", flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {logo
        ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span style={{ fontFamily: "'Bebas Neue', sans-serif",
            fontSize: size * 0.42, color: "var(--accent)", lineHeight: 1 }}>
            {initial}
          </span>
      }
    </div>
  );
}

type Side = "A" | "B";

interface SideState {
  query: string;
  results: Club[];
  data: ClubData | null;
  loading: boolean;
}

const initSide = (): SideState => ({ query: "", results: [], data: null, loading: false });

function StatRow({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  const na = Number(a), nb = Number(b);
  const aWins = !isNaN(na) && !isNaN(nb) && na > nb;
  const bWins = !isNaN(na) && !isNaN(nb) && nb > na;
  return (
    <tr>
      <td style={{ textAlign: "right", padding: "5px 10px", color: aWins ? "var(--accent)" : "var(--text)",
        fontWeight: aWins ? 700 : "normal", fontSize: 13 }}>{a}</td>
      <td style={{ textAlign: "center", padding: "5px 6px", color: "var(--muted)", fontSize: 10,
        fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</td>
      <td style={{ textAlign: "left", padding: "5px 10px", color: bWins ? "var(--accent)" : "var(--text)",
        fontWeight: bWins ? 700 : "normal", fontSize: 13 }}>{b}</td>
    </tr>
  );
}

function getPlayerPos(p: Player) {
  return POS_LABELS[p.position] || p.position || "—";
}

function getPlayerGroup(p: Player): string {
  const pos = getPlayerPos(p);
  for (const [group, positions] of Object.entries(POS_GROUPS)) {
    if (positions.includes(pos)) return group;
  }
  return "ATT";
}

const BTN: React.CSSProperties = {
  padding: "5px 9px", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 5, cursor: "pointer", color: "var(--muted)", fontSize: 11,
  display: "flex", alignItems: "center", gap: 4,
};

export function CompareTab() {
  const { compareHistory, addCompareEntry, deleteCompareEntry, persistSettings } = useAppStore();
  const [sideA, setSideA] = useState<SideState>(initSide());
  const [sideB, setSideB] = useState<SideState>(initSide());
  const [exportModal, setExportModal] = useState<"png" | "csv" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const update = (side: Side, patch: Partial<SideState>) => {
    if (side === "A") setSideA((s) => ({ ...s, ...patch }));
    else setSideB((s) => ({ ...s, ...patch }));
  };

  const doSearch = async (side: Side) => {
    const q = (side === "A" ? sideA : sideB).query.trim();
    if (!q) return;
    const clubs = await searchClub(q).catch(() => [] as Club[]);
    const seen = new Set<string>();
    update(side, { results: clubs.filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; }) });
  };

  const pick = async (club: Club, side: Side) => {
    update(side, { results: [], loading: true });
    const data = await loadClub(club.id, club.platform).catch(() => null);
    update(side, { data, loading: false });
  };

  const reset = (side: Side) => {
    if (side === "A") setSideA(initSide());
    else setSideB(initSide());
  };

  // Save to compare history when both clubs are loaded
  const dA = sideA.data, dB = sideB.data;
  useEffect(() => {
    if (!dA || !dB) return;
    const id = [dA.club.id, dB.club.id].sort().join("-");
    addCompareEntry({
      id,
      date: new Date().toISOString(),
      clubA: { id: dA.club.id, name: dA.club.name, platform: dA.club.platform },
      clubB: { id: dB.club.id, name: dB.club.name, platform: dB.club.platform },
    });
    persistSettings();
  }, [dA?.club.id, dB?.club.id]);

  // Load from history
  const loadFromHistory = async (entry: typeof compareHistory[0]) => {
    setSideA((s) => ({ ...s, loading: true, results: [] }));
    setSideB((s) => ({ ...s, loading: true, results: [] }));
    const [dataA, dataB] = await Promise.all([
      loadClub(entry.clubA.id, entry.clubA.platform).catch(() => null),
      loadClub(entry.clubB.id, entry.clubB.platform).catch(() => null),
    ]);
    setSideA({ query: "", results: [], data: dataA, loading: false });
    setSideB({ query: "", results: [], data: dataB, loading: false });
  };

  // Best players by position group
  const bestByPosition = useMemo(() => {
    if (!dA || !dB) return null;
    const groups: Record<string, { a: Player | null; b: Player | null }> = {};
    for (const group of Object.keys(POS_GROUPS)) {
      const aPlayers = dA.players.filter((p) => getPlayerGroup(p) === group);
      const bPlayers = dB.players.filter((p) => getPlayerGroup(p) === group);
      const bestA = aPlayers.length > 0 ? aPlayers.reduce((best, p) => p.rating > best.rating ? p : best) : null;
      const bestB = bPlayers.length > 0 ? bPlayers.reduce((best, p) => p.rating > best.rating ? p : best) : null;
      groups[group] = { a: bestA, b: bestB };
    }
    return groups;
  }, [dA, dB]);

  // CSV data
  const csvHeaders = ["Stat", dA?.club.name ?? "Club A", dB?.club.name ?? "Club B"];
  const csvRows = dA && dB ? [
    ["SR", dA.club.skillRating ?? "—", dB.club.skillRating ?? "—"],
    ["Victoires", dA.club.wins, dB.club.wins],
    ["Nuls", dA.club.ties, dB.club.ties],
    ["Défaites", dA.club.losses, dB.club.losses],
    ["Buts", dA.club.goals, dB.club.goals],
    ["Joueurs", dA.players.length, dB.players.length],
  ] : [];
  const dateStr = new Date().toISOString().slice(0, 10);

  const renderSide = (side: Side) => {
    const s = side === "A" ? sideA : sideB;
    return (
      <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10,
        minHeight: 180 }}>
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.1em",
          color: "var(--accent)" }}>CLUB {side}</p>

        {s.data ? (
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <ClubLogo club={s.data.club} size={36} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.data.club.name}
                </p>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, marginTop: 2 }}>
                  SR {s.data.club.skillRating ?? "—"}
                </p>
              </div>
            </div>
            <button onClick={() => reset(side)} style={{
              fontSize: 11, color: "var(--muted)",
              background: "none", border: "1px solid var(--border)", borderRadius: 4,
              cursor: "pointer", padding: "3px 8px",
            }}>Changer</button>
          </div>
        ) : s.loading ? (
          <p style={{ fontSize: 12, color: "var(--muted)" }}>Chargement…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={s.query}
              onChange={(e) => update(side, { query: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && doSearch(side)}
              placeholder="Nom du club…"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                padding: "7px 10px", borderRadius: 5, fontSize: 13, outline: "none",
                transition: "border-color 0.15s" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button onClick={() => doSearch(side)} style={{
              padding: "8px", background: "var(--accent)", color: "#000", border: "none",
              borderRadius: 5, fontFamily: "'Bebas Neue', sans-serif", fontSize: 13,
              letterSpacing: "0.08em", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Search size={13} /> RECHERCHER
            </button>

            {s.results.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {s.results.map((c) => (
                  <div key={c.id} onClick={() => pick(c, side)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                    background: "var(--bg)", border: "1px solid var(--border)",
                    transition: "border-color 0.15s",
                  }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
                  >
                    <ClubLogo club={c} size={28} />
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name || `Club #${c.id}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Club selection cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {renderSide("A")}
        {renderSide("B")}
      </div>

      {/* Compare table */}
      {dA && dB && (
        <>
          {/* Export buttons */}
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={() => setExportModal("png")} style={{ ...BTN }}>
              <Download size={11} /> PNG
            </button>
            <button onClick={() => setExportModal("csv")} style={{ ...BTN }}>
              <Download size={11} /> CSV
            </button>
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 13, color: "var(--accent)",
                    fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}>{dA.club.name}</th>
                  <th style={{ width: 100 }} />
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 13, color: "var(--accent)",
                    fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}>{dB.club.name}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["SR",        dA.club.skillRating ?? 0, dB.club.skillRating ?? 0],
                  ["VICTOIRES", dA.club.wins,             dB.club.wins],
                  ["NULS",      dA.club.ties,             dB.club.ties],
                  ["DÉFAITES",  dA.club.losses,           dB.club.losses],
                  ["BUTS",      dA.club.goals,            dB.club.goals],
                  ["JOUEURS",   dA.players.length,        dB.players.length],
                ].map(([label, a, b]) => (
                  <StatRow key={String(label)} label={String(label)} a={a as string | number} b={b as string | number} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Best players by position */}
          {bestByPosition && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Users size={13} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
                  fontFamily: "'Bebas Neue', sans-serif" }}>MEILLEURS JOUEURS PAR POSTE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(bestByPosition).map(([group, { a, b }]) => {
                  const groupLabel = group === "GK" ? "Gardien" : group === "DEF" ? "Défenseur" : group === "MIL" ? "Milieu" : "Attaquant";
                  const aRating = a?.rating ?? 0;
                  const bRating = b?.rating ?? 0;
                  const aWins = aRating > bRating;
                  const bWins = bRating > aRating;
                  return (
                    <div key={group} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8,
                      padding: "8px 10px", background: "var(--bg)", borderRadius: 6, alignItems: "center" }}>
                      {/* Club A player */}
                      <div style={{ textAlign: "right" }}>
                        {a ? (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 600, color: aWins ? "var(--accent)" : "var(--text)" }}>
                              {a.name}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--muted)" }}>
                              {getPlayerPos(a)} · {a.rating > 0 ? a.rating.toFixed(1) : "—"} · {a.goals}G {a.assists}PD
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>
                        )}
                      </div>
                      {/* Group label */}
                      <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: "0.06em", textAlign: "center", minWidth: 70 }}>
                        {groupLabel.toUpperCase()}
                      </div>
                      {/* Club B player */}
                      <div style={{ textAlign: "left" }}>
                        {b ? (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 600, color: bWins ? "var(--accent)" : "var(--text)" }}>
                              {b.name}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--muted)" }}>
                              {getPlayerPos(b)} · {b.rating > 0 ? b.rating.toFixed(1) : "—"} · {b.goals}G {b.assists}PD
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Prompt if only one selected */}
      {(dA && !dB) || (!dA && dB) ? (
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
          Sélectionnez le deuxième club pour comparer
        </p>
      ) : null}

      {/* Compare history */}
      {compareHistory.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Clock size={13} style={{ color: "var(--muted)" }} />
            <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em",
              fontFamily: "'Bebas Neue', sans-serif" }}>COMPARAISONS RÉCENTES</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {compareHistory.map((entry) => (
              <div key={entry.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 6, cursor: "pointer", transition: "border-color 0.15s",
              }}
                onClick={() => loadFromHistory(entry)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.clubA.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>vs</span> {entry.clubB.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteCompareEntry(entry.id); persistSettings(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export modals */}
      {exportModal === "png" && (
        <ExportModal type="png" pngSourceEl={contentRef.current}
          defaultFilename={`comparaison-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
      {exportModal === "csv" && (
        <ExportModal type="csv" csvHeaders={csvHeaders} csvRows={csvRows}
          defaultFilename={`comparaison-${dateStr}`} onClose={() => setExportModal(null)} />
      )}
    </div>
  );
}
