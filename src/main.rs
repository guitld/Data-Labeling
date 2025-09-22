use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger, Error};
use actix_multipart::Multipart;
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use uuid::Uuid;
use chrono::Utc;
use futures_util::TryStreamExt as _;

#[derive(Debug, Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct LoginResponse {
    success: bool,
    role: String,
    message: String,
}

#[derive(Debug, Serialize)]
struct UserInfo {
    username: String,
    role: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Image {
    id: String,
    filename: String,
    original_name: String,
    group_id: String,
    uploaded_at: String,
    uploaded_by: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Group {
    id: String,
    name: String,
    description: String,
    created_at: String,
    created_by: String,
    members: Vec<String>, // Lista de usernames
}

#[derive(Debug, Deserialize)]
struct CreateGroupRequest {
    name: String,
    description: String,
}

#[derive(Debug, Deserialize)]
struct AddUserToGroupRequest {
    group_id: String,
    username: String,
}

#[derive(Debug, Deserialize)]
struct RemoveUserFromGroupRequest {
    group_id: String,
    username: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TagSuggestion {
    id: String,
    image_id: String,
    tag: String,
    suggested_by: String,
    suggested_at: String,
    status: String, // "pending", "approved", "rejected"
    reviewed_by: Option<String>,
    reviewed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ApprovedTag {
    id: String,
    image_id: String,
    tag: String,
    approved_by: String,
    approved_at: String,
    upvotes: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TagUpvote {
    id: String,
    tag_id: String,
    user_id: String,
    upvoted_at: String,
}

#[derive(Debug, Deserialize)]
struct SuggestTagRequest {
    image_id: String,
    tag: String,
    suggested_by: String,
}

#[derive(Debug, Deserialize)]
struct ReviewTagRequest {
    suggestion_id: String,
    status: String, // "approved" or "rejected"
    reviewed_by: String,
}

#[derive(Debug, Deserialize)]
struct UpvoteTagRequest {
    tag_id: String,
    user_id: String,
}

// Simple in-memory user database
fn get_users() -> HashMap<String, (String, String)> {
    let mut users = HashMap::new();
    users.insert("admin".to_string(), ("admin123".to_string(), "admin".to_string()));
    users.insert("user".to_string(), ("user123".to_string(), "user".to_string()));
    users.insert("alice".to_string(), ("alice123".to_string(), "user".to_string()));
    users.insert("bob".to_string(), ("bob123".to_string(), "user".to_string()));
    users.insert("charlie".to_string(), ("charlie123".to_string(), "user".to_string()));
    users.insert("diana".to_string(), ("diana123".to_string(), "user".to_string()));
    users
}

// In-memory storage for groups, images, and tags
lazy_static::lazy_static! {
    static ref GROUPS: std::sync::Mutex<HashMap<String, Group>> = std::sync::Mutex::new(HashMap::new());
    static ref IMAGES: std::sync::Mutex<HashMap<String, Image>> = std::sync::Mutex::new(HashMap::new());
    static ref TAG_SUGGESTIONS: std::sync::Mutex<HashMap<String, TagSuggestion>> = std::sync::Mutex::new(HashMap::new());
    static ref APPROVED_TAGS: std::sync::Mutex<HashMap<String, ApprovedTag>> = std::sync::Mutex::new(HashMap::new());
    static ref TAG_UPVOTES: std::sync::Mutex<HashMap<String, TagUpvote>> = std::sync::Mutex::new(HashMap::new());
}

// Initialize uploads directory
fn init_uploads_dir() -> std::io::Result<()> {
    fs::create_dir_all("uploads")?;
    Ok(())
}

// Data structures for JSON persistence
#[derive(Debug, Serialize, Deserialize)]
struct AppData {
    groups: HashMap<String, Group>,
    images: HashMap<String, Image>,
    tag_suggestions: HashMap<String, TagSuggestion>,
    approved_tags: HashMap<String, ApprovedTag>,
    tag_upvotes: HashMap<String, TagUpvote>,
}

// Save all data to JSON files
fn save_data_to_json() -> std::io::Result<()> {
    let groups = GROUPS.lock().unwrap();
    let images = IMAGES.lock().unwrap();
    let tag_suggestions = TAG_SUGGESTIONS.lock().unwrap();
    let approved_tags = APPROVED_TAGS.lock().unwrap();
    let tag_upvotes = TAG_UPVOTES.lock().unwrap();
    
    let app_data = AppData {
        groups: groups.clone(),
        images: images.clone(),
        tag_suggestions: tag_suggestions.clone(),
        approved_tags: approved_tags.clone(),
        tag_upvotes: tag_upvotes.clone(),
    };
    
    drop(groups);
    drop(images);
    drop(tag_suggestions);
    drop(approved_tags);
    drop(tag_upvotes);
    
    let json_data = serde_json::to_string_pretty(&app_data)?;
    fs::write("data.json", json_data)?;
    
    println!("Data saved to data.json");
    Ok(())
}

// Load all data from JSON files
fn load_data_from_json() -> std::io::Result<()> {
    if !fs::metadata("data.json").is_ok() {
        println!("No data.json found, using mock data");
        return Ok(());
    }
    
    let json_data = fs::read_to_string("data.json")?;
    let app_data: AppData = serde_json::from_str(&json_data)?;
    
    let mut groups = GROUPS.lock().unwrap();
    let mut images = IMAGES.lock().unwrap();
    let mut tag_suggestions = TAG_SUGGESTIONS.lock().unwrap();
    let mut approved_tags = APPROVED_TAGS.lock().unwrap();
    let mut tag_upvotes = TAG_UPVOTES.lock().unwrap();
    
    *groups = app_data.groups;
    *images = app_data.images;
    *tag_suggestions = app_data.tag_suggestions;
    *approved_tags = app_data.approved_tags;
    *tag_upvotes = app_data.tag_upvotes;
    
    drop(groups);
    drop(images);
    drop(tag_suggestions);
    drop(approved_tags);
    drop(tag_upvotes);
    
    println!("Data loaded from data.json");
    Ok(())
}


async fn login(login_req: web::Json<LoginRequest>) -> Result<HttpResponse> {
    let users = get_users();
    
    if let Some((password, role)) = users.get(&login_req.username) {
        if password == &login_req.password {
            let response = serde_json::json!({
                "success": true,
                "username": login_req.username,
                "role": role.clone(),
                "message": "Login successful"
            });
            return Ok(HttpResponse::Ok().json(response));
        }
    }
    
    Ok(HttpResponse::Unauthorized().json(serde_json::json!({
        "success": false,
        "error": "Invalid credentials"
    })))
}

async fn protected_route() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "This is protected data accessible to all authenticated users"
    })))
}

