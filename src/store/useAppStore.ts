import { create } from "zustand";
import type { Club, Player, Match, Session, Tactic, EaProfile } from "../types";
import { saveSettings as apiSave, loadSettings as apiLoad, setProxy as apiSetProxy } from "../api/tauri";

export type ActiveTab = "players" | "matches" | "charts" | "session" | "compare";
export type SidebarTab = "search" | "favs" | "settings";

interface AppState {
  currentClub: Club | null;
  players: Player[];
  matches: Match[];
  sessions: Session[];
  tactics: Tactic[];
  history: Club[];
  favs: Club[];
  eaProfile: EaProfile | null;
  theme: string;
  darkMode: boolean;
  showGrid: boolean;
  showAnimations: boolean;
  showLogs: boolean;
  showIdSearch: boolean;
  fontSize: "small" | "medium" | "large";
  proxyUrl: string;
  isLoading: boolean;
  error: string | null;
  activeTab: ActiveTab;
  sidebarTab: SidebarTab;
  activeSession: Session | null;
  viewingSession: Session | null;
  logs: string[];
  rawLogs: string[];
  showDevPanel: boolean;
  proxyInfo: string | null;
  searchResults: Club[];
  showSearchModal: boolean;

  setClub: (club: Club, players: Player[], matches: Match[]) => void;
  addHistory: (club: Club) => void;
  toggleFav: (club: Club) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setActiveTab: (t: ActiveTab) => void;
  setSidebarTab: (t: SidebarTab) => void;
  startSession: (club: Club) => void;
  addSessionMatch: (matches: Match[]) => void;
  stopSession: () => void;
  setViewingSession: (s: Session | null) => void;
  deleteSession: (id: string) => void;
  archiveSession: (id: string) => void;
  setTheme: (t: string) => void;
  setDarkMode: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  setShowAnimations: (v: boolean) => void;
  setShowLogs: (v: boolean) => void;
  setShowIdSearch: (v: boolean) => void;
  setFontSize: (v: "small" | "medium" | "large") => void;
  setEaProfile: (p: EaProfile) => void;
  saveTactic: (t: Tactic) => void;
  deleteTactic: (id: string) => void;
  addLog: (msg: string) => void;
  addRawLog: (msg: string) => void;
  clearRawLogs: () => void;
  toggleDevPanel: () => void;
  setProxyInfo: (v: string | null) => void;
  setSearchResults: (clubs: Club[], show: boolean) => void;
  closeSearchModal: () => void;
  applyProxy: (url: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  persistSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentClub: null, players: [], matches: [], sessions: [], tactics: [],
  history: [], favs: [], eaProfile: null,
  theme: "cyan", darkMode: true, showGrid: true, showAnimations: true,
  showLogs: true, showIdSearch: false, fontSize: "medium",
  proxyUrl: "",
  isLoading: false, error: null,
  activeTab: "players", sidebarTab: "search",
  activeSession: null, viewingSession: null,
  logs: ["Prêt."],
  rawLogs: [],
  showDevPanel: false,
  proxyInfo: null,
  searchResults: [],
  showSearchModal: false,

  setClub: (club, players, matches) => set({ currentClub: club, players, matches, error: null }),
  addHistory: (club) => set((s) => ({
    history: [club, ...s.history.filter((c) => c.id !== club.id)].slice(0, 8),
  })),
  toggleFav: (club) => set((s) => ({
    favs: s.favs.some((c) => c.id === club.id)
      ? s.favs.filter((c) => c.id !== club.id)
      : [...s.favs, club],
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),

  startSession: (club) => set({
    activeSession: {
      id: Date.now().toString(),
      clubName: club.name, clubId: club.id, platform: club.platform,
      date: new Date().toISOString(), matches: [],
    },
  }),
  addSessionMatch: (newMatches) => set((s) => {
    if (!s.activeSession) return {};
    return { activeSession: { ...s.activeSession, matches: [...s.activeSession.matches, ...newMatches] } };
  }),
  stopSession: () => set((s) => {
    if (!s.activeSession) return {};
    return { sessions: [s.activeSession, ...s.sessions].slice(0, 20), activeSession: null };
  }),

  setViewingSession: (viewingSession) => set({ viewingSession }),
  deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
  archiveSession: (id) => set((s) => ({
    sessions: s.sessions.map((x) => x.id === id ? { ...x, archived: !x.archived } : x),
  })),
  setTheme: (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  setDarkMode: (darkMode) => {
    document.documentElement.toggleAttribute("data-light", !darkMode);
    set({ darkMode });
  },
  setShowGrid: (showGrid) => {
    document.documentElement.toggleAttribute("data-no-grid", !showGrid);
    set({ showGrid });
  },
  setShowAnimations: (showAnimations) => {
    document.documentElement.toggleAttribute("data-no-anim", !showAnimations);
    set({ showAnimations });
  },
  setShowLogs: (showLogs) => set({ showLogs }),
  setShowIdSearch: (showIdSearch) => set({ showIdSearch }),
  setFontSize: (fontSize) => {
    document.documentElement.setAttribute("data-fs", fontSize);
    set({ fontSize });
  },
  setEaProfile: (eaProfile) => set({ eaProfile }),
  saveTactic: (t) => set((s) => ({ tactics: [...s.tactics.filter((x) => x.id !== t.id), t] })),
  deleteTactic: (id) => set((s) => ({ tactics: s.tactics.filter((t) => t.id !== id) })),
  addLog: (msg) => set((s) => ({ logs: [...s.logs.slice(-99), msg] })),
  addRawLog: (msg) => set((s) => ({ rawLogs: [...s.rawLogs.slice(-199), msg] })),
  clearRawLogs: () => set({ rawLogs: [] }),
  toggleDevPanel: () => set((s) => ({ showDevPanel: !s.showDevPanel })),
  setProxyInfo: (proxyInfo) => set({ proxyInfo }),
  setSearchResults: (searchResults, show) => set({ searchResults, showSearchModal: show }),
  closeSearchModal: () => set({ showSearchModal: false, searchResults: [] }),

  applyProxy: async (url: string) => {
    await apiSetProxy(url.trim() || null);
    set({ proxyUrl: url });
    get().addLog(`Proxy ${url.trim() ? "activé: " + url.trim() : "désactivé"}`);
  },

  loadSettings: async () => {
    try {
      const s = await apiLoad();
      const root = document.documentElement;
      root.setAttribute("data-theme", s.theme ?? "cyan");
      root.setAttribute("data-fs", s.fontSize ?? "medium");
      root.toggleAttribute("data-light",   !(s.darkMode ?? true));
      root.toggleAttribute("data-no-grid", !(s.showGrid ?? true));
      root.toggleAttribute("data-no-anim", !(s.showAnimations ?? true));
      set({
        history: s.history ?? [], favs: s.favs ?? [],
        tactics: s.tactics ?? [], sessions: s.sessions ?? [],
        eaProfile: s.eaProfile ?? null, theme: s.theme ?? "cyan",
        darkMode:        s.darkMode        ?? true,
        showGrid:        s.showGrid        ?? true,
        showAnimations:  s.showAnimations  ?? true,
        showLogs:        s.showLogs        ?? true,
        showIdSearch:    s.showIdSearch    ?? false,
        fontSize:        (s.fontSize as "small" | "medium" | "large" | undefined) ?? "medium",
        proxyUrl: s.proxyUrl ?? "",
      });
    } catch { /* first launch */ }
  },

  persistSettings: async () => {
    const { history, favs, tactics, sessions, eaProfile, theme, darkMode, proxyUrl,
      showGrid, showAnimations, showLogs, showIdSearch, fontSize } = get();
    await apiSave({
      history, favs, tactics, sessions,
      eaProfile: eaProfile ?? undefined,
      theme, darkMode,
      proxyUrl: proxyUrl.trim() || undefined,
      showGrid, showAnimations, showLogs, showIdSearch, fontSize,
    });
  },
}));
