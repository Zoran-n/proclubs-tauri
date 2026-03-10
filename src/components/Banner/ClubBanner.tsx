import { useState, useEffect } from "react";
import { getLogo } from "../../api/tauri";
import { useAppStore } from "../../store/useAppStore";

function timeAgo(ts: string): string {
  const n = Number(ts) * 1000 || Number(ts);
  const d = new Date(isNaN(n) ? ts : n);
  if (isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export function ClubBanner() {
  const { currentClub, matches } = useAppStore();
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [lastMatch, setLastMatch] = useState("");

  useEffect(() => {
    setLogoSrc(null);
    if (currentClub?.crestAssetId) {
      getLogo(currentClub.crestAssetId).then(setLogoSrc).catch(() => setLogoSrc(null));
    }
  }, [currentClub?.crestAssetId]);

  useEffect(() => {
    const latest = matches[0];
    if (!latest) return;
    const update = () => setLastMatch(timeAgo(latest.timestamp));
    update();
    const iv = setInterval(update, 30_000);
    return () => clearInterval(iv);
  }, [matches]);

  if (!currentClub) return null;

  const initials = currentClub.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
      {/* Avatar */}
      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
        {logoSrc
          ? <img src={logoSrc} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--accent)" }}>{initials}</span>
        }
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.08em", color: "var(--text)", lineHeight: 1, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentClub.name}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{currentClub.platform}</span>
          {currentClub.skillRating && (
            <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'Bebas Neue', sans-serif" }}>SR {currentClub.skillRating}</span>
          )}
          {lastMatch && (
            <span style={{ fontSize: 10, color: "var(--muted)" }}>Dernier match {lastMatch}</span>
          )}
        </div>
      </div>
    </div>
  );
}