async fn admin_only_route() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Welcome to admin panel",
        "admin_data": "Sensitive admin information - only admins can see this"
    })))
}

// Get all available users
async fn get_users_endpoint() -> Result<HttpResponse> {
    let users = get_users();
    let usernames: Vec<String> = users.keys().cloned().collect();
    
    Ok(HttpResponse::Ok().json(usernames))
}

// Upload image endpoint
async fn upload_image(mut payload: Multipart) -> Result<HttpResponse, Error> {
    let mut group_id = String::new();
    let mut uploaded_by = String::new();
    let mut image_data = Vec::new();
    let mut original_filename = String::new();

    while let Some(item) = payload.try_next().await? {
        match item.name() {
            "group_id" => {
                let mut bytes = Vec::new();
                let mut field = item;
                while let Some(chunk) = field.try_next().await? {
                    bytes.extend_from_slice(&chunk);
                }
                group_id = String::from_utf8_lossy(&bytes).to_string();
            }
            "uploaded_by" => {
                let mut bytes = Vec::new();
                let mut field = item;
                while let Some(chunk) = field.try_next().await? {
                    bytes.extend_from_slice(&chunk);
                }
                uploaded_by = String::from_utf8_lossy(&bytes).to_string();
            }
            "image" => {
                let mut field = item;
                original_filename = field.content_disposition().get_filename().unwrap_or("unknown").to_string();
                while let Some(chunk) = field.try_next().await? {
                    image_data.extend_from_slice(&chunk);
                }
            }
            _ => {}
        }
    }

    println!("Upload request - group_id: '{}', uploaded_by: '{}', image_data_len: {}", 
             group_id, uploaded_by, image_data.len());
    
    if group_id.is_empty() || uploaded_by.is_empty() || image_data.is_empty() {
        println!("Missing required fields - group_id: {}, uploaded_by: {}, image_data: {}", 
                 group_id.is_empty(), uploaded_by.is_empty(), image_data.is_empty());
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Missing required fields"
        })));
    }

    // Check if group exists
    let groups = GROUPS.lock().unwrap();
    if !groups.contains_key(&group_id) {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })));
    }
    drop(groups);

    // Generate unique filename
    let image_id = Uuid::new_v4().to_string();
    let file_extension = original_filename.split('.').last().unwrap_or("jpg");
    let filename = format!("{}.{}", image_id, file_extension);
    let file_path = format!("uploads/{}", filename);

    // Save file
    let mut file = fs::File::create(&file_path)?;
    file.write_all(&image_data)?;

    // Create image record
    let image = Image {
        id: image_id.clone(),
        filename: filename.clone(),
        original_name: original_filename,
        group_id: group_id.clone(),
        uploaded_at: Utc::now().to_rfc3339(),
        uploaded_by,
    };

    // Store image
    let mut images = IMAGES.lock().unwrap();
    images.insert(image_id.clone(), image.clone());
    drop(images);

    // Save data to JSON
    let _ = save_data_to_json();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "image_id": image_id,
        "filename": filename,
        "message": "Image uploaded successfully"
    })))
}

