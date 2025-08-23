import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const endpoints = {
  // Health
  health: () => api.get('/health'),
  
  // Accounts
  getAccounts: () => api.get('/accounts'),
  createAccount: (data: { platform: string; handle: string; token_hint?: string }) => 
    api.post('/accounts', data),
  
  // Templates
  getTemplates: () => api.get('/templates'),
  createTemplate: (data: { name: string; category: string; premium: boolean; body: string }) =>
    api.post('/templates', data),
  
  // Posts
  getPosts: () => api.get('/posts'),
  createPost: (data: { account_id: string; body: string; image_alt?: string; hashtags?: string[]; scheduled_at?: string }) =>
    api.post('/posts', data),
  updatePost: (id: string, data: { status?: string; scheduled_at?: string }) =>
    api.patch(`/posts/${id}`, data),
  
  // Generator
  generatePosts: (data: { topic: string; platform: string; count: number }) =>
    api.post('/generate_posts', data),
  
  // Analytics
  getAnalytics: (postId: string) => api.get(`/analytics/${postId}`),
  
  // Admin
  seed: (apiKey: string) => api.post('/admin/seed', {}, { headers: { 'x-api-key': apiKey } }),
}