use arboard::Clipboard;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time::sleep;
use crate::models::{ClipboardItem, ClipboardItemType};
use crate::db::Database;

pub struct ClipboardMonitor {
    clipboard: Arc<Mutex<Clipboard>>,
    db: Arc<Mutex<Database>>,
    last_content: Arc<Mutex<Option<String>>>,
}

impl ClipboardMonitor {
    pub fn new(db: Arc<Mutex<Database>>) -> Result<Self, Box<dyn std::error::Error>> {
        let clipboard = Clipboard::new()?;
        Ok(Self {
            clipboard: Arc::new(Mutex::new(clipboard)),
            db,
            last_content: Arc::new(Mutex::new(None)),
        })
    }

    pub async fn start_monitoring(&self) {
        loop {
            if let Ok(current_content) = self.get_clipboard_content() {
                let should_save = {
                    let mut last_content = self.last_content.lock().unwrap();
                    if last_content.as_ref() != Some(&current_content) {
                        *last_content = Some(current_content.clone());
                        true
                    } else {
                        false
                    }
                };

                if should_save && !current_content.trim().is_empty() {
                    let item = ClipboardItem::new(current_content, ClipboardItemType::Text);
                    if let Ok(db) = self.db.lock() {
                        let _ = db.insert_item(&item);
                    }
                }
            }

            sleep(Duration::from_millis(500)).await;
        }
    }

    fn get_clipboard_content(&self) -> Result<String, Box<dyn std::error::Error>> {
        let mut clipboard = self.clipboard.lock().unwrap();
        match clipboard.get_text() {
            Ok(text) => Ok(text),
            Err(e) => Err(Box::new(e)),
        }
    }

    pub fn copy_to_clipboard(&self, content: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut clipboard = self.clipboard.lock().unwrap();
        clipboard.set_text(content)?;
        
        // Update last content to avoid re-saving
        let mut last_content = self.last_content.lock().unwrap();
        *last_content = Some(content.to_string());
        
        Ok(())
    }
}