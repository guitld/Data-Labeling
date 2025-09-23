use actix_web::{web, HttpResponse, Result};
use serde_json;
use crate::models::{SuggestTagRequest, ReviewTagRequest, UpvoteTagRequest, TagSuggestion, ApprovedTag, TagUpvote};
use crate::services::DataService;
use chrono::Utc;

pub async fn suggest_tag(
    req: web::Json<SuggestTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    let suggestion = TagSuggestion::new(
        req.image_id.clone(),
        req.tag.clone(),
        req.suggested_by.clone(),
    );
    
    let suggestion_id = suggestion.id.clone();
    data.tag_suggestions.insert(suggestion_id.clone(), suggestion);
    let _ = data.save_to_json();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "suggestion_id": suggestion_id,
        "message": "Tag suggestion created successfully"
    })))
}

pub async fn review_tag(
    req: web::Json<ReviewTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    if let Some(suggestion) = data.tag_suggestions.get_mut(&req.suggestion_id) {
        suggestion.status = req.status.clone();
        suggestion.reviewed_by = Some(req.reviewed_by.clone());
        suggestion.reviewed_at = Some(Utc::now().to_rfc3339());
        
        // If approved, create approved tag
        if req.status == "approved" {
            let approved_tag = ApprovedTag::new(
                suggestion.image_id.clone(),
                suggestion.tag.clone(),
                req.reviewed_by.clone(),
            );
            let tag_id = approved_tag.id.clone();
            data.approved_tags.insert(tag_id, approved_tag);
        }
        
        let _ = data.save_to_json();
        
        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "message": "Tag suggestion reviewed successfully"
        })))
    } else {
        Ok(HttpResponse::NotFound().json(serde_json::json!({
            "success": false,
            "error": "Tag suggestion not found"
        })))
    }
}

pub async fn upvote_tag(
    req: web::Json<UpvoteTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let mut data = data_service.lock().unwrap();
    
    // Check if user already upvoted this tag
    let existing_upvote = data.tag_upvotes.values()
        .find(|upvote| upvote.tag_id == req.tag_id && upvote.user_id == req.user_id);
    
    if existing_upvote.is_some() {
        // Remove upvote
        data.tag_upvotes.retain(|_, upvote| 
            !(upvote.tag_id == req.tag_id && upvote.user_id == req.user_id)
        );
        
        // Decrease upvote count
        if let Some(tag) = data.approved_tags.get_mut(&req.tag_id) {
            tag.upvotes = (tag.upvotes - 1).max(0);
        }
    } else {
        // Add upvote
        let upvote = TagUpvote::new(req.tag_id.clone(), req.user_id.clone());
        let upvote_id = upvote.id.clone();
        data.tag_upvotes.insert(upvote_id, upvote);
        
        // Increase upvote count
        if let Some(tag) = data.approved_tags.get_mut(&req.tag_id) {
            tag.upvotes += 1;
        }
    }
    
    let _ = data.save_to_json();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Tag upvote updated successfully"
    })))
}

pub async fn get_all_tags(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let data = data_service.lock().unwrap();
    let suggestions: Vec<&TagSuggestion> = data.tag_suggestions.values().collect();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "suggestions": suggestions
    })))
}

pub async fn get_approved_tags(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let data = data_service.lock().unwrap();
    let tags: Vec<&ApprovedTag> = data.approved_tags.values().collect();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "tags": tags
    })))
}

pub async fn get_tag_upvotes(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let data = data_service.lock().unwrap();
    let upvotes: Vec<&TagUpvote> = data.tag_upvotes.values().collect();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "upvotes": upvotes
    })))
}