// Create group endpoint
async fn create_group(req: web::Json<CreateGroupRequest>) -> Result<HttpResponse> {
    let group_id = Uuid::new_v4().to_string();
    let group = Group {
        id: group_id.clone(),
        name: req.name.clone(),
        description: req.description.clone(),
        created_at: Utc::now().to_rfc3339(),
        created_by: "admin".to_string(), // In real app, get from session
        members: vec!["admin".to_string()], // Admin is always a member
    };

    let mut groups = GROUPS.lock().unwrap();
    groups.insert(group_id.clone(), group.clone());
    drop(groups);

    // Save data to JSON
    let _ = save_data_to_json();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "group_id": group_id,
        "message": "Group created successfully"
    })))
}

// List groups endpoint
async fn list_groups() -> Result<HttpResponse> {
    let groups = GROUPS.lock().unwrap();
    let groups_list: Vec<Group> = groups.values().cloned().collect();
    drop(groups);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "groups": groups_list
    })))
}

// Add user to group endpoint
async fn add_user_to_group(req: web::Json<AddUserToGroupRequest>) -> Result<HttpResponse> {
    let mut groups = GROUPS.lock().unwrap();
    
    if let Some(group) = groups.get_mut(&req.group_id) {
        if !group.members.contains(&req.username) {
            group.members.push(req.username.clone());
        }
        drop(groups);
        
        // Save data to JSON
        let _ = save_data_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "User added to group successfully"
        })))
    } else {
        drop(groups);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Group not found"
        })))
    }
}

// Remove user from group endpoint
async fn remove_user_from_group(req: web::Json<RemoveUserFromGroupRequest>) -> Result<HttpResponse> {
    println!("Remove user request - group_id: '{}', username: '{}'", req.group_id, req.username);
    
    let mut groups = GROUPS.lock().unwrap();
    
    if let Some(group) = groups.get_mut(&req.group_id) {
        println!("Group found, current members: {:?}", group.members);
        group.members.retain(|member| member != &req.username);
        println!("Members after removal: {:?}", group.members);
        drop(groups);
        
        // Save data to JSON
        let _ = save_data_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "User removed from group successfully"
        })))
    } else {
        println!("Group not found: {}", req.group_id);
        drop(groups);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Group not found"
        })))
    }
}

