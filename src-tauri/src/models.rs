use std::collections::HashMap;
use serde::{Deserialize, Serialize};

// ─── Club ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Club {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub platform: String,
    #[serde(default)]
    pub skill_rating: Option<String>,
    #[serde(default)]
    pub wins: u32,
    #[serde(default)]
    pub losses: u32,
    #[serde(default)]
    pub ties: u32,
    #[serde(default)]
    pub goals: u32,
    #[serde(default)]
    pub crest_id: Option<String>,
}

// ─── Player ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Player {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub position: String,
    #[serde(default)]
    pub goals: u32,
    #[serde(default)]
    pub assists: u32,
    #[serde(default)]
    pub passes_made: u32,
    #[serde(default)]
    pub tackles: u32,
    #[serde(default)]
    pub motm: u32,
    #[serde(default)]
    pub rating: f64,
    #[serde(default)]
    pub games_played: u32,
}

// ─── Match ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Match {
    #[serde(default)]
    pub match_id: String,
    #[serde(default)]
    pub timestamp: String,
    #[serde(default)]
    pub clubs: HashMap<String, serde_json::Value>,
    #[serde(default)]
    pub players: HashMap<String, serde_json::Value>,
    #[serde(default)]
    pub match_type: String,
    #[serde(default)]
    pub duration: Option<u32>,
}

// ─── Tactic ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Tactic {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub formation: String,
    #[serde(default)]
    pub sliders: HashMap<String, f32>,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub ea_code: Option<String>,
}

// ─── Session ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub club_name: String,
    #[serde(default)]
    pub club_id: String,
    #[serde(default)]
    pub platform: String,
    #[serde(default)]
    pub date: String,
    #[serde(default)]
    pub matches: Vec<Match>,
}

// ─── EaProfile ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EaProfile {
    #[serde(default)]
    pub gamertag: String,
    #[serde(default)]
    pub platform: String,
    #[serde(default)]
    pub club_id: String,
    #[serde(default)]
    pub club_name: String,
}

// ─── Settings ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default)]
    pub history: Vec<Club>,
    #[serde(default)]
    pub favs: Vec<Club>,
    #[serde(default)]
    pub tactics: Vec<Tactic>,
    #[serde(default)]
    pub sessions: Vec<Session>,
    #[serde(default)]
    pub ea_profile: Option<EaProfile>,
    #[serde(default = "default_theme")]
    pub theme: String,
}

fn default_theme() -> String {
    "cyan".to_string()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            history: vec![],
            favs: vec![],
            tactics: vec![],
            sessions: vec![],
            ea_profile: None,
            theme: "cyan".to_string(),
        }
    }
}

// ─── ClubData ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClubData {
    pub club: Club,
    pub players: Vec<Player>,
    pub matches: Vec<Match>,
}

