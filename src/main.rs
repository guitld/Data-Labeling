use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use std::sync::Mutex;

mod models;
mod services;
mod handlers;

use services::{UserService, DataService};
use handlers::{
    login, protected_route, admin_only_route, get_users_endpoint,
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
            // Auth routes
            .route("/login", web::post().to(login))
            .route("/protected", web::get().to(protected_route))
            .route("/admin", web::get().to(admin_only_route))
            .route("/users", web::get().to(get_users_endpoint))
            // TODO: Add other routes as we refactor them
    })
    .bind("127.0.0.1:8082")?
    .run()
    .await
}