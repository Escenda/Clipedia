mod clipboard;
mod content_analyzer;
mod db;
mod models;
mod tray;
mod windows;

use clipboard::ClipboardMonitor;
use db::Database;
use models::ClipboardItem;
use std::sync::{Arc, Mutex};
use tauri::{Manager, State, WindowEvent};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub monitor: Arc<ClipboardMonitor>,
}

#[tauri::command]
async fn get_clipboard_history(state: State<'_, AppState>) -> Result<Vec<ClipboardItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_items().map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_recent_items(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<ClipboardItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let items = db.get_all_items().map_err(|e| e.to_string())?;

    // 最近の5件を取得
    let recent_items: Vec<ClipboardItem> = items.into_iter().take(5).collect();

    // トレイメニューを更新
    let items_for_tray: Vec<(String, String)> = recent_items
        .iter()
        .map(|item| (item.id.clone(), item.content.clone()))
        .collect();

    let _ = tray::update_recent_items_menu(&app_handle, items_for_tray);

    Ok(recent_items)
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
async fn get_items_paginated(
    offset: i64,
    limit: i64,
    state: State<'_, AppState>,
) -> Result<Vec<types::ClipboardItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_items_paginated(offset, limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_total_count(state: State<'_, AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_total_count().map_err(|e| e.to_string())
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

#[tauri::command]
async fn get_all_tags(
    state: State<'_, AppState>,
) -> Result<Vec<(String, Option<String>, bool)>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_tags().map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_custom_tag(
    state: State<'_, AppState>,
    name: String,
    color: Option<String>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_custom_tag(&name, color.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_tag_color(
    state: State<'_, AppState>,
    name: String,
    color: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_tag_color(&name, &color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_custom_tag(state: State<'_, AppState>, name: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_custom_tag(&name).map_err(|e| e.to_string())
}

#[tauri::command]
async fn search_items(
    state: State<'_, AppState>,
    pattern: String,
    use_regex: bool,
) -> Result<Vec<ClipboardItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.search_items(&pattern, use_regex)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_items_by_tag(
    state: State<'_, AppState>,
    tag: String,
) -> Result<Vec<ClipboardItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_items_by_tag(&tag).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_tray_menu(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let items = db.get_all_items().map_err(|e| e.to_string())?;

    // 最近の5件を取得してトレイメニューを更新
    let items_for_tray: Vec<(String, String)> = items
        .into_iter()
        .take(5)
        .map(|item| (item.id, item.content))
        .collect();

    tray::update_recent_items_menu(&app_handle, items_for_tray).map_err(|e| e.to_string())
}

#[tauri::command]
async fn toggle_monitoring(state: State<'_, AppState>) -> Result<bool, String> {
    let is_enabled = state.monitor.toggle_monitoring();
    Ok(is_enabled)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // .plugin(tauri_plugin_dialog::init()) // Temporarily disabled
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

            // システムトレイの作成
            tray::create_tray(app_handle)?;

            // メインウィンドウのイベントハンドリング
            let main_window = app.get_webview_window("main").unwrap();
            let app_handle_clone = app_handle.clone();
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // 閉じるボタンでトレイに最小化（設定により変更可能）
                    api.prevent_close();
                    if let Some(window) = app_handle_clone.get_webview_window("main") {
                        let _ = tray::minimize_to_tray(&window);
                    }
                }
            });

            // 初回起動時はメインウィンドウを表示
            // TODO: 設定から起動時の動作を制御できるようにする
            let _ = main_window.show();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_clipboard_history,
            get_recent_items,
            copy_to_clipboard,
            pin_item,
            delete_item,
            delete_all_items,
            add_tag,
            get_items_paginated,
            get_total_count,
            remove_tag,
            update_tray_menu,
            get_all_tags,
            create_custom_tag,
            update_tag_color,
            delete_custom_tag,
            search_items,
            get_items_by_tag,
            toggle_monitoring
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn show_popup_window<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("show_popup_window called from global shortcut");
    match windows::popup::create_popup_window(app) {
        Ok(_) => {
            println!("Popup window created successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to create popup window: {e}");
            Err(e)
        }
    }
}
