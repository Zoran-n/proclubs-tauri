import { useEffect } from "react";
import { getMatches } from "../api/tauri";
import { useAppStore } from "../store/useAppStore";

export function useSession() {
  const activeSession = useAppStore((s) => s.activeSession);
  const currentClub = useAppStore((s) => s.currentClub);
  const addMatchesToSession = useAppStore((s) => s.addMatchesToSession);

  const sessionId = activeSession?.id;
  const clubId = currentClub?.id;
  const platform = currentClub?.platform;

  useEffect(() => {
    if (!sessionId || !clubId || !platform) return;

    const poll = async () => {
      try {
        const [league, playoff, friendly] = await Promise.all([
          getMatches(clubId, platform, "leagueMatch"),
          getMatches(clubId, platform, "playoffMatch"),
          getMatches(clubId, platform, "friendlies"),
        ]);

        const current = useAppStore.getState().activeSession;
        if (!current) return;

        const existingIds = new Set(current.matches.map((m) => m.matchId));
        const newMatches = [...league, ...playoff, ...friendly].filter(
          (m) => !existingIds.has(m.matchId)
        );

        if (newMatches.length > 0) {
          addMatchesToSession(newMatches);
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [sessionId, clubId, platform, addMatchesToSession]);
}
