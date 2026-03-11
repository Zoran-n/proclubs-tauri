mod commands;
mod ea_client;
mod models;
mod storage;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to resolve app data dir");
            let storage = storage::StorageManager::new(app_data_dir.clone());
            let settings = storage.load_settings();
            app.manage(ea_client::EaClient::new(app.handle().clone(), settings.proxy_url));
            app.manage(storage::StorageManager::new(app_data_dir));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            search_club,
            load_club,
            get_matches,
            get_members,
            get_logo,
            save_settings,
            load_settings,
            poll_session,
            detect_platform,
            get_club_info,
            check_proxy,
            set_proxy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
