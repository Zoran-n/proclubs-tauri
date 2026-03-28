import { useState } from "react";
import { Link, User, Unlink } from "lucide-react";
import { searchClub, getMembers } from "../../api/tauri";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import { PLATFORMS } from "../../types";
import type { Club, EaProfile } from "../../types";

export function ProfilePanel() {
  const { eaProfile, setEaProfile, addLog, persistSettings, setSidebarTab } = useAppStore();
  const { load } = useClub();
  const [gamertag, setGamertag] = useState(eaProfile?.gamertag ?? "");
  const [clubSearch, setClubSearch] = useState(eaProfile?.clubName ?? "");
  const [platform, setPlatform] = useState(eaProfile?.platform ?? "common-gen5");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async () => {
    if (!gamertag.trim() || !clubSearch.trim()) return;
    setLinking(true);
    setError(null);
    addLog(`Liaison profil: "${gamertag}" dans "${clubSearch}"…`);
    try {
      const clubs = await searchClub(clubSearch.trim(), platform);
      if (clubs.length === 0) {
        setError("Aucun club trouvé avec ce nom. Vérifie l'orthographe et la plateforme.");
        addLog("Aucun club trouvé");
        return;
      }
      let found: Club | null = null;
      for (const club of clubs.slice(0, 10)) {
        const members = await getMembers(club.id, club.platform).catch(() => []);
        const match = members.find((m) => m.name.toLowerCase() === gamertag.trim().toLowerCase());
        if (match) { found = club; break; }
      }
      if (found) {
        const profile: EaProfile = { gamertag: gamertag.trim(), platform, clubId: found.id, clubName: found.name };
        setEaProfile(profile);
        await persistSettings();
        addLog(`Profil lié: ${found.name}`);
      } else {
        setError("Gamertag introuvable dans les membres de ce club. Vérifie ton pseudo et la plateforme.");
        addLog("Gamertag introuvable dans les membres du club");
      }
    } catch (e) {
      setError(`Erreur: ${String(e)}`);
      addLog(`Erreur: ${String(e)}`);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = () => {
    setEaProfile({ gamertag: "", platform: "common-gen5", clubId: "", clubName: "" });
    setGamertag("");
    persistSettings();
  };

  const handleLoadClub = () => {
    if (!eaProfile?.clubId) return;
    load(eaProfile.clubId, eaProfile.platform);
    setSidebarTab("search");
  };

  return (
    <div style={{ flex: 1, overflow: "auto", maxWidth: 500, margin: "0 auto", width: "100%", padding: "24px 20px" }}>

      {/* Avatar + titre */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: eaProfile?.gamertag ? "var(--accent)" : "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid var(--border)", flexShrink: 0,
        }}>
          {eaProfile?.gamertag
            ? <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#fff" }}>
                {eaProfile.gamertag[0].toUpperCase()}
              </span>
            : <User size={28} color="var(--muted)" />
          }
        </div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--text)", letterSpacing: "0.04em" }}>
            {eaProfile?.gamertag || "Mon profil"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {eaProfile?.clubName
              ? `${eaProfile.clubName} · ${eaProfile.platform}`
              : "Aucun profil EA lié"
            }
          </div>
        </div>
      </div>

      {eaProfile?.clubId ? (
        /* Profil lié */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            background: "var(--hover)", borderRadius: 10, padding: "14px 16px",
            border: "1px solid rgba(0,212,255,0.2)",
          }}>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", fontFamily: "'Bebas Neue', sans-serif", marginBottom: 8 }}>
              PROFIL EA LIÉ
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px", fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>Gamertag</span>
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>{eaProfile.gamertag}</span>
              <span style={{ color: "var(--muted)" }}>Club</span>
              <span style={{ color: "var(--text)" }}>{eaProfile.clubName}</span>
              <span style={{ color: "var(--muted)" }}>Plateforme</span>
              <span style={{ color: "var(--text)" }}>{eaProfile.platform}</span>
            </div>
          </div>

          <button onClick={handleLoadClub} style={{
            width: "100%", padding: "10px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 14, letterSpacing: "0.08em", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <User size={14} /> CHARGER MON CLUB
          </button>

          <button onClick={handleUnlink} style={{
            width: "100%", padding: "9px", background: "transparent",
            border: "1px solid var(--border)", color: "var(--muted)",
            borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            <Unlink size={12} /> DÉLIER LE PROFIL
          </button>
        </div>
      ) : (
        /* Aucun profil */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 4 }}>
            Entre ton pseudo EA et le nom de ton club. L'app vérifiera que tu es bien membre du club.
          </p>

          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 5 }}>
              GAMERTAG / PSN ID
            </label>
            <input
              value={gamertag}
              onChange={(e) => setGamertag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              placeholder="Ton pseudo EA…"
              style={{
                width: "100%", background: "var(--card)", border: "1px solid var(--border)",
                color: "var(--text)", padding: "8px 12px", borderRadius: 6, fontSize: 13,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 5 }}>
              NOM DE TON CLUB
            </label>
            <input
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              placeholder="Nom exact de ton club EA…"
              style={{
                width: "100%", background: "var(--card)", border: "1px solid var(--border)",
                color: "var(--text)", padding: "8px 12px", borderRadius: 6, fontSize: 13,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 5 }}>
              PLATEFORME
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{
                width: "100%", background: "var(--card)", border: "1px solid var(--border)",
                color: "var(--text)", padding: "8px 12px", borderRadius: 6, fontSize: 12,
                outline: "none",
              }}
            >
              {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {error && (
            <div style={{ background: "rgba(218,55,60,0.1)", border: "1px solid rgba(218,55,60,0.3)", borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <button onClick={handleLink} disabled={linking || !gamertag.trim() || !clubSearch.trim()} style={{
            width: "100%", padding: "10px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 6, fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 14, letterSpacing: "0.08em", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            opacity: linking || !gamertag.trim() || !clubSearch.trim() ? 0.6 : 1,
          }}>
            <Link size={14} /> {linking ? "RECHERCHE EN COURS…" : "LIER MON PROFIL"}
          </button>
        </div>
      )}
    </div>
  );
}
