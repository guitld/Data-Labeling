use actix_web::{web, HttpResponse, Result};
use serde_json;
use crate::models::{SuggestTagRequest, ReviewTagRequest, UpvoteTagRequest, TagSuggestion, ApprovedTag, TagUpvote};
use crate::services::DataService;
use chrono::Utc;

pub async fn suggest_tag(
    path: web::Path<String>,
    req: web::Json<SuggestTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let image_id = path.into_inner();
    println!("🏷️ Suggesting tag '{}' for image '{}' by user '{}'", 
             req.tag, image_id, req.suggested_by);
    let mut data = data_service.lock().unwrap();
    
    let suggestion = TagSuggestion::new(
        image_id.clone(),
        req.tag.clone(),
        req.suggested_by.clone(),
    );
    
    let suggestion_id = suggestion.id.clone();
    data.tag_suggestions.insert(suggestion_id.clone(), suggestion);
    let _ = data.save_to_json();
    
    println!("✅ Tag suggestion '{}' created successfully (ID: {})", req.tag, suggestion_id);
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "suggestion_id": suggestion_id,
        "message": "Tag suggestion created successfully"
    })))
}

pub async fn review_tag(
    path: web::Path<String>,
    req: web::Json<ReviewTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let tag_id = path.into_inner();
    println!("👀 Reviewing tag suggestion '{}' as '{}' by '{}'", 
             tag_id, req.status, req.reviewed_by);
    let mut data = data_service.lock().unwrap();
    
    if let Some(suggestion) = data.tag_suggestions.get_mut(&tag_id) {
        let tag_text = suggestion.tag.clone();
        let image_id = suggestion.image_id.clone();
        
        suggestion.status = req.status.clone();
        suggestion.reviewed_by = Some(req.reviewed_by.clone());
        suggestion.reviewed_at = Some(Utc::now().to_rfc3339());
        
        // If approved, create approved tag
        if req.status == "approved" {
            let approved_tag = ApprovedTag::new(
                image_id,
                tag_text.clone(),
                req.reviewed_by.clone(),
            );
            let tag_id = approved_tag.id.clone();
            data.approved_tags.insert(tag_id, approved_tag);
            println!("✅ Tag '{}' approved and added to approved tags", tag_text);
        } else {
            println!("❌ Tag '{}' rejected", tag_text);
        }
        
        let _ = data.save_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Tag suggestion reviewed successfully"
        })))
    } else {
        println!("❌ Tag suggestion '{}' not found", tag_id);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Tag suggestion not found"
        })))
    }
}

pub async fn upvote_tag(
    path: web::Path<String>,
    req: web::Json<UpvoteTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let tag_id = path.into_inner();
    println!("👍 Upvoting tag '{}' by user '{}'", tag_id, req.user_id);
    let mut data = data_service.lock().unwrap();
    
    // Check if user already upvoted this tag
    let existing_upvote = data.tag_upvotes.values()
        .find(|upvote| upvote.tag_id == tag_id && upvote.user_id == req.user_id);
    
    if existing_upvote.is_some() {
        // Remove upvote
        data.tag_upvotes.retain(|_, upvote| 
            !(upvote.tag_id == tag_id && upvote.user_id == req.user_id)
        );
        
        // Decrease upvote count
        if let Some(tag) = data.approved_tags.get_mut(&tag_id) {
            tag.upvotes = (tag.upvotes - 1).max(0);
        }
        println!("👎 Upvote removed for tag '{}' by user '{}'", tag_id, req.user_id);
    } else {
        // Add upvote
        let upvote = TagUpvote::new(tag_id.clone(), req.user_id.clone());
        let upvote_id = upvote.id.clone();
        data.tag_upvotes.insert(upvote_id, upvote);
        
        // Increase upvote count
        if let Some(tag) = data.approved_tags.get_mut(&tag_id) {
            tag.upvotes += 1;
        }
        println!("✅ Upvote added for tag '{}' by user '{}'", tag_id, req.user_id);
    }
    
    let _ = data.save_to_json();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Tag upvote updated successfully"
    })))
}

pub async fn delete_approved_tag(
    path: web::Path<String>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let tag_id = path.into_inner();
    println!("🗑️ Removing approved tag '{}'", tag_id);
    let mut data = data_service.lock().unwrap();

    let removed_tag = data.approved_tags.remove(&tag_id);

    if removed_tag.is_some() {
        data.tag_upvotes.retain(|_, upvote| upvote.tag_id != tag_id);
        let _ = data.save_to_json();
        println!("✅ Approved tag '{}' removed successfully", tag_id);

        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Approved tag removed successfully"
        })))
    } else {
        println!("❌ Approved tag '{}' not found", tag_id);
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Approved tag not found"
        })))
    }
}

pub async fn get_all_tags(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    println!("🏷️ Fetching all tag suggestions");
    let data = data_service.lock().unwrap();
    let suggestions: Vec<&TagSuggestion> = data.tag_suggestions.values().collect();
    println!("✅ Retrieved {} tag suggestions", suggestions.len());
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "suggestions": suggestions
    })))
}

pub async fn get_approved_tags(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    println!("✅ Fetching approved tags");
    let data = data_service.lock().unwrap();
    let tags: Vec<&ApprovedTag> = data.approved_tags.values().collect();
    println!("✅ Retrieved {} approved tags", tags.len());
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "tags": tags
    })))
}

pub async fn get_image_tags(
    path: web::Path<String>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let image_id = path.into_inner();
    println!("🏷️ Fetching tags for image: {}", image_id);
    let data = data_service.lock().unwrap();
    
    let tags: Vec<&TagSuggestion> = data.tag_suggestions.values()
        .filter(|tag| tag.image_id == image_id)
        .collect();
    
    println!("✅ Retrieved {} tags for image '{}'", tags.len(), image_id);
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "tags": tags
    })))
}

pub async fn get_tag_upvotes(
    path: web::Path<String>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let tag_id = path.into_inner();
    println!("👍 Fetching upvotes for tag: {}", tag_id);
    let data = data_service.lock().unwrap();
    
    let upvotes: Vec<&TagUpvote> = data.tag_upvotes.values()
        .filter(|upvote| upvote.tag_id == tag_id)
        .collect();
    
    println!("✅ Retrieved {} upvotes for tag '{}'", upvotes.len(), tag_id);
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "upvotes": upvotes
    })))
}
