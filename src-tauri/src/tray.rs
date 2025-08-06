use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    // トレイメニューの作成
    let menu = create_tray_menu(app)?;

    // トレイアイコンの作成
    let _tray = TrayIconBuilder::with_id("main")
        .tooltip("Clipedia - クリップボード管理")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            // メニューイベントを別スレッドで処理（Windowsの問題を回避）
            let app_handle = app.clone();
            let event_id = event.id().to_string();
            tauri::async_runtime::spawn(async move {
                handle_menu_event(&app_handle, event_id);
            });
        })
        .on_tray_icon_event(|tray, event| {
            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    // 左クリックでメインウィンドウを表示
                    if let Some(window) = tray.app_handle().get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
                TrayIconEvent::Click {
                    button: MouseButton::Right,
                    ..
                } => {
                    // 右クリックは自動的にメニューを表示（Tauriが処理）
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

pub fn create_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    create_tray_menu_with_items(app, &[])
}

fn create_tray_menu_with_items<R: Runtime>(
    app: &tauri::AppHandle<R>,
    recent_items: &[(String, String)],
) -> tauri::Result<Menu<R>> {
    let menu = Menu::new(app)?;

    // クイックアクセス
    let quick_access =
        MenuItem::with_id(app, "quick_access", "クイックアクセス", true, Some("Alt+Z"))?;
    menu.append(&quick_access)?;

    // メインウィンドウを開く
    let show_window = MenuItem::with_id(
        app,
        "show_window",
        "メインウィンドウを開く",
        true,
        None::<&str>,
    )?;
    menu.append(&show_window)?;

    // 設定
    let settings = MenuItem::with_id(app, "settings", "設定", true, None::<&str>)?;
    menu.append(&settings)?;

    // セパレーター
    menu.append(&PredefinedMenuItem::separator(app)?)?;

    // 最近のアイテム

    if recent_items.is_empty() {
        let empty_item =
            MenuItem::with_id(app, "no_items", "(履歴がありません)", false, None::<&str>)?;
        menu.append(&PredefinedMenuItem::separator(app)?)?;
        menu.append(&empty_item)?;
    } else {
        menu.append(&PredefinedMenuItem::separator(app)?)?;

        // 最近のアイテムのラベルを追加
        let recent_label =
            MenuItem::with_id(app, "recent_label", "最近のアイテム:", false, None::<&str>)?;
        menu.append(&recent_label)?;

        for (id, content) in recent_items.iter().take(5) {
            let truncated = if content.len() > 50 {
                format!("{}...", &content[..50])
            } else {
                content.clone()
            };

            let item =
                MenuItem::with_id(app, format!("recent_{id}"), truncated, true, None::<&str>)?;
            menu.append(&item)?;
        }
    }

    // セパレーター
    menu.append(&PredefinedMenuItem::separator(app)?)?;

    // 監視の一時停止/再開
    let monitoring_label = if let Some(state) = app.try_state::<crate::AppState>() {
        if state.monitor.is_monitoring() {
            "監視を一時停止"
        } else {
            "監視を再開"
        }
    } else {
        "監視を一時停止"
    };

    let toggle_monitoring = MenuItem::with_id(
        app,
        "toggle_monitoring",
        monitoring_label,
        true,
        None::<&str>,
    )?;
    menu.append(&toggle_monitoring)?;

    // 終了
    let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
    menu.append(&quit)?;

    Ok(menu)
}

fn handle_menu_event<R: Runtime>(app: &tauri::AppHandle<R>, event_id: String) {
    match event_id.as_ref() {
        "quick_access" => {
            // ポップアップウィンドウを表示
            let _ = crate::windows::popup::create_popup_window(app);
        }
        "show_window" => {
            // メインウィンドウを表示
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "settings" => {
            // 設定画面を表示（メインウィンドウの設定タブを開く）
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                // 設定タブに切り替えるイベントを送信
                let _ = window.emit("switch-to-settings", ());
            }
        }
        "toggle_monitoring" => {
            // 監視の一時停止/再開
            if let Some(state) = app.try_state::<crate::AppState>() {
                let is_enabled = state.monitor.toggle_monitoring();
                // トレイメニューを再作成して更新
                if let Some(tray) = app.tray_by_id("main") {
                    // 最近のアイテムを取得
                    let items = if let Ok(db) = state.db.lock() {
                        if let Ok(all_items) = db.get_all_items() {
                            all_items
                                .into_iter()
                                .take(5)
                                .map(|item| (item.id, item.content))
                                .collect::<Vec<_>>()
                        } else {
                            vec![]
                        }
                    } else {
                        vec![]
                    };
                    
                    // 新しいメニューを作成して設定
                    if let Ok(new_menu) = create_tray_menu_with_items(app, &items) {
                        let _ = tray.set_menu(Some(new_menu));
                    }
                }
            }
        }
        "quit" => {
            // アプリケーションを終了
            app.exit(0);
        }
        id if id.starts_with("recent_") => {
            // 最近のアイテムがクリックされた
            if let Some(item_id) = id.strip_prefix("recent_") {
                // クリップボードにコピー
                if let Some(state) = app.try_state::<crate::AppState>() {
                    let db = state.db.lock().unwrap();
                    if let Ok(items) = db.get_all_items() {
                        if let Some(item) = items.iter().find(|i| i.id == item_id) {
                            let _ = state.monitor.copy_to_clipboard(&item.content);
                        }
                    }
                }
            }
        }
        _ => {
            println!("Menu item clicked: {:?}", event_id);
        }
    }
}

// 最近のアイテムメニューを更新する関数
pub fn update_recent_items_menu<R: Runtime>(
    app: &tauri::AppHandle<R>,
    items: Vec<(String, String)>, // (id, content)
) -> tauri::Result<()> {
    // トレイアイコンを取得
    if let Some(tray) = app.tray_by_id("main") {
        // 新しいメニューを作成
        let new_menu = create_tray_menu_with_items(app, &items)?;

        // メニューを更新
        tray.set_menu(Some(new_menu))?;
    }

    Ok(())
}

// ウィンドウをトレイに最小化する関数
pub fn minimize_to_tray<R: Runtime>(window: &tauri::WebviewWindow<R>) -> tauri::Result<()> {
    window.hide()?;
    Ok(())
}
