import { create } from "zustand";
import type { Club, Player, Match, Session, Tactic, EaProfile, CompareEntry } from "../types";
import type { ToastMessage } from "../components/ui/Toast";
import { saveSettings as apiSave, loadSettings as apiLoad, setProxy as apiSetProxy } from "../api/tauri";
import type { Lang } from "../i18n";

export type ActiveTab = "players" | "matches" | "charts" | "session" | "compare";
export type SidebarTab = "search" | "favs" | "settings" | "profile";

// Injects a <style> tag that proportionally overrides hard-coded inline font-size px values.
// This scales only text, without affecting layout dimensions or icons.
function applyFontScale(fontSize: number) {
  const scale = fontSize / 13;
  document.documentElement.style.setProperty("--fs", `${fontSize}px`);
  let styleEl = document.getElementById("fs-scale") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "fs-scale";
    document.head.appendChild(styleEl);
  }
  const sizes = [9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 48];
  styleEl.textContent = sizes.map(px =>
    `[style*="font-size: ${px}px"] { font-size: ${Math.round(px * scale)}px !important; }`
  ).join("\n");
}

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
  fontSize: number;
  fontFamily: string;
  customAccent: string;
  language: Lang;
  onboarded: boolean;
  settingsLoaded: boolean;
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
  compareHistory: CompareEntry[];
  searchResults: Club[];
  showSearchModal: boolean;
  toasts: ToastMessage[];
  matchCache: Record<string, Match[]>;
  discordWebhook: string;
  autoUpdate: boolean;
  updateAvailable: boolean;

  addCompareEntry: (entry: CompareEntry) => void;
  deleteCompareEntry: (id: string) => void;
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
  setFontSize: (v: number) => void;
  setFontFamily: (v: string) => void;
  setCustomAccent: (v: string) => void;
  setLanguage: (v: Lang) => void;
  setOnboarded: () => void;
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
  addToast: (message: string, type?: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
  setMatchCache: (key: string, matches: Match[]) => void;
  setDiscordWebhook: (v: string) => void;
  setAutoUpdate: (v: boolean) => void;
  setUpdateAvailable: (v: boolean) => void;
  applyProxy: (url: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  persistSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentClub: null, players: [], matches: [], sessions: [], tactics: [],
  history: [], favs: [], eaProfile: null,
  theme: "cyan", darkMode: true, showGrid: true, showAnimations: true,
  showLogs: true, showIdSearch: false, fontSize: 13, fontFamily: "barlow",
  customAccent: "",
  language: "fr" as Lang,
  onboarded: false,
  settingsLoaded: false,
  proxyUrl: "",
  isLoading: false, error: null,
  activeTab: "players", sidebarTab: "search",
  activeSession: null, viewingSession: null,
  logs: ["Prêt."],
  rawLogs: [],
  showDevPanel: false,
  proxyInfo: null,
  compareHistory: [],
  searchResults: [],
  showSearchModal: false,
  toasts: [],
  matchCache: {},
  discordWebhook: "",
  autoUpdate: false,
  updateAvailable: false,

  addCompareEntry: (entry) => set((s) => ({
    compareHistory: [entry, ...s.compareHistory.filter((e) => e.id !== entry.id)].slice(0, 20),
  })),
  deleteCompareEntry: (id) => set((s) => ({ compareHistory: s.compareHistory.filter((e) => e.id !== id) })),
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
    return { sessions: [s.activeSession, ...s.sessions], activeSession: null };
  }),

  setViewingSession: (viewingSession) => set({ viewingSession }),
  deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
  archiveSession: (id) => set((s) => ({
    sessions: s.sessions.map((x) => x.id === id ? { ...x, archived: !x.archived } : x),
  })),
  setTheme: (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "custom") {
      const accent = get().customAccent || "#00d4ff";
      document.documentElement.style.setProperty("--accent", accent);
    } else {
      document.documentElement.style.removeProperty("--accent");
    }
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
    const clamped = Math.max(10, Math.min(20, fontSize));
    applyFontScale(clamped);
    set({ fontSize: clamped });
  },
  setFontFamily: (fontFamily) => {
    if (fontFamily === "barlow") {
      document.documentElement.removeAttribute("data-font");
    } else {
      document.documentElement.setAttribute("data-font", fontFamily);
    }
    set({ fontFamily });
  },
  setCustomAccent: (customAccent) => {
    document.documentElement.style.setProperty("--accent", customAccent);
    set({ customAccent, theme: "custom" });
    document.documentElement.setAttribute("data-theme", "custom");
  },
  setLanguage: (language) => set({ language }),
  setOnboarded: () => set({ onboarded: true }),
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
  addToast: (message, type = "info") => set((s) => ({
    toasts: [...s.toasts, { id: `${Date.now()}-${Math.random()}`, message, type }],
  })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setMatchCache: (key, matches) => set((s) => ({ matchCache: { ...s.matchCache, [key]: matches } })),
  setDiscordWebhook: (discordWebhook) => set({ discordWebhook }),
  setAutoUpdate: (autoUpdate) => set({ autoUpdate }),
  setUpdateAvailable: (updateAvailable) => set({ updateAvailable }),

  applyProxy: async (url: string) => {
    await apiSetProxy(url.trim() || null);
    set({ proxyUrl: url });
    get().addLog(`Proxy ${url.trim() ? "activé: " + url.trim() : "désactivé"}`);
  },

  loadSettings: async () => {
    try {
      const s = await apiLoad();
      const root = document.documentElement;
      const theme = s.theme ?? "cyan";
      root.setAttribute("data-theme", theme);
      // Convert old string values to numeric px
      const fsRaw = s.fontSize;
      const numFs = fsRaw === "small" ? 11 : fsRaw === "large" ? 15 : fsRaw === "medium" ? 13
        : Math.max(10, Math.min(20, Number(fsRaw) || 13));
      root.removeAttribute("data-fs");
      applyFontScale(numFs);
      // Font family
      const ff = s.fontFamily ?? "barlow";
      if (ff === "barlow") root.removeAttribute("data-font");
      else root.setAttribute("data-font", ff);
      root.toggleAttribute("data-light",   !(s.darkMode ?? true));
      root.toggleAttribute("data-no-grid", !(s.showGrid ?? true));
      root.toggleAttribute("data-no-anim", !(s.showAnimations ?? true));
      if (theme === "custom" && s.customAccent) {
        root.style.setProperty("--accent", s.customAccent);
      }
      set({
        history: s.history ?? [], favs: s.favs ?? [],
        tactics: s.tactics ?? [], sessions: s.sessions ?? [],
        compareHistory: s.compareHistory ?? [],
        eaProfile: s.eaProfile ?? null, theme,
        customAccent: s.customAccent ?? "",
        darkMode:        s.darkMode        ?? true,
        showGrid:        s.showGrid        ?? true,
        showAnimations:  s.showAnimations  ?? true,
        showLogs:        s.showLogs        ?? true,
        showIdSearch:    s.showIdSearch    ?? false,
        fontSize: numFs,
        fontFamily: ff,
        language: (s.language as Lang) ?? "fr",
        onboarded: s.onboarded ?? false,
        proxyUrl: s.proxyUrl ?? "",
        matchCache: s.matchCache ?? {},
        discordWebhook: s.discordWebhook ?? "",
        autoUpdate: s.autoUpdate ?? false,
        settingsLoaded: true,
      });
    } catch { /* first launch */ } finally {
      set({ settingsLoaded: true });
    }
  },

  persistSettings: async () => {
    const { history, favs, tactics, sessions, compareHistory, eaProfile, theme, darkMode, proxyUrl,
      showGrid, showAnimations, showLogs, showIdSearch, fontSize, fontFamily, customAccent, language, onboarded, matchCache, discordWebhook, autoUpdate } = get();
    await apiSave({
      history, favs, tactics, sessions, compareHistory,
      eaProfile: eaProfile ?? undefined,
      theme, darkMode,
      proxyUrl: proxyUrl.trim() || undefined,
      showGrid, showAnimations, showLogs, showIdSearch,
      fontSize: String(fontSize),
      fontFamily,
      customAccent: customAccent || undefined,
      language,
      onboarded,
      matchCache,
      discordWebhook: discordWebhook.trim() || undefined,
      autoUpdate,
    });
  },
}));
