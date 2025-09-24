import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082';

const chatAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

export interface ChatRequest {
  message: string;
  context: {
    total_images: number;
    total_groups: number;
    total_tags: number;
    pending_suggestions: number;
    group_stats: Array<{
      name: string;
      member_count: number;
      image_count: number;
    }>;
    tag_stats: Record<string, number>;
  };
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await chatAxios.post('/conversations', request);
      return response.data;
    } catch (error) {
      console.error('Chat API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }
};

export default chatAPI;
