import { useEffect, useRef } from "react";
import { getMatches } from "../api/tauri";
import { useClub } from "./useClub";
import { useAppStore } from "../store/useAppStore";

const MATCH_TYPES = ["leagueMatch", "playoffMatch", "friendlyMatch"] as const;
const CACHE_LIMIT = 2000;

function oldestTimestamp(matches: { timestamp: string }[]): string | null {
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))[0]?.timestamp ?? null;
}

/**
 * Handles two automatic behaviours when an EA profile is linked:
 * 1. Load the linked club at startup (once, right after settings are restored).
 * 2. Silently load every match type in the background so the calendar is fully populated.
 */
export function useAutoLoad() {
  const { settingsLoaded, eaProfile, currentClub, matchCache, setMatchCache, persistSettings } = useAppStore();
  const { load } = useClub();
  const didAutoLoad = useRef(false);

  // ── 1. Auto-load club on startup ─────────────────────────────────────────
  useEffect(() => {
    if (!settingsLoaded) return;
    if (!eaProfile?.clubId) return;
    if (didAutoLoad.current) return;
    didAutoLoad.current = true;
    load(eaProfile.clubId, eaProfile.platform);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded, eaProfile?.clubId]);

  // ── 2. Background full-match loader ──────────────────────────────────────
  // Runs whenever the loaded club changes. Loads all 3 match types page by page
  // and stores them in matchCache so the calendar and H2H views have full data.
  useEffect(() => {
    if (!currentClub || !eaProfile?.clubId) return;

    let cancelled = false;
    const club = currentClub;

    async function loadTypeAll(matchType: typeof MATCH_TYPES[number]) {
      const key = `${club.id}_${club.platform}_${matchType}`;
      const cached = matchCache[key] ?? [];

      let accumulated = [...cached];

      // First page (only if nothing cached yet)
      if (accumulated.length === 0) {
        if (!navigator.onLine) return; // Offline: keep existing cache
        try {
          const data = await getMatches(club.id, club.platform, matchType);
          if (cancelled) return;
          accumulated = data;
          setMatchCache(key, accumulated);
          if (data.length < 10) return; // No more pages
        } catch {
          return;
        }
        await sleep(600);
      }

      // Paginate until exhausted or CACHE_LIMIT reached
      let cursor = oldestTimestamp(accumulated);
      while (cursor && !cancelled && accumulated.length < CACHE_LIMIT) {
        if (!navigator.onLine) break; // Offline: keep what we have
        try {
          const data = await getMatches(club.id, club.platform, matchType, cursor);
          if (cancelled) return;
          const existingIds = new Set(accumulated.map((m) => m.matchId));
          const fresh = data.filter((m) => !existingIds.has(m.matchId));
          if (fresh.length === 0) break;
          accumulated = [...accumulated, ...fresh].slice(0, CACHE_LIMIT);
          setMatchCache(key, accumulated);
          if (data.length < 10 || accumulated.length >= CACHE_LIMIT) break;
          cursor = oldestTimestamp(data);
          await sleep(800);
        } catch {
          break;
        }
      }
    }

    async function run() {
      for (const matchType of MATCH_TYPES) {
        if (cancelled) break;
        await loadTypeAll(matchType);
        await sleep(500);
      }
      if (!cancelled) persistSettings();
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClub?.id, eaProfile?.clubId]);
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
