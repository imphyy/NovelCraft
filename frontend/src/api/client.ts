import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const authAPI = {
  register: (email: string, password: string) =>
    apiClient.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  logout: () =>
    apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get('/auth/me'),
};

// Projects endpoints
export const projectsAPI = {
  list: () =>
    apiClient.get('/projects'),

  create: (name: string, description: string) =>
    apiClient.post('/projects', { name, description }),

  get: (id: string) =>
    apiClient.get(`/projects/${id}`),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch(`/projects/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/projects/${id}`),
};

// Chapters endpoints
export const chaptersAPI = {
  list: (projectId: string) =>
    apiClient.get(`/projects/${projectId}/chapters`),

  create: (projectId: string, title: string) =>
    apiClient.post(`/projects/${projectId}/chapters`, { title }),

  get: (id: string) =>
    apiClient.get(`/chapters/${id}`),

  update: (id: string, data: { title?: string; status?: string; content?: string }) =>
    apiClient.patch(`/chapters/${id}`, data),

  reorder: (projectId: string, chapterIds: string[]) =>
    apiClient.post(`/projects/${projectId}/chapters/reorder`, { chapterIds }),
};
