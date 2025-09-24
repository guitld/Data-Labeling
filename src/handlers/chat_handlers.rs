use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::services::DataService;
use reqwest;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub context: ChatContext,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatContext {
    #[serde(alias = "totalImages")]
    pub total_images: usize,
    #[serde(alias = "totalGroups")]
    pub total_groups: usize,
    #[serde(alias = "totalTags")]
    pub total_tags: usize,
    #[serde(alias = "pendingSuggestions")]
    pub pending_suggestions: usize,
    #[serde(alias = "groupStats")]
    pub group_stats: Vec<GroupStat>,
    #[serde(alias = "tagStats")]
    pub tag_stats: HashMap<String, usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GroupStat {
    pub name: String,
    #[serde(alias = "memberCount")]
    pub member_count: usize,
    #[serde(alias = "imageCount")]
    pub image_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<String>,
    pub data: Option<serde_json::Value>,
}

pub async fn chat_endpoint(
    _data: web::Data<std::sync::Mutex<DataService>>,
    request: web::Json<ChatRequest>,
) -> Result<HttpResponse> {
    println!("💬 Chat request received: '{}'", request.message);
    // Processar a mensagem com OpenAI
    let response = process_chat_with_openai(&request.message, &request.context).await;
    
    if response.success {
        println!("✅ Chat response generated successfully");
    } else {
        println!("❌ Chat response failed: {:?}", response.error);
    }
    
    Ok(HttpResponse::Ok().json(response))
}

async fn process_chat_with_openai(message: &str, context: &ChatContext) -> ChatResponse {
    // Verificar se a API key está configurada
    let api_key = match std::env::var("OPENAI_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            return ChatResponse {
                success: false,
                message: Some("❌ **Erro:** Chave da API OpenAI não configurada. Configure a variável OPENAI_API_KEY.".to_string()),
                error: Some("OpenAI API key not configured".to_string()),
                data: None,
            };
        }
    };

    // Preparar o contexto para a OpenAI
    let context_text = format!(
        "Dados da plataforma de imagens:
- Total de imagens: {}
- Total de grupos: {}
- Total de tags aprovadas: {}
- Sugestões pendentes: {}

Grupos:
{}",
        context.total_images,
        context.total_groups,
        context.total_tags,
        context.pending_suggestions,
        context.group_stats.iter()
            .map(|stat| format!("- {}: {} membros, {} imagens", stat.name, stat.member_count, stat.image_count))
            .collect::<Vec<_>>()
            .join("\n")
    );

    // Preparar a requisição para a OpenAI
    let openai_request = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "Você é um assistente de IA especializado em análise de dados de plataformas de imagens. Analise os dados fornecidos e responda de forma clara, útil e em português brasileiro. Use emojis para tornar as respostas mais amigáveis. Seja específico e forneça insights valiosos baseados nos dados."
            },
            {
                "role": "user",
                "content": format!("Contexto da plataforma:\n{}\n\nPergunta do usuário: {}", context_text, message)
            }
        ],
        "max_tokens": 500,
        "temperature": 0.7
    });

    // Fazer a requisição para a OpenAI
    let client = reqwest::Client::new();
    let response = match client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&openai_request)
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            return ChatResponse {
                success: false,
                message: Some(format!("❌ **Erro de conexão:** {}", e)),
                error: Some(format!("Connection error: {}", e)),
                data: None,
            };
        }
    };

    // Processar a resposta da OpenAI
    if response.status().is_success() {
        let openai_response: serde_json::Value = match response.json().await {
            Ok(data) => data,
            Err(e) => {
                return ChatResponse {
                    success: false,
                    message: Some(format!("❌ **Erro ao processar resposta:** {}", e)),
                    error: Some(format!("JSON parse error: {}", e)),
                    data: None,
                };
            }
        };

        // Extrair a mensagem da resposta
        let ai_message = openai_response
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("message"))
            .and_then(|message| message.get("content"))
            .and_then(|content| content.as_str())
            .unwrap_or("Desculpe, não consegui processar sua pergunta.");

        ChatResponse {
            success: true,
            message: Some(ai_message.to_string()),
            error: None,
            data: Some(serde_json::json!({
                "type": "openai_response",
                "model": "gpt-4o-mini"
            })),
        }
    } else {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        ChatResponse {
            success: false,
            message: Some(format!("❌ **Erro da API OpenAI:** {}", error_text)),
            error: Some(format!("OpenAI API error: {}", error_text)),
            data: None,
        }
    }
}
