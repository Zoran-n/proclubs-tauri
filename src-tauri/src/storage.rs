use std::path::PathBuf;
use anyhow::Result;
use crate::models::Settings;

pub struct StorageManager {
    settings_path: PathBuf,
}

impl StorageManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let settings_path = app_data_dir.join("ProClubsStats").join("settings.json");
        Self { settings_path }
    }

    pub fn save_settings(&self, settings: &Settings) -> Result<()> {
        if let Some(parent) = self.settings_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(settings)?;
        std::fs::write(&self.settings_path, json)?;
        Ok(())
    }

    pub fn load_settings(&self) -> Settings {
        match std::fs::read_to_string(&self.settings_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Settings::default(),
        }
    }
}
