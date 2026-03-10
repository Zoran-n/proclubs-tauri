import { invoke } from "@tauri-apps/api/core";
import type { Club, ClubData, Match, Player, Settings } from "../types";

export const searchClub = (name: string, platform?: string) =>
  invoke<Club[]>("search_club", { name, platform: platform ?? null });

export const loadClub = (clubId: string, platform: string) =>
  invoke<ClubData>("load_club", { clubId, platform });

export const getMatches = (clubId: string, platform: string, matchType: string) =>
  invoke<Match[]>("get_matches", { clubId, platform, matchType });

export const getMembers = (clubId: string, platform: string) =>
  invoke<Player[]>("get_members", { clubId, platform });

export const getLogo = (crestId: string) =>
  invoke<string>("get_logo", { crestId });

export const saveSettings = (settings: Settings) =>
  invoke<void>("save_settings", { settings });

export const loadSettings = () =>
  invoke<Settings>("load_settings");

export const pollSession = (clubId: string, platform: string, knownIds: string[]) =>
  invoke<Match[]>("poll_session", { clubId, platform, knownIds });

export const detectPlatform = (clubId: string) =>
  invoke<string>("detect_platform", { clubId });
