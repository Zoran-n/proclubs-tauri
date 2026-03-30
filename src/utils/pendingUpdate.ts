import type { Update } from "@tauri-apps/plugin-updater";

// Module-level store for the pending update object (can't be serialized to Zustand)
let _update: Update | null = null;
let _manualUrl: string | null = null;

export const setPendingUpdate = (u: Update | null) => { _update = u; _manualUrl = null; };
export const setPendingManualUrl = (url: string | null) => { _manualUrl = url; _update = null; };
export const getPendingUpdate = () => _update;
export const getPendingManualUrl = () => _manualUrl;
export const hasPendingUpdate = () => _update !== null || _manualUrl !== null;
