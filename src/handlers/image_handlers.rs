use actix_web::{web, HttpResponse, Result};
use actix_multipart::Multipart;
use std::io::Write;
use serde_json;
use crate::models::Image;
use crate::services::DataService;
use futures_util::TryStreamExt;

pub async fn upload_image(
    mut payload: Multipart,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut filename = String::new();
    let mut original_name = String::new();
    let mut group_id = String::new();
    let mut uploaded_by = String::new();
    let mut file_data = Vec::new();

    while let Some(item) = payload.try_next().await.unwrap() {
        match item.name() {
            "image" => {
                let content_disposition = item.content_disposition();
                if let Some(name) = content_disposition.get_filename() {
                    original_name = name.to_string();
                    filename = format!("{}_{}", 
                        chrono::Utc::now().timestamp_millis(),
                        name.replace(" ", "_")
                    );
                }
                
                let mut bytes = Vec::new();
                let mut stream = item;
                while let Some(chunk) = stream.try_next().await.unwrap() {
                    bytes.extend_from_slice(&chunk);
                }
                file_data = bytes;
            }
            "group_id" => {
                let mut bytes = Vec::new();
                let mut stream = item;
                while let Some(chunk) = stream.try_next().await.unwrap() {
                    bytes.extend_from_slice(&chunk);
                }
                group_id = String::from_utf8(bytes).unwrap_or_default();
            }
            "uploaded_by" => {
                let mut bytes = Vec::new();
                let mut stream = item;
                while let Some(chunk) = stream.try_next().await.unwrap() {
                    bytes.extend_from_slice(&chunk);
                }
                uploaded_by = String::from_utf8(bytes).unwrap_or_default();
            }
            _ => {}
        }
    }

    if filename.is_empty() || group_id.is_empty() || uploaded_by.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Missing required fields"
        })));
    }

    // Save file to uploads directory
    let file_path = format!("uploads/{}", filename);
    if let Ok(mut file) = std::fs::File::create(&file_path) {
        if let Err(_) = file.write_all(&file_data) {
            return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": "Failed to save file"
            })));
        }
    } else {
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": "Failed to create file"
        })));
    }

    // Create image record
    let image = Image::new(
        filename.clone(),
        original_name.clone(),
        group_id.clone(),
        uploaded_by.clone(),
    );

    let mut data = data_service.lock().unwrap();
    let image_id = data.create_image(image);
    let _ = data.save_to_json();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "image_id": image_id,
        "message": "Image uploaded successfully"
    })))
}

pub async fn get_user_images(
    path: web::Path<String>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let username = path.into_inner();
    let data = data_service.lock().unwrap();
    let images = data.get_user_images(&username);
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "images": images
    })))
}

pub async fn delete_image(
    path: web::Path<String>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let image_id = path.into_inner();
    let mut data = data_service.lock().unwrap();
    
    if let Some(image) = data.get_image(&image_id) {
        // Delete file from filesystem
        let file_path = format!("uploads/{}", image.filename);
        let _ = std::fs::remove_file(file_path);
        
        // Remove from data
        if data.delete_image(&image_id) {
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": "Image deleted successfully"
            })))
        } else {
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": "Failed to delete image"
            })))
        }
    } else {
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Image not found"
        })))
    }
}