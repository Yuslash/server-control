#[tauri::command]

pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from sibikrishna howa re you mate", name)
}