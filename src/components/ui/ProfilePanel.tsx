import { useState } from "react";
import { Link, User, Unlink, Send } from "lucide-react";
import { searchClub, getMembers } from "../../api/tauri";
import { sendDiscordWebhook } from "../../api/discord";
import { useAppStore } from "../../store/useAppStore";
import { useClub } from "../../hooks/useClub";
import { PLATFORMS } from "../../types";
import type { Club, EaProfile } from "../../types";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--card)", border: "1px solid var(--border)",
  color: "var(--text)", padding: "8px 12px", borderRadius: 6, fontSize: 13,
  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em",
  fontFamily: "'Bebas Neue', sans-serif", display: "block", marginBottom: 5,
};

export function ProfilePanel() {
  const { eaProfile, setEaProfile, addLog, persistSettings, setSidebarTab,
    discordWebhook, setDiscordWebhook, addToast } = useAppStore();
  const { load } = useClub();

  const [gamertag, setGamertag] = useState(eaProfile?.gamertag ?? "");
  const [clubSearch, setClubSearch] = useState(eaProfile?.clubName ?? "");
  const [platform, setPlatform] = useState(eaProfile?.platform ?? "common-gen5");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookDraft, setWebhookDraft] = useState(discordWebhook);
  const [testing, setTesting] = useState(false);

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

  const saveWebhook = () => {
    setDiscordWebhook(webhookDraft);
    persistSettings();
  };

  const testWebhook = async () => {
    const url = webhookDraft.trim();
    if (!url) return;
    setTesting(true);
    try {
      await sendDiscordWebhook(url, [{
        title: "✅ ProClubs Stats — Test",
        color: 0x00d4ff,
        description: "Webhook Discord correctement configuré !",
        footer: { text: "ProClubs Stats" },
      }]);
      addToast("Message test envoyé !", "success");
    } catch (e) {
      addToast(`Discord: ${String(e)}`, "error");
    } finally {
      setTesting(false);
    }
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

      {/* ── Section EA ── */}
      {eaProfile?.clubId ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 4 }}>
            Entre ton pseudo EA et le nom de ton club. L'app vérifiera que tu es bien membre du club.
          </p>

          <div>
            <label style={labelStyle}>GAMERTAG / PSN ID</label>
            <input
              value={gamertag}
              onChange={(e) => setGamertag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              placeholder="Ton pseudo EA…"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label style={labelStyle}>NOM DE TON CLUB</label>
            <input
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              placeholder="Nom exact de ton club EA…"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label style={labelStyle}>PLATEFORME</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{ ...inputStyle, fontSize: 12 }}
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

      {/* ── Section Discord ── */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em",
          fontFamily: "'Bebas Neue', sans-serif", marginBottom: 12 }}>
          INTÉGRATION DISCORD
        </div>
        <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>
          Configure ton propre webhook Discord pour partager les résumés de matchs et de sessions dans ton serveur.
        </p>
        <p style={{ fontSize: 10, color: "var(--border)", lineHeight: 1.5, marginBottom: 10 }}>
          Serveur Discord → Paramètres du salon → Intégrations → Webhooks
        </p>

        <label style={labelStyle}>URL DU WEBHOOK</label>
        <textarea
          value={webhookDraft}
          onChange={(e) => setWebhookDraft(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          rows={2}
          style={{
            ...inputStyle, resize: "none", fontSize: 11, lineHeight: 1.5,
            fontFamily: "monospace", color: webhookDraft ? "var(--text)" : "var(--muted)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => { e.target.style.borderColor = "var(--border)"; saveWebhook(); }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={saveWebhook}
            style={{
              flex: 1, padding: "8px", background: "var(--hover)",
              border: "1px solid var(--border)", borderRadius: 6,
              color: "var(--text)", fontSize: 12, cursor: "pointer",
              fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
            }}>
            ENREGISTRER
          </button>
          <button
            onClick={testWebhook}
            disabled={!webhookDraft.trim() || testing}
            style={{
              flex: 1, padding: "8px", background: "rgba(88,101,242,0.12)",
              border: "1px solid rgba(88,101,242,0.3)", borderRadius: 6,
              color: testing ? "var(--muted)" : "#5865f2", fontSize: 12,
              cursor: webhookDraft.trim() && !testing ? "pointer" : "default",
              opacity: webhookDraft.trim() && !testing ? 1 : 0.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
              transition: "all 0.15s",
            }}>
            <Send size={12} /> {testing ? "ENVOI…" : "TESTER"}
          </button>
        </div>

        {discordWebhook && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--green)" }}>
            <span>●</span> Webhook configuré
          </div>
        )}
      </div>
    </div>
  );
}
