import { useState } from "react";
import { searchClub, loadClub } from "../../api/tauri";
import { PLATFORMS, type Club, type ClubData } from "../../types";

export function CompareTab() {
  const [platform, setPlatform] = useState("common-gen5");
  const [qA, setQA] = useState(""); const [qB, setQB] = useState("");
  const [resA, setResA] = useState<Club[]>([]); const [resB, setResB] = useState<Club[]>([]);
  const [dataA, setDataA] = useState<ClubData | null>(null);
  const [dataB, setDataB] = useState<ClubData | null>(null);

  const search = async (q: string, side: "A" | "B") => {
    const clubs = await searchClub(q, platform).catch(() => []);
    side === "A" ? setResA(clubs) : setResB(clubs);
  };

  const pick = async (club: Club, side: "A" | "B") => {
    side === "A" ? setResA([]) : setResB([]);
    const data = await loadClub(club.id, platform).catch(() => null);
    side === "A" ? setDataA(data) : setDataB(data);
  };


  const row = (label: string, a: string | number, b: string | number) => {
    const na = Number(a), nb = Number(b);
    return (
      <tr key={label}>
        <td style={{ textAlign: "right", padding: "3px 6px", color: !isNaN(na) && na > nb ? "var(--green)" : "var(--text)", fontWeight: !isNaN(na) && na > nb ? "bold" : "normal", fontSize: 12 }}>{a}</td>
        <td style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", padding: "3px 6px" }}>{label}</td>
        <td style={{ textAlign: "left", padding: "3px 6px", color: !isNaN(nb) && nb > na ? "var(--green)" : "var(--text)", fontWeight: !isNaN(nb) && nb > na ? "bold" : "normal", fontSize: 12 }}>{b}</td>
      </tr>
    );
  };

  const SearchBox = ({ side }: { side: "A" | "B" }) => {
    const q = side === "A" ? qA : qB;
    const setQ = side === "A" ? setQA : setQB;
    const res = side === "A" ? resA : resB;
    const data = side === "A" ? dataA : dataB;
    return (
      <div style={{ flex: 1, background: "var(--card)", borderRadius: 6, padding: 8, border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'Bebas Neue', sans-serif", marginBottom: 6 }}>CLUB {side}</p>
        {data ? (
          <div>
            <p style={{ fontSize: 13, color: "var(--text)", fontWeight: "bold" }}>{data.club.name}</p>
            <p style={{ fontSize: 10, color: "var(--muted)" }}>SR {data.club.skillRating ?? "—"}</p>
            <button onClick={() => side === "A" ? setDataA(null) : setDataB(null)} style={{ fontSize: 9, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>Changer</button>
          </div>
        ) : (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search(q, side)}
              placeholder="Rechercher…" style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", padding: "5px 8px", borderRadius: 4, fontSize: 12, outline: "none", marginBottom: 4 }} />
            {res.map((c) => (
              <div key={c.id} onClick={() => pick(c, side)} style={{ fontSize: 11, color: "var(--text)", padding: "3px 0", cursor: "pointer", borderBottom: "1px solid var(--border)" }}>{c.name}</div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <select value={platform} onChange={(e) => setPlatform(e.target.value)}
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)", padding: "5px 8px", borderRadius: 4, fontSize: 11, outline: "none" }}>
        {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <div style={{ display: "flex", gap: 8 }}>
        <SearchBox side="A" />
        <SearchBox side="B" />
      </div>
      {dataA && dataB && (
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={{ textAlign: "right", fontSize: 11, color: "var(--accent)", padding: "4px 6px" }}>{dataA.club.name}</th>
              <th />
              <th style={{ textAlign: "left", fontSize: 11, color: "var(--accent)", padding: "4px 6px" }}>{dataB.club.name}</th>
            </tr></thead>
            <tbody>
              {row("SR", dataA.club.skillRating ?? 0, dataB.club.skillRating ?? 0)}
              {row("Victoires", dataA.club.wins, dataB.club.wins)}
              {row("Nuls", dataA.club.ties, dataB.club.ties)}
              {row("Défaites", dataA.club.losses, dataB.club.losses)}
              {row("Buts", dataA.club.goals, dataB.club.goals)}
              {row("Joueurs", dataA.players.length, dataB.players.length)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
