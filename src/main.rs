use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use actix_files as fs;
use std::sync::Mutex;

mod models;
mod services;
mod handlers;

use services::{UserService, DataService};
use handlers::{
    login, protected_route, admin_only_route, get_users_endpoint,
    get_groups, get_group, create_group, add_user_to_group, remove_user_from_group, update_group, delete_group,
    upload_image, get_image, get_user_images, delete_image,
    suggest_tag, get_image_tags, review_tag, upvote_tag, get_all_tags, get_approved_tags, get_tag_upvotes, delete_approved_tag,
    chat_endpoint, generate_tag_suggestion, export_annotations,
};

// Inicializar uploads directory
fn init_uploads_dir() -> std::io::Result<()> {
    std::fs::create_dir_all("uploads")?;
    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Carregar variáveis de ambiente do arquivo .env
    dotenv::dotenv().ok();
    env_logger::init();
    
    // Initialize uploads directory
    init_uploads_dir()?;
    
    // Initialize services
    let user_service = web::Data::new(UserService::new());
    let data_service = web::Data::new(Mutex::new(DataService::new()));
    
    // Load data from JSON
    {
        let mut data = data_service.lock().unwrap();
        if let Err(e) = data.load_from_json() {
            eprintln!("Error: Failed to load data from JSON: {}", e);
            eprintln!("Please ensure data.json exists and is valid.");
            std::process::exit(1);
        } else {
            println!("Data loaded from JSON successfully!");
        }
    }
    
    println!("Starting server on http://localhost:8082");
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
            
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(user_service.clone())
            .app_data(data_service.clone())
            // Serve static files from uploads directory
            .service(fs::Files::new("/uploads", "./uploads").show_files_listing())
            // Auth routes
            .route("/login", web::post().to(login))
            .route("/protected", web::get().to(protected_route))
            .route("/admin", web::get().to(admin_only_route))
            .route("/users", web::get().to(get_users_endpoint))
            
            // Group routes - RESTful
            .route("/groups", web::get().to(get_groups))                    // GET /groups
            .route("/groups", web::post().to(create_group))                 // POST /groups
            .route("/groups/{id}", web::get().to(get_group))                // GET /groups/{id}
            .route("/groups/{id}", web::put().to(update_group))             // PUT /groups/{id}
            .route("/groups/{id}", web::delete().to(delete_group))          // DELETE /groups/{id}
            .route("/groups/{id}/members", web::post().to(add_user_to_group))    // POST /groups/{id}/members
            .route("/groups/{id}/members/{username}", web::delete().to(remove_user_from_group)) // DELETE /groups/{id}/members/{username}
            
            
            // Image routes - RESTful
            .route("/images", web::post().to(upload_image))                    // POST /images
            .route("/images/{id}", web::get().to(get_image))                   // GET /images/{id}
            .route("/images/{id}", web::delete().to(delete_image))             // DELETE /images/{id}
            .route("/users/{username}/images", web::get().to(get_user_images)) // GET /users/{username}/images
            
            // Tag routes - RESTful
            .service(
                web::resource("/images/{image_id}/tags")
                    .route(web::post().to(suggest_tag))
                    .route(web::get().to(get_image_tags))
            )
            .route("/tags", web::get().to(get_all_tags))                       // GET /tags
            .route("/tags/{tag_id}", web::put().to(review_tag))                // PUT /tags/{tag_id}
            .service(
                web::resource("/tags/{tag_id}/upvotes")
                    .route(web::post().to(upvote_tag))
                    .route(web::get().to(get_tag_upvotes))
            )
            .route("/tags/{tag_id}", web::delete().to(delete_approved_tag))
            .route("/tags/approved", web::get().to(get_approved_tags))         // GET /tags/approved
            .route("/annotations/export", web::get().to(export_annotations))
            .route("/annotations/export", web::get().to(export_annotations))
            
            // Chat routes - RESTful
            .route("/conversations", web::post().to(chat_endpoint))             // POST /conversations
            
            // AI routes - RESTful
            .route("/ai/tag-suggestions", web::post().to(generate_tag_suggestion)) // POST /ai/tag-suggestions
    })
    .bind("127.0.0.1:8082")?
    .run()
    .await
}