#[derive(Debug, Deserialize)]
struct UpdateGroupRequest {
    group_id: String,
    name: String,
    description: String,
}

#[derive(Debug, Deserialize)]
struct DeleteGroupRequest {
    group_id: String,
}

// Update group endpoint
async fn update_group(req: web::Json<UpdateGroupRequest>) -> Result<HttpResponse> {
    let mut groups = GROUPS.lock().unwrap();
    
    if let Some(group) = groups.get_mut(&req.group_id) {
        group.name = req.name.clone();
        group.description = req.description.clone();
        drop(groups);
        
        // Save data to JSON
        let _ = save_data_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Group updated successfully"
        })))
    } else {
        drop(groups);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Group not found"
        })))
    }
}

// Delete group endpoint
async fn delete_group(req: web::Json<DeleteGroupRequest>) -> Result<HttpResponse> {
    let mut groups = GROUPS.lock().unwrap();
    let mut images = IMAGES.lock().unwrap();
    
    if groups.contains_key(&req.group_id) {
        // Remove all images from this group
        images.retain(|_, image| image.group_id != req.group_id);
        
        // Remove the group
        groups.remove(&req.group_id);
        
        drop(groups);
        drop(images);
        
        // Save data to JSON
        let _ = save_data_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Group deleted successfully"
        })))
    } else {
        drop(groups);
        drop(images);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Group not found"
        })))
    }
}

// Delete image endpoint
async fn delete_image(image_id: web::Path<String>) -> Result<HttpResponse> {
    let image_id = image_id.into_inner();
    let mut images = IMAGES.lock().unwrap();
    let mut tag_suggestions = TAG_SUGGESTIONS.lock().unwrap();
    let mut approved_tags = APPROVED_TAGS.lock().unwrap();
    
    if let Some(image) = images.get(&image_id) {
        // Delete the image file from filesystem
        let file_path = format!("uploads/{}", image.filename);
        let _ = fs::remove_file(&file_path);
        
        // Remove image from memory
        images.remove(&image_id);
        
        // Remove related tag suggestions
        tag_suggestions.retain(|_, suggestion| suggestion.image_id != image_id);
        
        // Remove related approved tags
        approved_tags.retain(|_, tag| tag.image_id != image_id);
        
        drop(images);
        drop(tag_suggestions);
        drop(approved_tags);
        
        // Save data to JSON
        let _ = save_data_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Image deleted successfully"
        })))
    } else {
        drop(images);
        drop(tag_suggestions);
        drop(approved_tags);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Image not found"
        })))
    }
}

// Get images for user endpoint
async fn get_user_images(username: web::Path<String>) -> Result<HttpResponse> {
    let groups = GROUPS.lock().unwrap();
    let images = IMAGES.lock().unwrap();
    
    // Find groups where user is a member
    let user_groups: Vec<String> = groups.values()
        .filter(|group| group.members.contains(&username))
        .map(|group| group.id.clone())
        .collect();
    
    // Get images from user's groups
    let user_images: Vec<Image> = images.values()
        .filter(|image| user_groups.contains(&image.group_id))
        .cloned()
        .collect();
    
    drop(groups);
    drop(images);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "images": user_images
    })))
}

// Serve uploaded images
async fn serve_image(path: web::Path<String>) -> Result<HttpResponse> {
    let filename = path.into_inner();
    let file_path = format!("uploads/{}", filename);
    
    match fs::read(&file_path) {
        Ok(content) => {
            // Determine content type based on file extension
            let content_type = if filename.ends_with(".png") {
                "image/png"
            } else if filename.ends_with(".jpg") || filename.ends_with(".jpeg") {
                "image/jpeg"
            } else if filename.ends_with(".gif") {
                "image/gif"
            } else {
                "application/octet-stream"
            };
            
            Ok(HttpResponse::Ok()
                .content_type(content_type)
                .body(content))
        }
        Err(_) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Image not found"
        })))
    }
}

