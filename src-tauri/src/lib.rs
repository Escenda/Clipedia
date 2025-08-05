mod clipboard;
mod db;
mod models;
mod windows;

use clipboard::ClipboardMonitor;
use db::Database;
use models::ClipboardItem;
use std::sync::{Arc, Mutex};
use tauri::{Manager, State};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

struct AppState {
    db: Arc<Mutex<Database>>,
    monitor: Arc<ClipboardMonitor>,
}

#[tauri::command]
async fn get_clipboard_history(state: State<'_, AppState>) -> Result<Vec<ClipboardItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_items().map_err(|e| e.to_string())
}

#[tauri::command]
async fn copy_to_clipboard(content: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .monitor
        .copy_to_clipboard(&content)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn pin_item(id: String, is_pinned: bool, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_pin_status(&id, is_pinned)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_item(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_item(&id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_all_items(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.clear_all().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_tag(item_id: String, tag: String, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.add_tag(&item_id, &tag).map_err(|e| e.to_string())
}

#[tauri::command]
async fn remove_tag(
    item_id: String,
    tag: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.remove_tag(&item_id, &tag).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle();
            let app_dir = app_handle.path().app_data_dir().unwrap();
            std::fs::create_dir_all(&app_dir).unwrap();

            let db_path = app_dir.join("clipedia.db");
            let db = Arc::new(Mutex::new(Database::new(&db_path).unwrap()));

            let monitor = Arc::new(ClipboardMonitor::new(db.clone()).unwrap());
            let monitor_clone = monitor.clone();

            // Start clipboard monitoring in background
            tauri::async_runtime::spawn(async move {
                monitor_clone.start_monitoring().await;
            });

            app.manage(AppState { db, monitor });

            // グローバルホットキーの登録
            let app_handle_clone = app_handle.clone();
            app.global_shortcut()
                .on_shortcut("Alt+Z", move |_app_handle, _shortcut, _event| {
                    let _ = show_popup_window(&app_handle_clone);
                })
                .unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_clipboard_history,
            copy_to_clipboard,
            pin_item,
            delete_item,
            delete_all_items,
            add_tag,
            remove_tag
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn show_popup_window(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    println!("show_popup_window called from global shortcut");
    match windows::popup::create_popup_window(app) {
        Ok(_) => {
            println!("Popup window created successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to create popup window: {}", e);
            Err(e)
        }
    }
}
