use actix_web::{web, HttpResponse, Result};
use crate::services::DataService;

pub async fn export_annotations(
    data_service: web::Data<std::sync::Mutex<DataService>>,
) -> Result<HttpResponse> {
    let data = data_service.lock().unwrap();
    let export = data.export_annotations();

    let json = serde_json::to_string_pretty(&export).unwrap_or_else(|_| "{}".to_string());

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .append_header(("Content-Disposition", "attachment; filename=annotations_export.json"))
        .body(json))
}

