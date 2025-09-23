use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Image {
    pub id: String,
    pub filename: String,
    pub original_name: String,
    pub group_id: String,
    pub uploaded_at: String,
    pub uploaded_by: String,
}

impl Image {
    pub fn new(
        filename: String,
        original_name: String,
        group_id: String,
        uploaded_by: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            filename,
            original_name,
            group_id,
            uploaded_at: Utc::now().to_rfc3339(),
            uploaded_by,
        }
    }
}
