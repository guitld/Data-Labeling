use actix_web::{web, HttpResponse, Result};
use serde_json;
use crate::models::{SuggestTagRequest, ReviewTagRequest, UpvoteTagRequest, TagSuggestion, ApprovedTag, TagUpvote};
use crate::services::DataService;
use chrono::Utc;

pub async fn suggest_tag(
    req: web::Json<SuggestTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    println!("🏷️ Suggesting tag '{}' for image '{}' by user '{}'", 
             req.tag, req.image_id, req.suggested_by);
    let mut data = data_service.lock().unwrap();
    
    let suggestion = TagSuggestion::new(
        req.image_id.clone(),
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
    req: web::Json<ReviewTagRequest>,
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    println!("👀 Reviewing tag suggestion '{}' as '{}' by '{}'", 
             req.suggestion_id, req.status, req.reviewed_by);
    let mut data = data_service.lock().unwrap();
    
    if let Some(suggestion) = data.tag_suggestions.get_mut(&req.suggestion_id) {
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
        println!("❌ Tag suggestion '{}' not found", req.suggestion_id);
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
    println!("👍 Upvoting tag '{}' by user '{}'", req.tag_id, req.user_id);
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
        println!("👎 Upvote removed for tag '{}' by user '{}'", req.tag_id, req.user_id);
    } else {
        // Add upvote
        let upvote = TagUpvote::new(req.tag_id.clone(), req.user_id.clone());
        let upvote_id = upvote.id.clone();
        data.tag_upvotes.insert(upvote_id, upvote);
        
        // Increase upvote count
        if let Some(tag) = data.approved_tags.get_mut(&req.tag_id) {
            tag.upvotes += 1;
        }
        println!("✅ Upvote added for tag '{}' by user '{}'", req.tag_id, req.user_id);
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

pub async fn get_tag_upvotes(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    println!("👍 Fetching tag upvotes");
    let data = data_service.lock().unwrap();
    let upvotes: Vec<&TagUpvote> = data.tag_upvotes.values().collect();
    println!("✅ Retrieved {} upvotes", upvotes.len());
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "upvotes": upvotes
    })))
}
