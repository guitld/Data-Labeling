use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use reqwest;

#[derive(Debug, Serialize, Deserialize)]
pub struct TagSuggestionRequest {
    pub group_name: String,
    pub approved_tags: Vec<String>,
    pub rejected_tags: Vec<String>,
    pub pending_tags: Vec<String>,
    pub image_name: String,
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagSuggestionResponse {
    pub success: bool,
    pub suggestion: Option<String>,
    pub error: Option<String>,
}

pub async fn generate_tag_suggestion(request: web::Json<TagSuggestionRequest>) -> Result<HttpResponse> {
    println!("🤖 Generating AI tag suggestion for image '{}' in group '{}'", 
             request.image_name, request.group_name);
    
    // Verificar se a API key está configurada
    let api_key = match std::env::var("OPENAI_API_KEY") {
        Ok(key) if !key.trim().is_empty() => {
            println!("OpenAI API key found: {}...", &key[..10.min(key.len())]);
            key
        },
        Ok(_) => {
            println!("OpenAI API key is empty");
            return Ok(HttpResponse::BadRequest().json(TagSuggestionResponse {
                success: false,
                suggestion: None,
                error: Some("OpenAI API key is empty. Please configure OPENAI_API_KEY environment variable.".to_string()),
            }));
        },
        Err(e) => {
            println!("OpenAI API key not found: {}", e);
            return Ok(HttpResponse::BadRequest().json(TagSuggestionResponse {
                success: false,
                suggestion: None,
                error: Some("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.".to_string()),
            }));
        }
    };

    let req = request.into_inner();
    
    // Criar lista de tags já existentes para evitar repetições
    let existing_tags: Vec<String> = req.approved_tags.iter()
        .chain(req.rejected_tags.iter())
        .chain(req.pending_tags.iter())
        .cloned()
        .collect();
    
    let existing_tags_text = if existing_tags.is_empty() {
        String::new()
    } else {
        format!("\n\nTags já existentes (NÃO repita estas): {}", existing_tags.join(", "))
    };

    let approved_tags_text = if req.approved_tags.is_empty() { 
        "Nenhuma".to_string() 
    } else { 
        req.approved_tags.join(", ") 
    };
    
    let rejected_tags_text = if req.rejected_tags.is_empty() { 
        "Nenhuma".to_string() 
    } else { 
        req.rejected_tags.join(", ") 
    };
    
    let pending_tags_text = if req.pending_tags.is_empty() { 
        "Nenhuma".to_string() 
    } else { 
        req.pending_tags.join(", ") 
    };

    let prompt = format!(
        "Analise esta imagem do grupo \"{}\" e sugira UMA tag descritiva e relevante.

Contexto:
- Nome da imagem: {}
- Grupo: {}
- Tags aprovadas: {}
- Tags rejeitadas: {}
- Tags pendentes: {}{}

Instruções:
1. Sugira apenas UMA tag
2. A tag deve ser descritiva e relevante para a imagem
3. Use palavras-chave em português, preferencialmente
4. Seja específico e conciso
5. NÃO repita tags já existentes
6. Foque em características visuais, objetos, cores, ou conceitos principais

Responda apenas com a tag sugerida, sem explicações adicionais.",
        req.group_name,
        req.image_name,
        req.group_name,
        approved_tags_text,
        rejected_tags_text,
        pending_tags_text,
        existing_tags_text
    );

    // Converter a imagem para base64
    let base64_image = match fetch_and_convert_image(&req.image_url).await {
        Ok(base64) => base64,
        Err(e) => {
            return Ok(HttpResponse::BadRequest().json(TagSuggestionResponse {
                success: false,
                suggestion: None,
                error: Some(format!("Failed to process image: {}", e)),
            }));
        }
    };

    // Preparar a requisição para a OpenAI
    let openai_request = serde_json::json!({
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": "Você é um assistente especializado em análise de imagens e geração de tags descritivas. Sua função é sugerir tags relevantes e úteis para categorização de imagens. Sempre responda em português brasileiro."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": format!("data:image/jpeg;base64,{}", base64_image),
                            "detail": "high"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 50,
        "temperature": 0.7
    });

    // Fazer a requisição para a OpenAI
    println!("📤 Sending request to OpenAI API...");
    let client = reqwest::Client::new();
    let response = match client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&openai_request)
        .send()
        .await
    {
        Ok(resp) => {
            println!("📥 Received response from OpenAI API with status: {}", resp.status());
            resp
        },
        Err(e) => {
            println!("❌ Connection error to OpenAI API: {}", e);
            return Ok(HttpResponse::InternalServerError().json(TagSuggestionResponse {
                success: false,
                suggestion: None,
                error: Some(format!("Connection error: {}", e)),
            }));
        }
    };

    // Processar a resposta da OpenAI
    if response.status().is_success() {
        let openai_response: serde_json::Value = match response.json().await {
            Ok(data) => {
                println!("📋 OpenAI response received: {:?}", data);
                data
            },
            Err(e) => {
                println!("❌ JSON parse error: {}", e);
                return Ok(HttpResponse::InternalServerError().json(TagSuggestionResponse {
                    success: false,
                    suggestion: None,
                    error: Some(format!("JSON parse error: {}", e)),
                }));
            }
        };

        // Extrair a sugestão da resposta
        let suggestion = openai_response
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("message"))
            .and_then(|message| message.get("content"))
            .and_then(|content| content.as_str())
            .map(|s| s.trim().to_string());

        println!("🔍 Extracted suggestion: {:?}", suggestion);

        match suggestion {
            Some(sug) if !sug.is_empty() => {
                println!("✅ AI tag suggestion generated: '{}'", sug);
                Ok(HttpResponse::Ok().json(TagSuggestionResponse {
                    success: true,
                    suggestion: Some(sug),
                    error: None,
                }))
            }
            _ => {
                println!("❌ No AI tag suggestion generated - empty or invalid response from OpenAI");
                Ok(HttpResponse::Ok().json(TagSuggestionResponse {
                    success: false,
                    suggestion: None,
                    error: Some("OpenAI returned an empty or invalid response. Please try again.".to_string()),
                }))
            }
        }
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        println!("❌ OpenAI API error (status: {}): {}", status, error_text);
        Ok(HttpResponse::InternalServerError().json(TagSuggestionResponse {
            success: false,
            suggestion: None,
            error: Some(format!("OpenAI API error (status: {}): {}", status, error_text)),
        }))
    }
}

async fn fetch_and_convert_image(image_url: &str) -> Result<String, Box<dyn std::error::Error>> {
    println!("🖼️ Fetching image from URL: {}", image_url);
    let client = reqwest::Client::new();
    let response = client.get(image_url).send().await?;
    println!("📥 Image response status: {}", response.status());
    let bytes = response.bytes().await?;
    println!("📊 Image size: {} bytes", bytes.len());
    let base64 = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &bytes);
    println!("✅ Image converted to base64 successfully");
    Ok(base64)
}
