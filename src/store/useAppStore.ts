import { create } from "zustand";
import type { Club, Player, Match, Session, Tactic, EaProfile, Settings } from "../types";
import {
  saveSettings as apiSaveSettings,
  loadSettings as apiLoadSettings,
} from "../api/tauri";

export type ActiveTab = "players" | "matches" | "charts" | "session" | "tactics";
export type SidebarTab = "search" | "session" | "compare" | "settings";

interface AppState {
  // ─── Data ──────────────────────────────────────────────────────────────────
  currentClub: Club | null;
  players: Player[];
  matches: Match[];
  sessions: Session[];
  tactics: Tactic[];
  history: Club[];
  favs: Club[];
  eaProfile: EaProfile | null;
  theme: string;
  // ─── UI ────────────────────────────────────────────────────────────────────
  isLoading: boolean;
  error: string | null;
  activeTab: ActiveTab;
  sidebarTab: SidebarTab;
  activeSession: Session | null;
  // ─── Actions ───────────────────────────────────────────────────────────────
  setClub: (club: Club, players: Player[], matches: Match[]) => void;
  addToHistory: (club: Club) => void;
  toggleFav: (club: Club) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  startSession: (club: Club) => void;
  stopSession: () => Session | null;
  addMatchesToSession: (matches: Match[]) => void;
  setTheme: (theme: string) => void;
  setEaProfile: (profile: EaProfile) => void;
  addTactic: (tactic: Tactic) => void;
  deleteTactic: (id: string) => void;
  loadSettings: () => Promise<void>;
  persistSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Initial state ──────────────────────────────────────────────────────────
  currentClub: null,
  players: [],
  matches: [],
  sessions: [],
  tactics: [],
  history: [],
  favs: [],
  eaProfile: null,
  theme: "cyan",
  isLoading: false,
  error: null,
  activeTab: "players",
  sidebarTab: "search",
  activeSession: null,

  // ─── Actions ─────────────────────────────────────────────────────────────────

  setClub: (club, players, matches) =>
    set({ currentClub: club, players, matches, error: null }),

  addToHistory: (club) =>
    set((s) => ({
      history: [club, ...s.history.filter((c) => c.id !== club.id)].slice(0, 8),
    })),

  toggleFav: (club) =>
    set((s) => {
      const exists = s.favs.some((c) => c.id === club.id);
      return {
        favs: exists ? s.favs.filter((c) => c.id !== club.id) : [...s.favs, club],
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),

  setTheme: (theme) => {
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },

  setEaProfile: (eaProfile) => set({ eaProfile }),

  startSession: (club) => {
    const session: Session = {
      id: Date.now().toString(),
      clubName: club.name,
      clubId: club.id,
      platform: club.platform,
      date: new Date().toISOString(),
      matches: [],
    };
    set({ activeSession: session });
  },

  stopSession: () => {
    const { activeSession } = get();
    if (!activeSession) return null;
    set((s) => ({
      sessions: [activeSession, ...s.sessions],
      activeSession: null,
    }));
    return activeSession;
  },

  addMatchesToSession: (newMatches) =>
    set((s) => {
      if (!s.activeSession) return {};
      return {
        activeSession: {
          ...s.activeSession,
          matches: [...s.activeSession.matches, ...newMatches],
        },
      };
    }),

  addTactic: (tactic) =>
    set((s) => ({
      tactics: [...s.tactics.filter((t) => t.id !== tactic.id), tactic],
    })),

  deleteTactic: (id) =>
    set((s) => ({ tactics: s.tactics.filter((t) => t.id !== id) })),

  loadSettings: async () => {
    try {
      const settings = await apiLoadSettings();
      document.documentElement.dataset.theme = settings.theme;
      set({
        history: settings.history ?? [],
        favs: settings.favs ?? [],
        tactics: settings.tactics ?? [],
        sessions: settings.sessions ?? [],
        eaProfile: settings.eaProfile ?? null,
        theme: settings.theme ?? "cyan",
      });
    } catch {
      // First launch — no settings file yet
    }
  },

  persistSettings: async () => {
    const { history, favs, tactics, sessions, eaProfile, theme } = get();
    const settings: Settings = { history, favs, tactics, sessions, eaProfile: eaProfile ?? undefined, theme };
    await apiSaveSettings(settings);
  },
}));