// Serve static images from images directory
async fn serve_static_image(path: web::Path<String>) -> Result<HttpResponse> {
    let filename = path.into_inner();
    let file_path = format!("images/{}", filename);
    
    match fs::read(&file_path) {
        Ok(content) => {
            // Determine content type based on file extension
            let content_type = if filename.ends_with(".png") {
                "image/png"
            } else if filename.ends_with(".jpg") || filename.ends_with(".jpeg") {
                "image/jpeg"
            } else if filename.ends_with(".gif") {
                "image/gif"
            } else {
                "application/octet-stream"
            };
            
            Ok(HttpResponse::Ok()
                .content_type(content_type)
                .body(content))
        }
        Err(_) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Image not found"
        })))
    }
}

// Suggest tag endpoint
async fn suggest_tag(req: web::Json<SuggestTagRequest>) -> Result<HttpResponse> {
    let suggestion_id = Uuid::new_v4().to_string();
    let suggestion = TagSuggestion {
        id: suggestion_id.clone(),
        image_id: req.image_id.clone(),
        tag: req.tag.clone(),
        suggested_by: req.suggested_by.clone(),
        suggested_at: Utc::now().to_rfc3339(),
        status: "pending".to_string(),
        reviewed_by: None,
        reviewed_at: None,
    };

    let mut suggestions = TAG_SUGGESTIONS.lock().unwrap();
    suggestions.insert(suggestion_id.clone(), suggestion.clone());
    drop(suggestions);

    // Save data to JSON
    let _ = save_data_to_json();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "suggestion_id": suggestion_id,
        "message": "Tag suggestion submitted successfully"
    })))
}

// Get tags for image endpoint
async fn get_image_tags(image_id: web::Path<String>) -> Result<HttpResponse> {
    let suggestions = TAG_SUGGESTIONS.lock().unwrap();
    let approved_tags = APPROVED_TAGS.lock().unwrap();
    
    // Get approved tags for this image
    let image_approved_tags: Vec<ApprovedTag> = approved_tags.values()
        .filter(|tag| tag.image_id == *image_id)
        .cloned()
        .collect();
    
    // Get pending suggestions for this image
    let image_suggestions: Vec<TagSuggestion> = suggestions.values()
        .filter(|suggestion| suggestion.image_id == *image_id)
        .cloned()
        .collect();
    
    drop(suggestions);
    drop(approved_tags);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "approved": image_approved_tags,
        "suggestions": image_suggestions
    })))
}

// Review tag suggestion endpoint (admin only)
async fn review_tag(req: web::Json<ReviewTagRequest>) -> Result<HttpResponse> {
    let mut suggestions = TAG_SUGGESTIONS.lock().unwrap();
    
    if let Some(suggestion) = suggestions.get_mut(&req.suggestion_id) {
        suggestion.status = req.status.clone();
        suggestion.reviewed_by = Some(req.reviewed_by.clone());
        suggestion.reviewed_at = Some(Utc::now().to_rfc3339());
        
        // If approved, add to approved tags
        if req.status == "approved" {
            let approved_tag = ApprovedTag {
                id: Uuid::new_v4().to_string(),
                image_id: suggestion.image_id.clone(),
                tag: suggestion.tag.clone(),
                approved_by: req.reviewed_by.clone(),
                approved_at: Utc::now().to_rfc3339(),
                upvotes: 0,
            };
            
            let mut approved_tags = APPROVED_TAGS.lock().unwrap();
            approved_tags.insert(approved_tag.id.clone(), approved_tag);
            drop(approved_tags);
        }
        
        drop(suggestions);
        
        // Save data to JSON
        let _ = save_data_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Tag suggestion reviewed successfully"
        })))
    } else {
        drop(suggestions);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Tag suggestion not found"
        })))
    }
}

// Get all pending tag suggestions (admin only)
async fn get_pending_suggestions() -> Result<HttpResponse> {
    let suggestions = TAG_SUGGESTIONS.lock().unwrap();
    let pending_suggestions: Vec<TagSuggestion> = suggestions.values()
        .filter(|suggestion| suggestion.status == "pending")
        .cloned()
        .collect();
    drop(suggestions);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "suggestions": pending_suggestions
    })))
}

