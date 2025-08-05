use crate::models::{ClipboardItem, ClipboardItemType};
use chrono::{DateTime, Utc};
use rusqlite::{Connection, Result};
use std::path::Path;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self> {
        let conn = Connection::open(path)?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS clipboard_items (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                item_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                application_source TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                tag TEXT NOT NULL,
                FOREIGN KEY (item_id) REFERENCES clipboard_items(id) ON DELETE CASCADE,
                UNIQUE(item_id, tag)
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_clipboard_timestamp ON clipboard_items(timestamp)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_clipboard_pinned ON clipboard_items(is_pinned)",
            [],
        )?;

        Ok(())
    }

    pub fn insert_item(&self, item: &ClipboardItem) -> Result<()> {
        let tx = self.conn.unchecked_transaction()?;

        tx.execute(
            "INSERT INTO clipboard_items (id, content, item_type, timestamp, is_pinned, application_source)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            (
                &item.id,
                &item.content,
                match item.item_type {
                    ClipboardItemType::Text => "text",
                    ClipboardItemType::Image => "image",
                    ClipboardItemType::File => "file",
                },
                item.timestamp.to_rfc3339(),
                item.is_pinned,
                &item.application_source,
            ),
        )?;

        for tag in &item.tags {
            tx.execute(
                "INSERT INTO tags (item_id, tag) VALUES (?1, ?2)",
                (&item.id, tag),
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    pub fn get_all_items(&self) -> Result<Vec<ClipboardItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, content, item_type, timestamp, is_pinned, application_source 
             FROM clipboard_items 
             ORDER BY is_pinned DESC, timestamp DESC",
        )?;

        let items = stmt
            .query_map([], |row| {
                let id: String = row.get(0)?;
                let content: String = row.get(1)?;
                let item_type_str: String = row.get(2)?;
                let timestamp_str: String = row.get(3)?;
                let is_pinned: bool = row.get(4)?;
                let application_source: Option<String> = row.get(5)?;

                let item_type = match item_type_str.as_str() {
                    "image" => ClipboardItemType::Image,
                    "file" => ClipboardItemType::File,
                    _ => ClipboardItemType::Text,
                };

                let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
                    .unwrap()
                    .with_timezone(&Utc);

                let tags = self.get_tags_for_item(&id).unwrap_or_default();

                Ok(ClipboardItem {
                    id,
                    content,
                    item_type,
                    timestamp,
                    is_pinned,
                    tags,
                    application_source,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(items)
    }

    fn get_tags_for_item(&self, item_id: &str) -> Result<Vec<String>> {
        let mut stmt = self
            .conn
            .prepare("SELECT tag FROM tags WHERE item_id = ?1")?;
        let tags = stmt
            .query_map([item_id], |row| row.get(0))?
            .collect::<Result<Vec<String>>>()?;
        Ok(tags)
    }

    pub fn delete_item(&self, id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM clipboard_items WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn update_pin_status(&self, id: &str, is_pinned: bool) -> Result<()> {
        self.conn.execute(
            "UPDATE clipboard_items SET is_pinned = ?1 WHERE id = ?2",
            (is_pinned, id),
        )?;
        Ok(())
    }

    pub fn add_tag(&self, item_id: &str, tag: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO tags (item_id, tag) VALUES (?1, ?2)",
            (item_id, tag),
        )?;
        Ok(())
    }

    pub fn remove_tag(&self, item_id: &str, tag: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM tags WHERE item_id = ?1 AND tag = ?2",
            (item_id, tag),
        )?;
        Ok(())
    }

    pub fn clear_all(&self) -> Result<()> {
        self.conn.execute("DELETE FROM clipboard_items", [])?;
        Ok(())
    }
}
