import axios from 'axios';
import { LoginRequest, LoginResponse, Image, Group, TagSuggestion, ApprovedTag, TagUpvote } from '../types';

const API_BASE_URL = 'http://localhost:8082';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    api.post('/login', credentials).then(res => res.data),
};

// Groups API
export const groupsAPI = {
  getAll: (): Promise<{ groups: Group[] }> =>
    api.get('/groups').then(res => res.data),
  
  create: (data: { name: string; description: string }): Promise<{ success: boolean; id: string; error?: string }> =>
    api.post('/groups', data).then(res => res.data),
  
  addUser: (data: { group_id: string; username: string }): Promise<{ success: boolean; error?: string }> =>
    api.post(`/groups/${data.group_id}/members`, { username: data.username }).then(res => res.data),
  
  removeUser: (data: { group_id: string; username: string }): Promise<{ success: boolean; error?: string }> =>
    api.delete(`/groups/${data.group_id}/members/${data.username}`).then(res => res.data),
  
  update: (data: { group_id: string; name: string; description: string }): Promise<{ success: boolean; error?: string }> =>
    api.put(`/groups/${data.group_id}`, { name: data.name, description: data.description }).then(res => res.data),
  
  delete: (data: { group_id: string }): Promise<{ success: boolean; error?: string }> =>
    api.delete(`/groups/${data.group_id}`).then(res => res.data),
};

// Images API
export const imagesAPI = {
  getUserImages: (username: string): Promise<{ images: Image[] }> =>
    api.get(`/users/${username}/images`).then(res => res.data),
  
  getImage: (imageId: string): Promise<{ image: Image }> =>
    api.get(`/images/${imageId}`).then(res => res.data),
  
  upload: (formData: FormData): Promise<{ success: boolean; id: string; filename: string; error?: string }> =>
    api.post('/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),
  
  delete: (imageId: string): Promise<{ success: boolean; error?: string }> =>
    api.delete(`/images/${imageId}`).then(res => res.data),
};

// Tags API
export const tagsAPI = {
  suggest: (imageId: string, data: { tag: string; suggested_by: string }): Promise<{ success: boolean; id: string }> =>
    api.post(`/images/${imageId}/tags`, data).then(res => res.data),
  
  getImageTags: (imageId: string): Promise<{ tags: TagSuggestion[] }> =>
    api.get(`/images/${imageId}/tags`).then(res => res.data),
  
  review: (tagId: string, data: { status: string; reviewed_by: string }): Promise<{ success: boolean }> =>
    api.put(`/tags/${tagId}`, data).then(res => res.data),
  
  upvote: (tagId: string, data: { user_id: string }): Promise<{ success: boolean }> =>
    api.post(`/tags/${tagId}/upvotes`, data).then(res => res.data),
  
  getAll: (): Promise<{ suggestions: TagSuggestion[] }> =>
    api.get('/tags').then(res => res.data),
  
  getApproved: (): Promise<{ tags: ApprovedTag[] }> =>
    api.get('/tags/approved').then(res => res.data),
  
  getUpvotes: (tagId: string): Promise<{ upvotes: TagUpvote[] }> =>
    api.get(`/tags/${tagId}/upvotes`).then(res => res.data),
};

// Users API
export const usersAPI = {
  getAll: (): Promise<string[]> =>
    api.get('/users').then(res => res.data),
};

// Chat API
export const chatAPI = {
  sendMessage: (data: {
    message: string;
    context: any;
  }): Promise<{ success: boolean; response?: string; error?: string }> =>
    api.post('/conversations', data).then(res => res.data),
};

// AI API
export const aiAPI = {
  generateTagSuggestion: (data: {
    group_name: string;
    approved_tags: string[];
    rejected_tags: string[];
    pending_tags: string[];
    image_name: string;
    image_url: string;
  }): Promise<{ success: boolean; suggestion?: string; error?: string }> =>
    api.post('/ai/tag-suggestions', data).then(res => res.data),
};

export default api;

