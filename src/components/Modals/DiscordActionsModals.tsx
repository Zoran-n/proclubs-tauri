import { useState } from "react";
import { X, Send, Swords, Calendar, Users, BookOpen, Copy, Check } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { sendDiscordWebhook } from "../../api/discord";

// ─── Annonce de match ──────────────────────────────────────────────────────────
export function MatchAnnounceModal({ onClose }: { onClose: () => void }) {
  const { discordWebhook, currentClub, addToast } = useAppStore();
  const [time, setTime]     = useState("");
  const [opponent, setOpp]  = useState("");
  const [compo, setCompo]   = useState("");
  const [note, setNote]     = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!discordWebhook) { addToast("Aucun webhook Discord configuré", "error"); return; }
    setSending(true);
    try {
      const fields: { name: string; value: string; inline?: boolean }[] = [
        { name: "⚽ Adversaire", value: opponent || "À définir", inline: true },
        { name: "🕐 Heure",      value: time     || "À définir", inline: true },
      ];
      if (compo) fields.push({ name: "👥 Compo prévue", value: compo });
      if (note)  fields.push({ name: "📝 Note du coach", value: note });
      await sendDiscordWebhook(discordWebhook, [{
        title: `📣 ANNONCE — ${currentClub?.name ?? "ProClubs"}`,
        color: 0x5865f2,
        description: "Prochain match confirmé — tout le monde dispo ? 🎮",
        fields,
        footer: { text: "ProClubs Stats • Annonce pré-match" },
        timestamp: new Date().toISOString(),
      }]);
      addToast("Annonce envoyée sur Discord !", "success");
      onClose();
    } catch (e) { addToast(`Erreur Discord: ${String(e)}`, "error"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 420,
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Calendar size={18} color="var(--accent)" />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--text)", letterSpacing: "0.06em" }}>
              ANNONCE PRÉ-MATCH
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "⚽ Adversaire", value: opponent, setter: setOpp, placeholder: "Nom du club adverse" },
            { label: "🕐 Heure du match", value: time, setter: setTime, placeholder: "ex: 21h00" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>{label}</label>
              <input value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                  padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>👥 Compo prévue (optionnel)</label>
            <textarea value={compo} onChange={e => setCompo(e.target.value)} rows={2}
              placeholder="ex: 4-3-3 — GK: Pseudo1, DEF: ..."
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>📝 Note du coach (optionnel)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Consignes tactiques, objectifs du match..."
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, background: "var(--bg)",
            border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>Annuler</button>
          <button onClick={send} disabled={sending || !opponent} style={{ padding: "8px 16px", borderRadius: 6,
            background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.4)",
            color: "#8b9cf4", cursor: !opponent || sending ? "default" : "pointer",
            opacity: !opponent || sending ? 0.6 : 1, fontSize: 12,
            display: "flex", alignItems: "center", gap: 6 }}>
            <Send size={12} /> {sending ? "Envoi..." : "Envoyer sur Discord"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sondage Discord ───────────────────────────────────────────────────────────
export function DiscordPollModal({ onClose }: { onClose: () => void }) {
  const { discordWebhook, addToast } = useAppStore();
  const [question, setQuestion] = useState("");
  const [options, setOptions]   = useState(["", ""]);
  const [sending, setSending]   = useState(false);

  const addOption = () => { if (options.length < 8) setOptions([...options, ""]); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, v: string) => setOptions(options.map((o, idx) => idx === i ? v : o));

  const EMOJIS = ["🔵","🟢","🟡","🔴","🟠","🟣","⚪","⚫"];

  const send = async () => {
    if (!discordWebhook) { addToast("Aucun webhook Discord configuré", "error"); return; }
    const validOpts = options.filter(o => o.trim());
    if (!question || validOpts.length < 2) { addToast("Remplis la question et au moins 2 options", "error"); return; }
    setSending(true);
    try {
      const optStr = validOpts.map((o, i) => `${EMOJIS[i]} **${o}**`).join("\n");
      await sendDiscordWebhook(discordWebhook, [{
        title: `📊 SONDAGE — ${question}`,
        description: optStr + `\n\n*Réagissez avec ${validOpts.map((_, i) => EMOJIS[i]).join(" ")}*`,
        color: 0x5865f2,
        footer: { text: "ProClubs Stats • Sondage" },
      }]);
      addToast("Sondage envoyé sur Discord !", "success");
      onClose();
    } catch (e) { addToast(`Erreur Discord: ${String(e)}`, "error"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 440,
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Swords size={18} color="var(--accent)" />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--text)", letterSpacing: "0.06em" }}>
              SONDAGE DISCORD
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>❓ Question</label>
            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="ex: Quelle compo pour ce soir ?"
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>OPTIONS</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {options.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{EMOJIS[i]}</span>
                  <input value={o} onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                      padding: "7px 10px", color: "var(--text)", fontSize: 12, outline: "none" }} />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4 }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 8 && (
              <button onClick={addOption} style={{ marginTop: 8, fontSize: 11, color: "var(--accent)", background: "none",
                border: "1px dashed var(--accent)", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}>
                + Ajouter une option
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, background: "var(--bg)",
            border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>Annuler</button>
          <button onClick={send} disabled={sending} style={{ padding: "8px 16px", borderRadius: 6,
            background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.4)",
            color: "#8b9cf4", cursor: sending ? "default" : "pointer",
            fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Send size={12} /> {sending ? "Envoi..." : "Envoyer le sondage"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Galerie moments forts ─────────────────────────────────────────────────────
export function HighlightModal({ onClose }: { onClose: () => void }) {
  const { discordWebhook, currentClub, players, matches, addToast } = useAppStore();
  const [type, setType] = useState<"score" | "player" | "streak" | "custom">("score");
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);

  const latestMatch = [...matches].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))[0];
  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];

  const getMomentData = () => {
    switch (type) {
      case "score": {
        if (!latestMatch || !currentClub) return null;
        const my  = latestMatch.clubs[currentClub.id] as Record<string, unknown> | undefined;
        const opp = Object.entries(latestMatch.clubs).find(([k]) => k !== currentClub.id)?.[1] as Record<string, unknown> | undefined;
        if (!my || !opp) return null;
        const res = Number(my.wins) > 0 ? "VICTOIRE" : Number(my.ties) > 0 ? "NUL" : "DÉFAITE";
        const color = Number(my.wins) > 0 ? 0x22c55e : Number(my.ties) > 0 ? 0xeab308 : 0xef4444;
        return {
          title: `🏆 ${res} — ${currentClub.name}`,
          description: `**${my.goals ?? 0}** - **${opp.goals ?? 0}**\nvs ${opp.customKit ?? "Adversaire"}`,
          color,
        };
      }
      case "player": {
        if (!topScorer) return null;
        return {
          title: `⭐ MOMENT FORT — ${topScorer.name}`,
          description: `**${topScorer.goals}** buts · **${topScorer.assists}** PD · Note moy. **${topScorer.rating > 0 ? topScorer.rating.toFixed(1) : "—"}**`,
          color: 0xffd700,
        };
      }
      case "custom":
        return { title: "📸 MOMENT FORT", description: customText, color: 0x5865f2 };
      default:
        return null;
    }
  };

  const send = async () => {
    if (!discordWebhook) { addToast("Aucun webhook Discord configuré", "error"); return; }
    const data = getMomentData();
    if (!data) { addToast("Aucune donnée disponible", "error"); return; }
    setSending(true);
    try {
      await sendDiscordWebhook(discordWebhook, [{
        ...data,
        footer: { text: `${currentClub?.name ?? "ProClubs Stats"} • Moment fort` },
        timestamp: new Date().toISOString(),
      }]);
      addToast("Moment fort partagé sur Discord !", "success");
      onClose();
    } catch (e) { addToast(`Erreur: ${String(e)}`, "error"); }
    finally { setSending(false); }
  };

  const TYPES = [
    { key: "score" as const,  label: "🏆 Dernier score",   desc: latestMatch ? "Partager le score du dernier match" : "Aucun match disponible" },
    { key: "player" as const, label: "⭐ Top buteur",       desc: topScorer ? `${topScorer.name} — ${topScorer.goals} buts` : "Aucun joueur" },
    { key: "custom" as const, label: "✍️ Message custom",  desc: "Écrire un message personnalisé" },
  ] as const;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 440,
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={18} color="var(--accent)" />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--text)", letterSpacing: "0.06em" }}>
              GALERIE MOMENTS FORTS
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {TYPES.map(t => (
            <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
              borderRadius: 8, cursor: "pointer", border: `1px solid ${type === t.key ? "var(--accent)" : "var(--border)"}`,
              background: type === t.key ? "rgba(0,212,255,0.06)" : "var(--bg)", transition: "all 0.1s" }}>
              <input type="radio" checked={type === t.key} onChange={() => setType(t.key)} style={{ display: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{t.desc}</div>
              </div>
              {type === t.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />}
            </label>
          ))}
        </div>

        {type === "custom" && (
          <textarea value={customText} onChange={e => setCustomText(e.target.value)} rows={3}
            placeholder="Decris le moment fort (score, action, exploit...)"
            style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
              padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", resize: "vertical",
              boxSizing: "border-box", fontFamily: "inherit", marginBottom: 16 }} />
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, background: "var(--bg)",
            border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>Annuler</button>
          <button onClick={send} disabled={sending} style={{ padding: "8px 16px", borderRadius: 6,
            background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.4)",
            color: "#8b9cf4", cursor: sending ? "default" : "pointer",
            fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Send size={12} /> {sending ? "Envoi..." : "Partager sur Discord"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Thread Discord par saison ─────────────────────────────────────────────────
export function SeasonThreadModal({ onClose }: { onClose: () => void }) {
  const { discordWebhook, currentClub, players, sessions, addToast } = useAppStore();
  const [seasonLabel, setSeasonLabel] = useState(`Saison ${new Date().getFullYear()}`);
  const [goal, setGoal] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = (currentClub?.wins ?? 0) + (currentClub?.losses ?? 0) + (currentClub?.ties ?? 0);
  const winPct = total > 0 ? Math.round(((currentClub?.wins ?? 0) / total) * 100) : 0;
  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
  const sessionsCount = sessions.filter((s) => !s.archived).length;

  const buildEmbed = () => ({
    title: `📅 ${seasonLabel.toUpperCase()} — ${currentClub?.name ?? "ProClubs"}`,
    description: [
      `> Nouvelle saison lancée ! Bienvenue à tous.`,
      goal ? `\n**🎯 Objectif :** ${goal}` : "",
    ].filter(Boolean).join("\n"),
    color: 0x5865f2,
    fields: [
      ...(total > 0 ? [
        { name: "📊 Bilan actuel", value: `🟢 **${currentClub?.wins ?? 0}V** · 🟡 **${currentClub?.ties ?? 0}N** · 🔴 **${currentClub?.losses ?? 0}D** · **${winPct}%** victoires`, inline: false },
        { name: "⚽ Buts marqués", value: String(currentClub?.goals ?? 0), inline: true },
        { name: "🎮 Matchs joués", value: String(total), inline: true },
        { name: "📋 Sessions", value: String(sessionsCount), inline: true },
      ] : []),
      ...(topScorer ? [{ name: "🏅 Meilleur buteur", value: `**${topScorer.name}** — ${topScorer.goals} buts · ${topScorer.assists} PD`, inline: false }] : []),
      { name: "📌 Ce fil", value: "Retrouvez ici les récaps de matchs, annonces et stats de la saison.", inline: false },
    ],
    footer: { text: `ProClubs Stats · ${seasonLabel}` },
    timestamp: new Date().toISOString(),
  });

  const send = async () => {
    if (!discordWebhook) { addToast("Aucun webhook Discord configuré", "error"); return; }
    setSending(true);
    try {
      await sendDiscordWebhook(discordWebhook, [buildEmbed()]);
      addToast("Thread saison envoyé sur Discord !", "success");
      onClose();
    } catch (e) { addToast(`Erreur Discord: ${String(e)}`, "error"); }
    finally { setSending(false); }
  };

  const copyText = async () => {
    const e = buildEmbed();
    const lines = [
      `**${e.title}**`,
      e.description ?? "",
      ...(e.fields ?? []).map(f => `**${f.name}**\n${f.value}`),
      `\n_${e.footer?.text}_`,
    ].join("\n\n");
    await navigator.clipboard.writeText(lines).catch(() => {});
    setCopied(true);
    addToast("Texte copié dans le presse-papier !", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: 460,
        border: "1px solid var(--border)", animation: "fadeSlideIn 0.15s ease-out" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={18} color="var(--accent)" />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--text)", letterSpacing: "0.06em" }}>
              THREAD SAISON
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5, marginBottom: 16 }}>
          Envoie un message "début de saison" sur Discord ou copie-le pour l'utiliser comme en-tête de fil.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
              📅 Nom de la saison
            </label>
            <input value={seasonLabel} onChange={e => setSeasonLabel(e.target.value)}
              placeholder="ex: Saison 2025, Division 1..."
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
              🎯 Objectif de saison (optionnel)
            </label>
            <input value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="ex: Top 10 leaderboard, 60% victoires..."
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, background: "var(--bg)",
            border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>
            Annuler
          </button>
          <button onClick={copyText} style={{ padding: "8px 14px", borderRadius: 6,
            background: copied ? "rgba(34,197,94,0.15)" : "var(--hover)",
            border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
            color: copied ? "var(--green)" : "var(--text)", cursor: "pointer",
            fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copié !" : "Copier"}
          </button>
          {discordWebhook && (
            <button onClick={send} disabled={sending || !seasonLabel.trim()} style={{ padding: "8px 16px", borderRadius: 6,
              background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.4)",
              color: "#8b9cf4", cursor: !seasonLabel.trim() || sending ? "default" : "pointer",
              opacity: !seasonLabel.trim() || sending ? 0.6 : 1,
              fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Send size={12} /> {sending ? "Envoi..." : "Envoyer sur Discord"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
