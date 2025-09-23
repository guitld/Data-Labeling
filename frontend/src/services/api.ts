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
    api.post('/groups/add-user', data).then(res => res.data),
  
  removeUser: (data: { group_id: string; username: string }): Promise<{ success: boolean; error?: string }> =>
    api.post('/groups/remove-user', data).then(res => res.data),
  
  update: (data: { group_id: string; name: string; description: string }): Promise<{ success: boolean; error?: string }> =>
    api.post('/groups/update', data).then(res => res.data),
  
  delete: (data: { group_id: string }): Promise<{ success: boolean; error?: string }> =>
    api.post('/groups/delete', data).then(res => res.data),
};

// Images API
export const imagesAPI = {
  getUserImages: (username: string): Promise<{ images: Image[] }> =>
    api.get(`/images/${username}`).then(res => res.data),
  
  upload: (formData: FormData): Promise<{ success: boolean; id: string; filename: string; error?: string }> =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),
  
  delete: (imageId: string): Promise<{ success: boolean; error?: string }> =>
    api.delete(`/images/delete/${imageId}`).then(res => res.data),
};

// Tags API
export const tagsAPI = {
  suggest: (data: { image_id: string; tag: string; suggested_by: string }): Promise<{ success: boolean; id: string }> =>
    api.post('/tags/suggest', data).then(res => res.data),
  
  review: (data: { suggestion_id: string; status: string; reviewed_by: string }): Promise<{ success: boolean }> =>
    api.post('/tags/review', data).then(res => res.data),
  
  upvote: (data: { tag_id: string; user_id: string }): Promise<{ success: boolean }> =>
    api.post('/tags/upvote', data).then(res => res.data),
  
  getAll: (): Promise<{ suggestions: TagSuggestion[] }> =>
    api.get('/tags/all').then(res => res.data),
  
  getApproved: (): Promise<{ tags: ApprovedTag[] }> =>
    api.get('/tags/approved').then(res => res.data),
  
  getUpvotes: (): Promise<{ upvotes: TagUpvote[] }> =>
    api.get('/tags/upvotes').then(res => res.data),
};

// Users API
export const usersAPI = {
  getAll: (): Promise<string[]> =>
    api.get('/users').then(res => res.data),
};

export default api;

