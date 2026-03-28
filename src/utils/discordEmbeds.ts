import type { Club, Player, Match } from "../types";
import type { DiscordEmbed } from "../api/discord";

function oppInfo(match: Match, clubId: string) {
  const myData  = match.clubs[clubId] as Record<string, unknown> | undefined;
  const oppEntry = Object.entries(match.clubs).find(([k]) => k !== clubId);
  const oppData  = oppEntry?.[1] as Record<string, unknown> | undefined;
  const oppDet   = oppData?.["details"] as Record<string, unknown> | undefined;
  const oppName  = String(oppDet?.["name"] ?? oppData?.["name"] ?? "?");
  const myGoals  = String(myData?.["goals"]  ?? "?");
  const oppGoals = String(oppData?.["goals"] ?? "?");
  const res = myData?.["wins"] === "1" ? "✅" : myData?.["losses"] === "1" ? "❌" : "🟡";
  return { oppName, myGoals, oppGoals, res };
}

export function buildClubOverviewEmbed(club: Club, players: Player[]): DiscordEmbed {
  const total   = club.wins + club.losses + club.ties;
  const winRate = total > 0 ? Math.round((club.wins / total) * 100) : 0;
  const color   = winRate >= 60 ? 0x23a559 : winRate >= 45 ? 0xfaa81a : 0xda373c;
  const topScorer   = players.length > 0 ? [...players].sort((a, b) => b.goals   - a.goals)[0]   : null;
  const topAssister = players.length > 0 ? [...players].sort((a, b) => b.assists - a.assists)[0] : null;

  const fields: DiscordEmbed["fields"] = [
    { name: "Bilan", value: `${club.wins}V · ${club.ties}N · ${club.losses}D`, inline: false },
    { name: "⚽ Buts", value: String(club.goals), inline: true },
    { name: "📈 Win Rate", value: `${winRate}%`, inline: true },
    ...(club.skillRating ? [{ name: "⭐ SR", value: club.skillRating, inline: true }] : []),
    ...(topScorer    && topScorer.goals   > 0 ? [{ name: "🎯 Top Buteur",   value: `${topScorer.name} (${topScorer.goals} buts)`,         inline: true }] : []),
    ...(topAssister  && topAssister.assists > 0 ? [{ name: "🅰️ Top Passeur", value: `${topAssister.name} (${topAssister.assists} passes)`, inline: true }] : []),
  ];
  return {
    title: `🏟️ ${club.name}`,
    color,
    description: `${club.platform.toUpperCase()} · ${total} match${total !== 1 ? "s" : ""} joués`,
    fields,
    footer: { text: "ProClubs Stats" },
  };
}

export function buildPlayersEmbed(players: Player[], clubName: string): DiscordEmbed {
  const topScorers   = [...players].sort((a, b) => b.goals   - a.goals).slice(0, 5).filter(p => p.goals > 0);
  const topAssisters = [...players].sort((a, b) => b.assists - a.assists).slice(0, 5).filter(p => p.assists > 0);
  const topRatings   = [...players].sort((a, b) => b.rating  - a.rating).slice(0, 5).filter(p => p.rating > 0);
  const fields: DiscordEmbed["fields"] = [];
  if (topScorers.length)   fields.push({ name: "⚽ Top Buteurs",        value: topScorers.map(p =>   `${p.name} (${p.goals})`).join(", "),         inline: false });
  if (topAssisters.length) fields.push({ name: "🅰️ Top Passeurs",       value: topAssisters.map(p => `${p.name} (${p.assists})`).join(", "),       inline: false });
  if (topRatings.length)   fields.push({ name: "⭐ Meilleures Notes",    value: topRatings.map(p =>   `${p.name} ${p.rating.toFixed(1)}`).join(", "), inline: false });
  return {
    title: `👥 Joueurs — ${clubName}`,
    color: 0x00d4ff,
    description: `${players.length} joueur${players.length !== 1 ? "s" : ""}`,
    fields: fields.length ? fields : undefined,
    footer: { text: "ProClubs Stats" },
  };
}

export function buildMatchesEmbed(matches: Match[], clubId: string, clubName: string): DiscordEmbed {
  const lines = matches.slice(0, 8).map(m => {
    const { oppName, myGoals, oppGoals, res } = oppInfo(m, clubId);
    return `${res} **${myGoals}—${oppGoals}** vs ${oppName}`;
  });
  return {
    title: `⚽ Matchs récents — ${clubName}`,
    color: 0x00d4ff,
    description: lines.length > 0 ? lines.join("\n") : "Aucun match récent",
    footer: { text: "ProClubs Stats" },
  };
}

export function buildChartsEmbed(club: Club): DiscordEmbed {
  const total   = club.wins + club.losses + club.ties;
  const winRate = total > 0 ? Math.round((club.wins / total) * 100) : 0;
  const color   = winRate >= 60 ? 0x23a559 : winRate >= 45 ? 0xfaa81a : 0xda373c;
  return {
    title: `📊 Statistiques — ${club.name}`,
    color,
    fields: [
      { name: "Matchs joués", value: String(total),         inline: true },
      { name: "✅ Victoires",  value: String(club.wins),     inline: true },
      { name: "🟡 Nuls",      value: String(club.ties),      inline: true },
      { name: "❌ Défaites",  value: String(club.losses),    inline: true },
      { name: "⚽ Buts",       value: String(club.goals),    inline: true },
      { name: "📈 Win Rate",  value: `${winRate}%`,          inline: true },
      ...(club.skillRating ? [{ name: "⭐ Skill Rating", value: club.skillRating, inline: true as const }] : []),
    ],
    footer: { text: "ProClubs Stats" },
  };
}
