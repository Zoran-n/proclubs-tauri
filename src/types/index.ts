export interface Club {
  id: string;
  name: string;
  platform: string;
  skillRating?: string;
  wins: number;
  losses: number;
  ties: number;
  goals: number;
  crestAssetId?: string;
  customKit?: Record<string, unknown>;
}

export interface Player {
  name: string;
  position: string;
  goals: number;
  assists: number;
  passesMade: number;
  tacklesMade: number;
  motm: number;
  rating: number;
  gamesPlayed: number;
}

export interface Match {
  matchId: string;
  timestamp: string;
  matchDuration?: number;
  clubs: Record<string, unknown>;
  players: Record<string, unknown>;
  matchType: string;
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
  darkMode: boolean;
}

export interface ClubData {
  club: Club;
  players: Player[];
  matches: Match[];
  info: unknown;
}

export const PLATFORMS = [
  { label: "PS5 / Xbox Series X", value: "common-gen5" },
  { label: "PS4 / Xbox One", value: "common-gen4" },
  { label: "PC", value: "pc" },
] as const;

export const FORMATIONS = ["433", "4231", "442", "4141", "4321", "352", "343", "532", "541"] as const;

export const THEMES = [
  { id: "cyan",   color: "#00d4ff", label: "Cyan" },
  { id: "violet", color: "#8b5cf6", label: "Violet" },
  { id: "orange", color: "#ff6b35", label: "Orange" },
  { id: "green",  color: "#00ff88", label: "Vert" },
  { id: "red",    color: "#ff3355", label: "Rouge" },
] as const;

export type MatchType = "leagueMatch" | "playoffMatch" | "friendlyMatch";
