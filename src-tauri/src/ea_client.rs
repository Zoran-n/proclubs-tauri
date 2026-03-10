use anyhow::{anyhow, Result};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use reqwest::header::{HeaderMap, HeaderValue, ORIGIN, REFERER, USER_AGENT};

use crate::models::{Club, Match, Player};

pub struct EaClient {
    base_url: String,
    http_client: reqwest::Client,
}

impl EaClient {
    pub fn new() -> Self {
        let mut headers = HeaderMap::new();
        headers.insert(
            USER_AGENT,
            HeaderValue::from_static(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            ),
        );
        headers.insert(
            ORIGIN,
            HeaderValue::from_static("https://www.ea.com"),
        );
        headers.insert(
            REFERER,
            HeaderValue::from_static("https://www.ea.com/"),
        );

        let http_client = reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .expect("Failed to build reqwest client");

        Self {
            base_url: "https://proclubs.ea.com/api/fc".to_string(),
            http_client,
        }
    }

    // ─── Search clubs by name ───────────────────────────────────────────────

    pub async fn search_clubs(&self, platform: &str, name: &str) -> Result<Vec<Club>> {
        let url = format!("{}/clubs/search?platform={}&clubName={}", self.base_url, platform, name);
        let resp: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;

        let clubs_raw = resp
            .get("clubs")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();

        let clubs = clubs_raw
            .into_iter()
            .filter_map(|v| Self::parse_club_from_search(&v, platform))
            .collect();

        Ok(clubs)
    }

    fn parse_club_from_search(v: &serde_json::Value, platform: &str) -> Option<Club> {
        Some(Club {
            id: v.get("clubId")?.as_str().unwrap_or("").to_string(),
            name: v.get("name")?.as_str().unwrap_or("").to_string(),
            platform: platform.to_string(),
            skill_rating: v.get("skillRating").and_then(|s| s.as_str()).map(String::from),
            wins: v.get("wins").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            losses: v.get("losses").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            ties: v.get("ties").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            goals: v.get("goals").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            crest_id: v.get("customKit").and_then(|k| k.get("crestId")).and_then(|s| s.as_str()).map(String::from),
        })
    }

    // ─── Get club stats ─────────────────────────────────────────────────────

    pub async fn get_club_stats(&self, platform: &str, club_id: &str) -> Result<Club> {
        let url = format!("{}/clubs/stats?platform={}&clubIds={}", self.base_url, platform, club_id);
        let resp: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;

        // EA returns an object keyed by clubId
        let club_val = resp
            .get(club_id)
            .or_else(|| resp.as_object().and_then(|o| o.values().next()))
            .ok_or_else(|| anyhow!("Club stats not found for id: {}", club_id))?;

        Ok(Club {
            id: club_id.to_string(),
            name: club_val.get("name").and_then(|s| s.as_str()).unwrap_or("").to_string(),
            platform: platform.to_string(),
            skill_rating: club_val.get("skillRating").and_then(|s| s.as_str()).map(String::from),
            wins: club_val.get("wins").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            losses: club_val.get("losses").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            ties: club_val.get("ties").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            goals: club_val.get("goals").and_then(|n| n.as_u64()).unwrap_or(0) as u32,
            crest_id: club_val.get("customKit").and_then(|k| k.get("crestId")).and_then(|s| s.as_str()).map(String::from),
        })
    }

    // ─── Get club info ──────────────────────────────────────────────────────

    pub async fn get_club_info(&self, platform: &str, club_id: &str) -> Result<serde_json::Value> {
        let url = format!("{}/clubs/info?platform={}&clubIds={}", self.base_url, platform, club_id);
        let resp: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;
        Ok(resp)
    }

    // ─── Get matches ────────────────────────────────────────────────────────

    pub async fn get_matches(
        &self,
        platform: &str,
        club_id: &str,
        match_type: &str,
    ) -> Result<Vec<Match>> {
        let url = format!(
            "{}/clubs/matches?platform={}&clubIds={}&matchType={}",
            self.base_url, platform, club_id, match_type
        );
        let resp: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;

        let raw_matches = if let Some(arr) = resp.as_array() {
            arr.clone()
        } else if let Some(data) = resp.get("data").and_then(|v| v.as_array()) {
            data.clone()
        } else {
            return Ok(vec![]);
        };

        let matches = raw_matches
            .into_iter()
            .map(|v| Self::parse_match(&v, match_type))
            .collect();

        Ok(matches)
    }

    fn parse_match(v: &serde_json::Value, match_type: &str) -> Match {
        Match {
            match_id: v.get("matchId").and_then(|s| s.as_str()).unwrap_or("").to_string(),
            timestamp: v.get("timestamp").and_then(|s| s.as_str()).unwrap_or("").to_string(),
            clubs: v.get("clubs")
                .and_then(|c| c.as_object())
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default(),
            players: v.get("players")
                .and_then(|p| p.as_object())
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default(),
            match_type: match_type.to_string(),
            duration: v.get("duration").and_then(|n| n.as_u64()).map(|n| n as u32),
        }
    }

    // ─── Get members/players ────────────────────────────────────────────────

    pub async fn get_members(&self, platform: &str, club_id: &str) -> Result<Vec<Player>> {
        let url = format!("{}/members/stats?platform={}&clubId={}", self.base_url, platform, club_id);
        let resp: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;

        let members_raw = if let Some(arr) = resp.get("members").and_then(|v| v.as_array()) {
            arr.clone()
        } else if let Some(arr) = resp.as_array() {
            arr.clone()
        } else {
            return Ok(vec![]);
        };

        let players = members_raw
            .into_iter()
            .filter_map(|v| Self::parse_player(&v))
            .collect();

        Ok(players)
    }

    fn parse_player(v: &serde_json::Value) -> Option<Player> {
        let name = v.get("name").or_else(|| v.get("blazeId"))?.as_str()?.to_string();
        Some(Player {
            name,
            position: v.get("position").and_then(|s| s.as_str()).unwrap_or("").to_string(),
            goals: Self::parse_u32(v, "goals"),
            assists: Self::parse_u32(v, "assists"),
            passes_made: Self::parse_u32(v, "passesMade").max(Self::parse_u32(v, "passesmade")),
            tackles: Self::parse_u32(v, "tacklesMade").max(Self::parse_u32(v, "tacklesmade")),
            motm: Self::parse_u32(v, "manOfTheMatch"),
            rating: v.get("ratingAve")
                .and_then(|n| n.as_f64())
                .or_else(|| v.get("rating").and_then(|n| n.as_f64()))
                .unwrap_or(0.0),
            games_played: Self::parse_u32(v, "gamesPlayed"),
        })
    }

    fn parse_u32(v: &serde_json::Value, key: &str) -> u32 {
        v.get(key)
            .and_then(|n| n.as_u64().or_else(|| n.as_str().and_then(|s| s.parse().ok())))
            .unwrap_or(0) as u32
    }

    // ─── Get club logo as base64 ────────────────────────────────────────────

    pub async fn get_logo(&self, crest_id: &str) -> Result<String> {
        let url = format!("https://www.ea.com/fifa/competitors/crest/l/{}.png", crest_id);
        let bytes = self.http_client.get(&url).send().await?.bytes().await?;
        Ok(format!("data:image/png;base64,{}", B64.encode(&bytes)))
    }
}
