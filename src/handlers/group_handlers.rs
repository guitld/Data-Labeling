use actix_web::{web, HttpResponse, Result};
use serde_json;
use crate::models::{CreateGroupRequest, AddUserToGroupRequest, UpdateGroupRequest, Group};
use crate::services::DataService;

pub async fn get_groups(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    println!("📁 Fetching all groups");
    let data = data_service.lock().unwrap();
    let groups: Vec<&Group> = data.get_all_groups();
    println!("✅ Retrieved {} groups", groups.len());
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "groups": groups
    })))
}

pub async fn get_group(
    path: web::Path<String>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let group_id = path.into_inner();
    println!("📁 Fetching group '{}'", group_id);
    let data = data_service.lock().unwrap();
    
    if let Some(group) = data.get_group(&group_id) {
        println!("✅ Retrieved group '{}'", group_id);
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "group": group
        })))
    } else {
        println!("❌ Group '{}' not found", group_id);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}

pub async fn create_group(
    group_req: web::Json<CreateGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    println!("➕ Creating new group: '{}'", group_req.name);
    let mut data = data_service.lock().unwrap();
    
    let group = Group::new(
        group_req.name.clone(),
        group_req.description.clone(),
        "admin".to_string(), // TODO: Get from auth context
    );
    
    let group_id = data.create_group(group);
    println!("✅ Group created successfully with ID: {}", group_id);
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "group_id": group_id,
        "message": "Group created successfully"
    })))
}

pub async fn add_user_to_group(
    path: web::Path<String>,
    req: web::Json<AddUserToGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let group_id = path.into_inner();
    println!("👤 Adding user '{}' to group '{}'", req.username, group_id);
    let mut data = data_service.lock().unwrap();
    
    if let Some(group) = data.get_group_mut(&group_id) {
        group.add_member(req.username.clone());
        let _ = data.save_to_json();
        println!("✅ User '{}' added to group '{}' successfully", req.username, group_id);
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "User added to group successfully"
        })))
    } else {
        println!("❌ Group '{}' not found", group_id);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}

pub async fn remove_user_from_group(
    path: web::Path<(String, String)>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let (group_id, username) = path.into_inner();
    println!("👤 Removing user '{}' from group '{}'", username, group_id);
    let mut data = data_service.lock().unwrap();
    
    if let Some(group) = data.get_group_mut(&group_id) {
        group.remove_member(&username);
        let _ = data.save_to_json();
        println!("✅ User '{}' removed from group '{}' successfully", username, group_id);
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "User removed from group successfully"
        })))
    } else {
        println!("❌ Group '{}' not found", group_id);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}


pub async fn update_group(
    path: web::Path<String>,
    req: web::Json<UpdateGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let group_id = path.into_inner();
    println!("✏️ Updating group '{}' to '{}'", group_id, req.name);
    let mut data = data_service.lock().unwrap();
    
    if let Some(group) = data.get_group_mut(&group_id) {
        group.name = req.name.clone();
        group.description = req.description.clone();
        let _ = data.save_to_json();
        println!("✅ Group '{}' updated successfully", group_id);
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Group updated successfully"
        })))
    } else {
        println!("❌ Group '{}' not found", group_id);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}


pub async fn delete_group(
    path: web::Path<String>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let group_id = path.into_inner();
    println!("🗑️ Deleting group '{}'", group_id);
    let mut data = data_service.lock().unwrap();
    
    if data.delete_group(&group_id) {
        println!("✅ Group '{}' deleted successfully", group_id);
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Group deleted successfully"
        })))
    } else {
        println!("❌ Group '{}' not found", group_id);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}