// Upvote a tag
async fn upvote_tag(req: web::Json<UpvoteTagRequest>) -> Result<HttpResponse> {
    let upvote_id = Uuid::new_v4().to_string();
    
    // Check if user already upvoted this tag
    let upvotes = TAG_UPVOTES.lock().unwrap();
    let already_upvoted = upvotes.values()
        .any(|upvote| upvote.tag_id == req.tag_id && upvote.user_id == req.user_id);
    drop(upvotes);
    
    if already_upvoted {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "User has already upvoted this tag"
        })));
    }
    
    // Create upvote record
    let upvote = TagUpvote {
        id: upvote_id.clone(),
        tag_id: req.tag_id.clone(),
        user_id: req.user_id.clone(),
        upvoted_at: Utc::now().to_rfc3339(),
    };
    
    // Store upvote
    let mut upvotes = TAG_UPVOTES.lock().unwrap();
    upvotes.insert(upvote_id.clone(), upvote);
    drop(upvotes);
    
    // Update tag upvote count
    let mut approved_tags = APPROVED_TAGS.lock().unwrap();
    if let Some(tag) = approved_tags.get_mut(&req.tag_id) {
        tag.upvotes += 1;
    }
    drop(approved_tags);
    
    // Save data to JSON
    let _ = save_data_to_json();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Tag upvoted successfully"
    })))
}

// Check if user has upvoted a tag
async fn check_user_upvote(tag_id: web::Path<String>, user_id: web::Path<String>) -> Result<HttpResponse> {
    let upvotes = TAG_UPVOTES.lock().unwrap();
    let has_upvoted = upvotes.values()
        .any(|upvote| upvote.tag_id == *tag_id && upvote.user_id == *user_id);
    drop(upvotes);
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "has_upvoted": has_upvoted
    })))
}

// Save data endpoint (admin only)
async fn save_data_endpoint() -> Result<HttpResponse> {
    match save_data_to_json() {
        Ok(_) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Data saved to JSON successfully"
        }))),
        Err(e) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save data: {}", e)
        })))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    
    // Initialize uploads directory
    init_uploads_dir()?;
    
    // Load data from JSON
    if let Err(e) = load_data_from_json() {
        eprintln!("Error: Failed to load data from JSON: {}", e);
        eprintln!("Please ensure data.json exists and is valid.");
        std::process::exit(1);
    } else {
        println!("Data loaded from JSON successfully!");
    }
    
    println!("Starting server on http://localhost:8082");
    
    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
            
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .route("/login", web::post().to(login))
            .route("/protected", web::get().to(protected_route))
            .route("/admin", web::get().to(admin_only_route))
            .route("/users", web::get().to(get_users_endpoint))
            // Image and group management endpoints
            .route("/upload", web::post().to(upload_image))
            .route("/groups", web::post().to(create_group))
            .route("/groups", web::get().to(list_groups))
            .route("/groups/add-user", web::post().to(add_user_to_group))
            .route("/groups/remove-user", web::post().to(remove_user_from_group))
            .route("/groups/update", web::post().to(update_group))
            .route("/groups/delete", web::post().to(delete_group))
            .route("/images/{username}", web::get().to(get_user_images))
            .route("/images/delete/{image_id}", web::delete().to(delete_image))
            .route("/uploads/{filename}", web::get().to(serve_image))
            .route("/static/{filename}", web::get().to(serve_static_image))
            // Tag management endpoints
            .route("/tags/suggest", web::post().to(suggest_tag))
            .route("/tags/image/{image_id}", web::get().to(get_image_tags))
            .route("/tags/review", web::post().to(review_tag))
            .route("/tags/pending", web::get().to(get_pending_suggestions))
            .route("/tags/upvote", web::post().to(upvote_tag))
            .route("/tags/upvote/{tag_id}/{user_id}", web::get().to(check_user_upvote))
            .route("/admin/save", web::post().to(save_data_endpoint))
    })
    .bind("127.0.0.1:8082")?
    .run()
    .await
}
