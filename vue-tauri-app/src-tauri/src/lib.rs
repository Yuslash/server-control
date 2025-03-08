mod greet;
mod read_file;
mod watch_logs;

// Removed unused Manager import
use tauri::AppHandle;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet::greet, read_file::read_file])
        .setup(|app| {
            let app_handle = app.handle().clone();
            watch_logs::watch_file(app_handle);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}