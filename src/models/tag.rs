use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagSuggestion {
    pub id: String,
    pub image_id: String,
    pub tag: String,
    pub suggested_by: String,
    pub suggested_at: String,
    pub status: String, // "pending", "approved", "rejected"
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApprovedTag {
    pub id: String,
    pub image_id: String,
    pub tag: String,
    pub approved_by: String,
    pub approved_at: String,
    pub upvotes: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagUpvote {
    pub id: String,
    pub tag_id: String,
    pub user_id: String,
    pub upvoted_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SuggestTagRequest {
    pub image_id: String,
    pub tag: String,
    pub suggested_by: String,
}

#[derive(Debug, Deserialize)]
pub struct ReviewTagRequest {
    pub suggestion_id: String,
    pub status: String, // "approved" or "rejected"
    pub reviewed_by: String,
}

#[derive(Debug, Deserialize)]
pub struct UpvoteTagRequest {
    pub tag_id: String,
    pub user_id: String,
}

impl TagSuggestion {
    pub fn new(image_id: String, tag: String, suggested_by: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            image_id,
            tag,
            suggested_by,
            suggested_at: Utc::now().to_rfc3339(),
            status: "pending".to_string(),
            reviewed_by: None,
            reviewed_at: None,
        }
    }
}

impl ApprovedTag {
    pub fn new(
        image_id: String,
        tag: String,
        approved_by: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            image_id,
            tag,
            approved_by,
            approved_at: Utc::now().to_rfc3339(),
            upvotes: 0,
        }
    }
}

impl TagUpvote {
    pub fn new(tag_id: String, user_id: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            tag_id,
            user_id,
            upvoted_at: Utc::now().to_rfc3339(),
        }
    }
}
