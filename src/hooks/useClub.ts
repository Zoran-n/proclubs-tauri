import { loadClub, getMatches } from "../api/tauri";
import { useAppStore } from "../store/useAppStore";
import type { Club } from "../types";

export function useClub() {
  const { setClub, setLoading, setError, addToHistory } = useAppStore();

  const load = async (clubId: string, platform: string, clubHint?: Partial<Club>) => {
    setLoading(true);
    setError(null);
    try {
      const [clubData, leagueMatches] = await Promise.all([
        loadClub(clubId, platform),
        getMatches(clubId, platform, "leagueMatch"),
      ]);

      const club: Club = {
        ...clubData.club,
        // Preserve platform from caller if backend doesn't return it
        platform: clubData.club.platform || platform,
        id: clubData.club.id || clubId,
        name: clubData.club.name || clubHint?.name || clubId,
      };

      setClub(club, clubData.players, leagueMatches);
      addToHistory(club);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return { load };
}
