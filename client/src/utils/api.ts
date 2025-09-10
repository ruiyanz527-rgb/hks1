import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: (process.env.REACT_APP_API_URL as string) || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：附加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一鉴权与错误
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const errorMessage =
      error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(errorMessage));
  }
);

// ============ API methods ============

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse>('/auth/login', data),

  verify: () => api.get<ApiResponse>('/auth/verify'),

  refresh: () => api.post<ApiResponse>('/auth/refresh'),
};

export const userAPI = {
  getProfile: () => api.get<ApiResponse>('/users/profile'),

  updateProfile: (data: any) => api.put<ApiResponse>('/users/profile', data),

  updateResearchInterests: (data: { researchInterests: any[] }) =>
    api.put<ApiResponse>('/users/research-interests', data),

  updateSkills: (data: { skills: any[] }) =>
    api.put<ApiResponse>('/users/skills', data),

  updateEducation: (data: { education: any[] }) =>
    api.put<ApiResponse>('/users/education', data),

  updatePreferences: (data: { preferences: any }) =>
    api.put<ApiResponse>('/users/preferences', data),

  getPublicProfile: (userId: string) =>
    api.get<ApiResponse>(`/users/${userId}/public`),

  searchUsers: (params: any) =>
    api.get<ApiResponse>('/users/search', { params }),
};

export const matchAPI = {
  // 支持可选 count 参数，通过 query 传递
  getRecommendations: (params?: { count?: number }) =>
    api.get<ApiResponse>('/matches/recommendations', { params }),

  swipe: (data: { targetUserId: string; action: 'like' | 'pass' }) =>
    api.post<ApiResponse>('/matches/swipe', data),

  getMatches: () => api.get<ApiResponse>('/matches/list'),

  unmatch: (matchId: string) =>
    api.delete<ApiResponse>(`/matches/unmatch/${matchId}`),
};

export const chatAPI = {
  // 可选：获取房间列表（如果后端有实现）
  getChatRooms: () => api.get<ApiResponse>('/chat/rooms'),

  // 发起或复用房间（单向开聊）
  start: (targetUserId: string) => api.post<ApiResponse>('/chat/start', { targetUserId }),

  // 获取消息列表
  getMessages: (roomId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>(`/chat/rooms/${roomId}/messages`, { params }),

  // 发送消息
  sendMessage: (roomId: string, data: { content: string; messageType?: string }) =>
    api.post<ApiResponse>(`/chat/rooms/${roomId}/messages`, data),

  // 可选：标记已读（如果后端实现）
  markAsRead: (roomId: string) =>
    api.put<ApiResponse>(`/chat/rooms/${roomId}/read`),

  // 可选：删除消息（如果后端实现）
  deleteMessage: (messageId: string) =>
    api.delete<ApiResponse>(`/chat/messages/${messageId}`),
};

// 上传相关
export const uploadAPI = {
  uploadResume: (file: File, autoExtract: boolean = false) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('autoExtract', String(autoExtract));
    return api.post<ApiResponse>('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<ApiResponse>('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteFile: (type: 'resume' | 'avatar') =>
    api.delete<ApiResponse>(`/upload/file/${type}`),
};

// 工具：统一错误消息
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return '发生未知错误';
};

// 简化 hooks 封装（如需要）
export const createApiHook = <T>(apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>) => {
  return async (): Promise<{ data: T | null; error: string | null; loading: boolean }> => {
    try {
      const response = await apiCall();
      return { data: (response.data.data ?? response.data) as T, error: null, loading: false };
    } catch (error: any) {
      return { data: null, error: handleApiError(error), loading: false };
    }
  };
};

export const apiMethods = {
  updateProfile: async (profileData: any) => {
    const response = await userAPI.updateProfile(profileData);
    return response.data;
  },
  getProfile: async () => {
    const response = await userAPI.getProfile();
    return response.data;
  },
  getRecommendations: async (count?: number) => {
    const response = await matchAPI.getRecommendations(count ? { count } : undefined);
    return response.data;
  },
};

export default api;
export { api };