use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub created_by: String,
    pub members: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateGroupRequest {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct AddUserToGroupRequest {
    pub group_id: String,
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct RemoveUserFromGroupRequest {
    pub group_id: String,
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGroupRequest {
    pub group_id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct DeleteGroupRequest {
    pub group_id: String,
}

impl Group {
    pub fn new(name: String, description: String, created_by: String) -> Self {
        let created_by_clone = created_by.clone();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            created_at: Utc::now().to_rfc3339(),
            created_by,
            members: vec![created_by_clone],
        }
    }

    pub fn add_member(&mut self, username: String) {
        if !self.members.contains(&username) {
            self.members.push(username);
        }
    }

    pub fn remove_member(&mut self, username: &str) {
        self.members.retain(|member| member != username);
    }
}
