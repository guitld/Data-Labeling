import React, { useState, useRef, useEffect } from 'react';
import { Group, Image, TagSuggestion, ApprovedTag } from '../../types';
import { chatAPI, ChatRequest } from '../../services/chat';

interface ChatProps {
  groups: Group[];
  images: Image[];
  tagSuggestions: TagSuggestion[];
  approvedTags: ApprovedTag[];
  onError: (error: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

const Chat: React.FC<ChatProps> = ({ 
  groups, 
  images, 
  tagSuggestions, 
  approvedTags, 
  onError 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Olá! Sou sua assistente de IA para insights da plataforma. Como posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateInsights = () => {
    const totalImages = images.length;
    const totalGroups = groups.length;
    const totalTags = approvedTags.length;
    const pendingSuggestions = tagSuggestions.filter(s => s.status === 'pending').length;
    
    const groupStats = groups.map(group => ({
      name: group.name,
      memberCount: group.members.length,
      imageCount: images.filter(img => img.group_id === group.id).length
    }));

    const tagStats = approvedTags.reduce((acc, tag) => {
      const group = groups.find(g => g.id === images.find(img => img.id === tag.image_id)?.group_id);
      if (group) {
        acc[group.name] = (acc[group.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalImages,
      totalGroups,
      totalTags,
      pendingSuggestions,
      groupStats,
      tagStats
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Gerar contexto dos dados
      const insights = generateInsights();
      
      // Preparar requisição para a API
      const chatRequest: ChatRequest = {
        message: inputMessage,
        context: {
          total_images: insights.totalImages,
          total_groups: insights.totalGroups,
          total_tags: insights.totalTags,
          pending_suggestions: insights.pendingSuggestions,
          group_stats: insights.groupStats.map(stat => ({
            name: stat.name,
            member_count: stat.memberCount,
            image_count: stat.imageCount
          })),
          tag_stats: insights.tagStats
        }
      };

      // Chamar a API do backend
      const response = await chatAPI.sendMessage(chatRequest);
      
      if (response.success && response.message) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.message,
          timestamp: new Date(),
          data: response.data
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `❌ **Erro:** ${response.error || 'Falha ao processar sua mensagem'}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
        onError(response.error || 'Erro ao processar mensagem');
      }

    } catch (error) {
      console.error('Error sending message to API:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '❌ **Erro:** Falha na comunicação com o servidor. Tente novamente.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      onError('Erro de comunicação com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <h2>🤖 Assistente de IA - Insights</h2>
        <p>Obtenha insights rápidos sobre sua plataforma</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.type === 'ai' && (
                  <div className="ai-avatar">🤖</div>
                )}
                <div className="message-text">
                  <div className="message-body">
                    {message.content.split('\n').map((line, index) => (
                      <div key={index}>
                        {line.startsWith('•') ? (
                          <div className="list-item">{line}</div>
                        ) : line.startsWith('**') && line.endsWith('**') ? (
                          <div className="message-title">{line.slice(2, -2)}</div>
                        ) : (
                          <div>{line}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai">
              <div className="message-content">
                <div className="ai-avatar">🤖</div>
                <div className="message-text">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre a plataforma..."
              className="chat-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="chat-send-btn"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
