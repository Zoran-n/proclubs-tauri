use tauri::State;
use crate::ea_client::EaClient;
use crate::storage::StorageManager;
use crate::models::{Club, ClubData, Match, Player, Settings};

// ─── search_club ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn search_club(
    name: String,
    platform: String,
    ea_client: State<'_, EaClient>,
) -> Result<Vec<Club>, String> {
    ea_client
        .search_clubs(&platform, &name)
        .await
        .map_err(|e| e.to_string())
}

// ─── load_club ────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn load_club(
    club_id: String,
    platform: String,
    ea_client: State<'_, EaClient>,
) -> Result<ClubData, String> {
    let (stats_res, members_res, matches_res) = tokio::join!(
        ea_client.get_club_stats(&platform, &club_id),
        ea_client.get_members(&platform, &club_id),
        ea_client.get_matches(&platform, &club_id, "leagueMatch"),
    );

    let club = stats_res.map_err(|e| e.to_string())?;
    let players = members_res.unwrap_or_default();
    let matches = matches_res.unwrap_or_default();

    Ok(ClubData { club, players, matches })
}

// ─── get_matches ──────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_matches(
    club_id: String,
    platform: String,
    match_type: String,
    ea_client: State<'_, EaClient>,
) -> Result<Vec<Match>, String> {
    ea_client
        .get_matches(&platform, &club_id, &match_type)
        .await
        .map_err(|e| e.to_string())
}

// ─── get_members ──────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_members(
    club_id: String,
    platform: String,
    ea_client: State<'_, EaClient>,
) -> Result<Vec<Player>, String> {
    ea_client
        .get_members(&platform, &club_id)
        .await
        .map_err(|e| e.to_string())
}

// ─── save_settings ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn save_settings(
    settings: Settings,
    storage: State<'_, StorageManager>,
) -> Result<(), String> {
    storage.save_settings(&settings).map_err(|e| e.to_string())
}

// ─── load_settings ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn load_settings(
    storage: State<'_, StorageManager>,
) -> Result<Settings, String> {
    Ok(storage.load_settings())
}

// ─── get_logo ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_logo(
    crest_id: String,
    ea_client: State<'_, EaClient>,
) -> Result<String, String> {
    ea_client
        .get_logo(&crest_id)
        .await
        .map_err(|e| e.to_string())
}
