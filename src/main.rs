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
    get_groups, create_group, add_user_to_group, remove_user_from_group, update_group, delete_group,
    upload_image, get_user_images, delete_image,
    suggest_tag, review_tag, upvote_tag, get_all_tags, get_approved_tags, get_tag_upvotes,
};

// Inicializar uploads directory
fn init_uploads_dir() -> std::io::Result<()> {
    std::fs::create_dir_all("uploads")?;
    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
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
            
            // Group routes
            .route("/groups", web::get().to(get_groups))
            .route("/groups", web::post().to(create_group))
            .route("/groups/add-user", web::post().to(add_user_to_group))
            .route("/groups/remove-user", web::post().to(remove_user_from_group))
            .route("/groups/update", web::post().to(update_group))
            .route("/groups/delete", web::post().to(delete_group))
            
            // Image routes
            .route("/upload", web::post().to(upload_image))
            .route("/images/{username}", web::get().to(get_user_images))
            .route("/images/delete/{image_id}", web::delete().to(delete_image))
            
            // Tag routes
            .route("/tags/suggest", web::post().to(suggest_tag))
            .route("/tags/review", web::post().to(review_tag))
            .route("/tags/upvote", web::post().to(upvote_tag))
            .route("/tags/all", web::get().to(get_all_tags))
            .route("/tags/approved", web::get().to(get_approved_tags))
            .route("/tags/upvotes", web::get().to(get_tag_upvotes))
    })
    .bind("127.0.0.1:8082")?
    .run()
    .await
}