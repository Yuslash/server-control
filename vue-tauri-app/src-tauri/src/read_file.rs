use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn read_file() -> String {
    let path = PathBuf::from("D:/Project Control panel/server-logs/server-log.json");

    fs::read_to_string(path).unwrap()
}
