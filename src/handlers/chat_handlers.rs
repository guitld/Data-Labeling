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

fn process_chat_message(message: &str, context: &ChatContext) -> ChatResponse {
    let message_lower = message.to_lowercase();
    
    // Análise baseada em palavras-chave
    if message_lower.contains("estatísticas") || message_lower.contains("stats") || message_lower.contains("números") {
        let stats_message = format!(
            "📊 **Estatísticas da Plataforma:**
            
• **Total de Imagens:** {}
• **Total de Grupos:** {}
• **Tags Aprovadas:** {}
• **Sugestões Pendentes:** {}

**Distribuição por Grupo:**
{}",
            context.total_images,
            context.total_groups,
            context.total_tags,
            context.pending_suggestions,
            context.group_stats.iter()
                .map(|stat| format!("• {}: {} imagens, {} membros", stat.name, stat.image_count, stat.member_count))
                .collect::<Vec<_>>()
                .join("\n")
        );
        
        return ChatResponse {
            success: true,
            message: Some(stats_message),
            error: None,
            data: Some(serde_json::json!({
                "type": "stats",
                "total_images": context.total_images,
                "total_groups": context.total_groups,
                "total_tags": context.total_tags,
                "pending_suggestions": context.pending_suggestions
            })),
        };
    }
    
    if message_lower.contains("grupos") || message_lower.contains("group") {
        let groups_message = format!(
            "👥 **Análise de Grupos:**
            
{}",
            context.group_stats.iter()
                .map(|stat| {
                    let tag_count = context.tag_stats.get(&stat.name).unwrap_or(&0);
                    format!(
                        "**{}**
• Membros: {}
• Imagens: {}
• Tags: {}",
                        stat.name, stat.member_count, stat.image_count, tag_count
                    )
                })
                .collect::<Vec<_>>()
                .join("\n\n")
        );
        
        return ChatResponse {
            success: true,
            message: Some(groups_message),
            error: None,
            data: Some(serde_json::json!({
                "type": "groups",
                "groups": context.group_stats
            })),
        };
    }
    
    if message_lower.contains("tags") || message_lower.contains("tag") {
        let tags_message = format!(
            "🏷️ **Análise de Tags:**
            
• **Total de Tags Aprovadas:** {}
• **Sugestões Pendentes:** {}

**Tags por Grupo:**
{}",
            context.total_tags,
            context.pending_suggestions,
            context.tag_stats.iter()
                .map(|(group, count)| format!("• {}: {} tags", group, count))
                .collect::<Vec<_>>()
                .join("\n")
        );
        
        return ChatResponse {
            success: true,
            message: Some(tags_message),
            error: None,
            data: Some(serde_json::json!({
                "type": "tags",
                "total_tags": context.total_tags,
                "pending_suggestions": context.pending_suggestions,
                "tag_stats": context.tag_stats
            })),
        };
    }
    
    if message_lower.contains("ajuda") || message_lower.contains("help") || message_lower.contains("comandos") {
        let help_message = "🤖 **Comandos Disponíveis:**

• **Estatísticas**: `mostre as estatísticas`, `quantos números temos`
• **Grupos**: `analise os grupos`, `quantos grupos temos`
• **Tags**: `mostre as tags`, `quantas tags estão pendentes`
• **Ajuda**: `ajuda`, `comandos`, `o que posso perguntar`

**Exemplos de perguntas:**
• \"Mostre as estatísticas da plataforma\"
• \"Qual grupo tem mais imagens?\"
• \"Quantas tags estão pendentes?\"
• \"Analise os grupos para mim\"";
        
        return ChatResponse {
            success: true,
            message: Some(help_message.to_string()),
            error: None,
            data: Some(serde_json::json!({
                "type": "help"
            })),
        };
    }
    
    // Resposta padrão para mensagens não reconhecidas
    let default_message = "🤖 **Assistente de IA**

Posso ajudar com:
• 📊 Estatísticas gerais da plataforma
• 👥 Análise de grupos e membros  
• 🏷️ Informações sobre tags e sugestões
• 📈 Insights de uso e atividade

**Dica:** Tente perguntar sobre \"estatísticas\", \"grupos\" ou \"tags\" para obter insights específicos!";
    
    ChatResponse {
        success: true,
        message: Some(default_message.to_string()),
        error: None,
        data: Some(serde_json::json!({
            "type": "default"
        })),
    }
}
