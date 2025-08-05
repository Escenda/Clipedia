use crate::models::{ClipboardItem, ClipboardItemType};
use chrono::{DateTime, Utc};
use rusqlite::{Connection, Result};
use std::path::Path;
use regex::Regex;

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

        // タグマスターテーブル（カスタムタグの管理用）
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tag_master (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                color TEXT,
                is_system INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // システムタグを初期化
        self.init_system_tags()?;

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

    fn init_system_tags(&self) -> Result<()> {
        let system_tags = [
            ("url", "#3B82F6"),      // blue
            ("code", "#10B981"),     // green
            ("json", "#F59E0B"),     // amber
            ("markdown", "#8B5CF6"), // violet
            ("email", "#EF4444"),    // red
            ("phone", "#EC4899"),    // pink
            ("path", "#6366F1"),     // indigo
        ];

        for (name, color) in system_tags {
            self.conn.execute(
                "INSERT OR IGNORE INTO tag_master (name, color, is_system) VALUES (?1, ?2, 1)",
                (name, color),
            )?;
        }
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

    // タグマスター管理用メソッド
    pub fn get_all_tags(&self) -> Result<Vec<(String, Option<String>, bool)>> {
        let mut stmt = self.conn.prepare(
            "SELECT name, color, is_system FROM tag_master ORDER BY name"
        )?;
        
        let tags = stmt
            .query_map([], |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get::<_, i32>(2)? == 1,
                ))
            })?
            .collect::<Result<Vec<_>>>()?;
        
        Ok(tags)
    }

    pub fn create_custom_tag(&self, name: &str, color: Option<&str>) -> Result<()> {
        self.conn.execute(
            "INSERT INTO tag_master (name, color, is_system) VALUES (?1, ?2, 0)",
            (name, color),
        )?;
        Ok(())
    }

    pub fn update_tag_color(&self, name: &str, color: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE tag_master SET color = ?1 WHERE name = ?2",
            (color, name),
        )?;
        Ok(())
    }

    pub fn delete_custom_tag(&self, name: &str) -> Result<()> {
        // システムタグは削除できない
        self.conn.execute(
            "DELETE FROM tag_master WHERE name = ?1 AND is_system = 0",
            [name],
        )?;
        Ok(())
    }

    // 正規表現検索
    pub fn search_items(&self, pattern: &str, use_regex: bool) -> Result<Vec<ClipboardItem>> {
        if use_regex {
            // 正規表現検索
            let regex = match Regex::new(pattern) {
                Ok(r) => r,
                Err(_) => return Ok(vec![]), // 無効な正規表現の場合は空の結果を返す
            };

            let all_items = self.get_all_items()?;
            let filtered_items: Vec<ClipboardItem> = all_items
                .into_iter()
                .filter(|item| regex.is_match(&item.content))
                .collect();

            Ok(filtered_items)
        } else {
            // 通常の検索（LIKE演算子）
            let mut stmt = self.conn.prepare(
                "SELECT id, content, item_type, timestamp, is_pinned, application_source 
                 FROM clipboard_items 
                 WHERE content LIKE ?1
                 ORDER BY is_pinned DESC, timestamp DESC"
            )?;
            
            let search_pattern = format!("%{}%", pattern);
            let items = stmt
                .query_map([search_pattern], |row| {
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

    // タグによるフィルタリング
    pub fn get_items_by_tag(&self, tag: &str) -> Result<Vec<ClipboardItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT DISTINCT c.id, c.content, c.item_type, c.timestamp, c.is_pinned, c.application_source 
             FROM clipboard_items c
             JOIN tags t ON c.id = t.item_id
             WHERE t.tag = ?1
             ORDER BY c.is_pinned DESC, c.timestamp DESC"
        )?;

        let items = stmt
            .query_map([tag], |row| {
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
}
