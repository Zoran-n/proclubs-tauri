import { useState, useEffect, useRef } from "react";
import { pollSession } from "../api/tauri";
import { useAppStore } from "../store/useAppStore";

export function useSession() {
  const { activeSession, currentClub, addSessionMatch, addLog } = useAppStore();
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sessionId = activeSession?.id;
  const clubId = currentClub?.id;
  const platform = currentClub?.platform;

  useEffect(() => {
    if (!sessionId || !clubId || !platform) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countRef.current) clearInterval(countRef.current);
      return;
    }

    const doPoll = async () => {
      setCountdown(30);
      const current = useAppStore.getState().activeSession;
      if (!current) return;
      const knownIds = current.matches.map((m) => m.matchId);
      try {
        const newMatches = await pollSession(clubId, platform, knownIds);
        if (newMatches.length > 0) {
          addSessionMatch(newMatches);
          addLog(`Session: ${newMatches.length} nouveau(x) match(s)`);
        }
      } catch { /* ignore */ }
    };

    doPoll();
    intervalRef.current = setInterval(doPoll, 30_000);
    countRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? 30 : c - 1)), 1_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [sessionId, clubId, platform]);

  return { countdown };
}
