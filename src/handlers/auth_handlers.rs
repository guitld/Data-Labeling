use actix_web::{web, HttpResponse, Result};
use serde_json;
use crate::models::{LoginRequest, LoginResponse};
use crate::services::UserService;

pub async fn login(
    login_req: web::Json<LoginRequest>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    println!("🔐 Login attempt for user: {}", login_req.username);
    
    if let Some(user) = user_service.authenticate(&login_req.username, &login_req.password) {
        println!("✅ Login successful for user: {} (role: {})", user.username, user.role);
        let response = LoginResponse {
            success: true,
            username: login_req.username.clone(),
            role: user.role.clone(),
            message: "Login successful".to_string(),
        };
        return Ok(HttpResponse::Ok().json(response));
    }
    
    println!("❌ Login failed for user: {} - Invalid credentials", login_req.username);
    Ok(HttpResponse::Unauthorized().json(serde_json::json!({
        "success": false,
        "error": "Invalid credentials"
    })))
}

pub async fn protected_route() -> Result<HttpResponse> {
    println!("🔒 Protected route accessed");
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "This is protected data accessible to all authenticated users"
    })))
}

pub async fn admin_only_route() -> Result<HttpResponse> {
    println!("👑 Admin route accessed");
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Welcome to admin panel",
        "admin_data": "Sensitive admin information - only admins can see this"
    })))
}

pub async fn get_users_endpoint(
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    println!("👥 Fetching all users");
    let usernames = user_service.get_all_usernames();
    println!("✅ Retrieved {} users: {:?}", usernames.len(), usernames);
    Ok(HttpResponse::Ok().json(usernames))
}
