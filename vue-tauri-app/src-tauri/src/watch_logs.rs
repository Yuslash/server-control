// src/watch_logs.rs
use notify::{Watcher, RecursiveMode, RecommendedWatcher, Config, Event};
use std::{sync::mpsc::channel, fs, path::PathBuf};
use tauri::{AppHandle, Emitter}; // ✅ Add the Emitter trait

pub fn watch_file(app: AppHandle) {
    let path = PathBuf::from("D:/Project Control panel/server-logs/server-log.json");

    let (tx, rx) = channel();
    let mut watcher = RecommendedWatcher::new(tx, Config::default()).unwrap();
    
    watcher.watch(&path, RecursiveMode::NonRecursive).unwrap();

    std::thread::spawn(move || {
        for event in rx {
            if let Ok(Event { .. }) = event {
                if let Ok(content) = fs::read_to_string(&path) {
                    let _ = app.emit("log_updated", content); // ✅ Now works
                }
            }
        }
    });
}