use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardItem {
    pub id: String,
    pub content: String,
    #[serde(rename = "type")]
    pub item_type: ClipboardItemType,
    pub timestamp: DateTime<Utc>,
    pub is_pinned: bool,
    pub tags: Vec<String>,
    pub application_source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ClipboardItemType {
    Text,
    Image,
    File,
}

impl ClipboardItem {
    pub fn new(content: String, item_type: ClipboardItemType) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            content,
            item_type,
            timestamp: Utc::now(),
            is_pinned: false,
            tags: Vec::new(),
            application_source: None,
        }
    }
}