import { loadClub } from "../api/tauri";
import { useAppStore } from "../store/useAppStore";

export function useClub() {
  const { setClub, setLoading, setError, addHistory, addLog } = useAppStore();

  const load = async (clubId: string, platform: string) => {
    setLoading(true);
    setError(null);
    addLog(`Chargement club ${clubId} (${platform})…`);
    try {
      const data = await loadClub(clubId, platform);
      const club = { ...data.club, platform: data.club.platform || platform, id: data.club.id || clubId };
      setClub(club, data.players, data.matches);
      addHistory(club);
      addLog(`Club: ${club.name} (${platform})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`Erreur: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return { load };
}
