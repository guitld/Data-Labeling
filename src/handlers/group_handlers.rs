use actix_web::{web, HttpResponse, Result};
use serde_json;
use crate::models::{CreateGroupRequest, AddUserToGroupRequest, RemoveUserFromGroupRequest, UpdateGroupRequest, DeleteGroupRequest, Group};
use crate::services::DataService;

pub async fn get_groups(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let data = data_service.lock().unwrap();
    let groups: Vec<&Group> = data.get_all_groups();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "groups": groups
    })))
}

pub async fn create_group(
    group_req: web::Json<CreateGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    let group = Group::new(
        group_req.name.clone(),
        group_req.description.clone(),
        "admin".to_string(), // TODO: Get from auth context
    );
    
    let group_id = data.create_group(group);
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "group_id": group_id,
        "message": "Group created successfully"
    })))
}

pub async fn add_user_to_group(
    req: web::Json<AddUserToGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    if let Some(group) = data.get_group_mut(&req.group_id) {
        group.add_member(req.username.clone());
        let _ = data.save_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "User added to group successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}

pub async fn remove_user_from_group(
    req: web::Json<RemoveUserFromGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    if let Some(group) = data.get_group_mut(&req.group_id) {
        group.remove_member(&req.username);
        let _ = data.save_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "User removed from group successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}

pub async fn update_group(
    req: web::Json<UpdateGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    if let Some(group) = data.get_group_mut(&req.group_id) {
        group.name = req.name.clone();
        group.description = req.description.clone();
        let _ = data.save_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Group updated successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}

pub async fn delete_group(
    req: web::Json<DeleteGroupRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    if data.delete_group(&req.group_id) {
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Group deleted successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Group not found"
        })))
    }
}

