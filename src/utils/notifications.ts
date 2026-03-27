import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { Match } from "../types";

let permissionChecked = false;
let permissionGranted = false;

async function ensurePermission(): Promise<boolean> {
  if (permissionChecked) return permissionGranted;
  permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const result = await requestPermission();
    permissionGranted = result === "granted";
  }
  permissionChecked = true;
  return permissionGranted;
}

export async function notifyNewMatches(matches: Match[], clubId: string) {
  if (matches.length === 0) return;
  const ok = await ensurePermission();
  if (!ok) return;

  if (matches.length === 1) {
    const m = matches[0];
    const clubData = m.clubs[clubId] as Record<string, unknown> | undefined;
    const result = String(clubData?.["matchResult"] ?? "");
    const goals = clubData?.["goals"] ?? "?";
    const label = result === "win" ? "Victoire" : result === "loss" ? "Défaite" : "Match nul";
    sendNotification({
      title: `Nouveau match détecté`,
      body: `${label} — ${goals} but(s) (${m.matchType})`,
    });
  } else {
    const wins = matches.filter((m) => {
      const cd = m.clubs[clubId] as Record<string, unknown> | undefined;
      return cd?.["matchResult"] === "win";
    }).length;
    sendNotification({
      title: `${matches.length} nouveaux matchs détectés`,
      body: `${wins} victoire${wins !== 1 ? "s" : ""} sur ${matches.length} match${matches.length !== 1 ? "s" : ""}`,
    });
  }
}
