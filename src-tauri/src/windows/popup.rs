use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{
    AppHandle, Manager, Runtime, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};

pub fn create_popup_window<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<WebviewWindow<R>, Box<dyn std::error::Error>> {
    // 既存のポップアップウィンドウがあれば閉じる
    if let Some(window) = app.get_webview_window("popup") {
        println!("Found existing popup window, closing it");
        let _ = window.close();
        std::thread::sleep(std::time::Duration::from_millis(100));
    }

    println!("Creating new popup window");

    // ポップアップウィンドウを作成
    let window = WebviewWindowBuilder::new(app, "popup", WebviewUrl::App("popup.html".into()))
        .title("Clipedia Quick Access")
        .inner_size(400.0, 500.0)
        .center() // 画面の中央に配置
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .build()?;

    println!("Popup window created");

    // 初回フォーカスを追跡するフラグ
    let initial_focus_done = Arc::new(AtomicBool::new(false));

    // ウィンドウイベントを監視
    let window_clone = window.clone();
    let initial_focus_done_clone = initial_focus_done.clone();
    window.on_window_event(move |event| {
        match event {
            WindowEvent::CloseRequested { .. } => {
                println!("Popup window close requested");
            }
            WindowEvent::Destroyed => {
                println!("Popup window destroyed");
            }
            WindowEvent::Focused(focused) => {
                println!("Popup window focus changed: {focused}");

                // 初回フォーカス完了後、フォーカスを失ったら閉じる
                if initial_focus_done_clone.load(Ordering::Relaxed) && !*focused {
                    println!("Popup window lost focus, closing");
                    let _ = window_clone.close();
                } else if *focused && !initial_focus_done_clone.load(Ordering::Relaxed) {
                    // 初回フォーカス時にフラグを設定
                    initial_focus_done_clone.store(true, Ordering::Relaxed);
                    println!("Initial focus completed");
                }
            }
            _ => {}
        }
    });

    // ウィンドウを表示
    window.show()?;
    println!("Popup window shown");

    // フォーカスを設定
    window.set_focus()?;
    println!("Popup window focused");

    Ok(window)
}
