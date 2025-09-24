use std::collections::HashMap;
use std::fs;
use serde::{Deserialize, Serialize};
use crate::models::{Group, Image, TagSuggestion, ApprovedTag, TagUpvote, AnnotationsExport};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppData {
    pub groups: HashMap<String, Group>,
    pub images: HashMap<String, Image>,
    pub tag_suggestions: HashMap<String, TagSuggestion>,
    pub approved_tags: HashMap<String, ApprovedTag>,
    pub tag_upvotes: HashMap<String, TagUpvote>,
}

impl Default for AppData {
    fn default() -> Self {
        Self {
            groups: HashMap::new(),
            images: HashMap::new(),
            tag_suggestions: HashMap::new(),
            approved_tags: HashMap::new(),
            tag_upvotes: HashMap::new(),
        }
    }
}

pub struct DataService {
    pub groups: HashMap<String, Group>,
    pub images: HashMap<String, Image>,
    pub tag_suggestions: HashMap<String, TagSuggestion>,
    pub approved_tags: HashMap<String, ApprovedTag>,
    pub tag_upvotes: HashMap<String, TagUpvote>,
}

impl DataService {
    pub fn new() -> Self {
        Self {
            groups: HashMap::new(),
            images: HashMap::new(),
            tag_suggestions: HashMap::new(),
            approved_tags: HashMap::new(),
            tag_upvotes: HashMap::new(),
        }
    }

    pub fn load_from_json(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if !fs::metadata("data.json").is_ok() {
            println!("No data.json found, using empty data");
            return Ok(());
        }

        println!("Loading data from data.json...");
        let json_data = fs::read_to_string("data.json")?;
        let app_data: AppData = serde_json::from_str(&json_data)?;
        
        self.groups = app_data.groups;
        self.images = app_data.images;
        self.tag_suggestions = app_data.tag_suggestions;
        self.approved_tags = app_data.approved_tags;
        self.tag_upvotes = app_data.tag_upvotes;
        
        println!("Data loaded successfully!");
        Ok(())
    }

    pub fn save_to_json(&self) -> Result<(), Box<dyn std::error::Error>> {
        let app_data = AppData {
            groups: self.groups.clone(),
            images: self.images.clone(),
            tag_suggestions: self.tag_suggestions.clone(),
            approved_tags: self.approved_tags.clone(),
            tag_upvotes: self.tag_upvotes.clone(),
        };
        
        let json_data = serde_json::to_string_pretty(&app_data)?;
        fs::write("data.json", json_data)?;
        
        println!("Data saved to data.json");
        Ok(())
    }

    // Métodos para gerenciar grupos
    pub fn create_group(&mut self, group: Group) -> String {
        let id = group.id.clone();
        self.groups.insert(id.clone(), group);
        let _ = self.save_to_json();
        id
    }

    pub fn get_group(&self, id: &str) -> Option<&Group> {
        self.groups.get(id)
    }

    pub fn get_group_mut(&mut self, id: &str) -> Option<&mut Group> {
        self.groups.get_mut(id)
    }

    pub fn get_all_groups(&self) -> Vec<&Group> {
        self.groups.values().collect()
    }

    pub fn delete_group(&mut self, id: &str) -> bool {
        if self.groups.remove(id).is_some() {
            // Remove related images
            self.images.retain(|_, image| image.group_id != id);
            let _ = self.save_to_json();
            true
        } else {
            false
        }
    }

    // Métodos para gerenciar imagens
    pub fn create_image(&mut self, image: Image) -> String {
        let id = image.id.clone();
        self.images.insert(id.clone(), image);
        let _ = self.save_to_json();
        id
    }

    pub fn get_image(&self, id: &str) -> Option<&Image> {
        self.images.get(id)
    }

    pub fn get_user_images(&self, username: &str) -> Vec<&Image> {
        // Get groups where user is a member
        let user_groups: Vec<String> = self.groups.values()
            .filter(|group| group.members.contains(&username.to_string()))
            .map(|group| group.id.clone())
            .collect();
        
        // Get images from user's groups
        self.images.values()
            .filter(|image| user_groups.contains(&image.group_id))
            .collect()
    }

    pub fn delete_image(&mut self, id: &str) -> bool {
        if let Some(_image) = self.images.remove(id) {
            // Remove related tag suggestions and approved tags
            self.tag_suggestions.retain(|_, suggestion| suggestion.image_id != id);
            self.approved_tags.retain(|_, tag| tag.image_id != id);
            let _ = self.save_to_json();
            true
        } else {
            false
        }
    }

    pub fn export_annotations(&self) -> serde_json::Value {
        serde_json::to_value(AnnotationsExport {
            groups: &self.groups,
            images: &self.images,
            tag_suggestions: &self.tag_suggestions,
            approved_tags: &self.approved_tags,
            tag_upvotes: &self.tag_upvotes,
        }).unwrap_or_else(|_| serde_json::json!({ "error": "Failed to export annotations" }))
    }
}
