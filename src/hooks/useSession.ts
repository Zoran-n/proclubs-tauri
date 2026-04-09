import { useState, useEffect, useRef } from "react";
import { pollSession } from "../api/tauri";
import { useAppStore } from "../store/useAppStore";
import { notifyNewMatches } from "../utils/notifications";
import type { Match } from "../types";

function matchToastMessage(m: Match, clubId: string): string {
  const ourClub = m.clubs[clubId] as Record<string, unknown> | undefined;
  const ourGoals = Number(ourClub?.["goals"] ?? 0);
  const oppEntry = Object.entries(m.clubs).find(([id]) => id !== clubId);
  const oppGoals = Number((oppEntry?.[1] as Record<string, unknown>)?.["goals"] ?? 0);
  const result = ourClub?.["matchResult"];
  const label = result === "win" ? "Victoire" : result === "loss" ? "Défaite" : "Nul";
  return `${label} ${ourGoals} – ${oppGoals}`;
}

export function useSession() {
  const { activeSession, currentClub, addSessionMatch, addLog, addToast } = useAppStore();
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
      // Only keep matches played AFTER the session started
      const sessionStartSec = Math.floor(new Date(current.date).getTime() / 1000);
      try {
        const fetched = await pollSession(clubId, platform, knownIds);
        const newMatches = fetched.filter(
          (m) => Number(m.timestamp) >= sessionStartSec
        );
        if (newMatches.length > 0) {
          addSessionMatch(newMatches);
          addLog(`Session: ${newMatches.length} nouveau(x) match(s)`);
          notifyNewMatches(newMatches, clubId).catch(() => {});
          // In-app toast for each new match
          for (const m of newMatches) {
            const msg = matchToastMessage(m, clubId);
            const result = (m.clubs[clubId] as Record<string, unknown> | undefined)?.["matchResult"];
            const type = result === "win" ? "success" : result === "loss" ? "error" : "info";
            addToast(`Nouveau match — ${msg}`, type);
          }
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
