import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { searchClub, loadClub, getLogo } from "../../api/tauri";
import type { Club, ClubData } from "../../types";

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

const init = (): SideState => ({ query: "", results: [], data: null, loading: false });

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

export function CompareTab() {
  const [sideA, setSideA] = useState<SideState>(init());
  const [sideB, setSideB] = useState<SideState>(init());

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
    if (side === "A") setSideA(init());
    else setSideB(init());
  };

  const renderSide = (side: Side) => {
    const s = side === "A" ? sideA : sideB;
    return (
      <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10,
        minHeight: 180 }}>
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.1em",
          color: "var(--accent)" }}>CLUB {side}</p>

        {s.data ? (
          /* Selected club card */
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
          /* Search form */
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

            {/* Results */}
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

  const dA = sideA.data, dB = sideB.data;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Club selection cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {renderSide("A")}
        {renderSide("B")}
      </div>

      {/* Compare table */}
      {dA && dB && (
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
      )}

      {/* Prompt if only one selected */}
      {(dA && !dB) || (!dA && dB) ? (
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
          Sélectionnez le deuxième club pour comparer
        </p>
      ) : null}
    </div>
  );
}
