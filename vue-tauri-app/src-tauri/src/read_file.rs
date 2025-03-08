use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn read_file(file_path: String) -> String {
    fs::read_to_string(PathBuf::from("../server-logs/server-logs.json")).unwrap()
}