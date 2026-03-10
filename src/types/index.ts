export interface Club {
  id: string;
  name: string;
  platform: string;
  skillRating?: string;
  wins: number;
  losses: number;
  ties: number;
  goals: number;
  crestId?: string;
}

export interface Player {
  name: string;
  position: string;
  goals: number;
  assists: number;
  passesMade: number;
  tackles: number;
  motm: number;
  rating: number;
  gamesPlayed: number;
}

export interface Match {
  matchId: string;
  timestamp: string;
  clubs: Record<string, unknown>;
  players: Record<string, unknown>;
  matchType: string;
  duration?: number;
}

export interface Tactic {
  id: string;
  name: string;
  formation: string;
  sliders: Record<string, number>;
  notes: string;
  eaCode?: string;
}

export interface Session {
  id: string;
  clubName: string;
  clubId: string;
  platform: string;
  date: string;
  matches: Match[];
}

export interface EaProfile {
  gamertag: string;
  platform: string;
  clubId: string;
  clubName: string;
}

export interface Settings {
  history: Club[];
  favs: Club[];
  tactics: Tactic[];
  sessions: Session[];
  eaProfile?: EaProfile;
  theme: string;
}

export interface ClubData {
  club: Club;
  players: Player[];
  matches: Match[];
}

export const PLATFORMS = [
  { label: "PlayStation 5", value: "common-gen5" },
  { label: "PlayStation 4", value: "common-gen4" },
  { label: "PC / Xbox", value: "pc" },
] as const;

export const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "4-2-3-1",
  "3-5-2",
  "4-1-2-1-2",
  "5-3-2",
  "4-5-1",
  "3-4-3",
  "4-2-2-2",
] as const;

export const THEMES = ["cyan", "purple", "green", "orange", "red"] as const;

export const THEME_COLORS: Record<string, string> = {
  cyan: "#00d4ff",
  purple: "#a855f7",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
};

export type MatchType = "leagueMatch" | "playoffMatch" | "friendlies";

export const MATCH_TYPES: { label: string; value: MatchType }[] = [
  { label: "League", value: "leagueMatch" },
  { label: "Playoff", value: "playoffMatch" },
  { label: "Friendly", value: "friendlies" },
];
