import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookie from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = Cookie.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookie.get('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${API_URL}/api/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          
          Cookie.set('access_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          
          return apiClient(originalRequest);
        }
      } catch (err) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth
  auth: {
    login: (username: string, password: string) =>
      apiClient.post('/auth/token/', { username, password }),
    signup: (data: any) =>
      apiClient.post('/users/', data),
    refreshToken: (refresh: string) =>
      apiClient.post('/auth/token/refresh/', { refresh }),
  },

  // Users
  users: {
    getProfile: (id?: string) =>
      id ? apiClient.get(`/users/${id}/`) : apiClient.get('/users/me/'),
    updateProfile: (data: any) =>
      apiClient.put('/users/me/', data),
    getUser: (id: string) =>
      apiClient.get(`/users/${id}/`),
    listUsers: (params?: any) =>
      apiClient.get('/users/', { params }),
    follow: (userId: string) =>
      apiClient.post(`/users/${userId}/follow/`),
    unfollow: (userId: string) =>
      apiClient.post(`/users/${userId}/unfollow/`),
    getFollowers: (userId: string) =>
      apiClient.get(`/users/${userId}/followers/`),
    getFollowing: (userId: string) =>
      apiClient.get(`/users/${userId}/following/`),
    getSettings: () =>
      apiClient.get('/users/settings/'),
    updateSettings: (data: any) =>
      apiClient.put('/users/settings/', data),
    changePassword: (data: any) =>
      apiClient.post('/users/change_password/', data),
  },

  // Posts
  posts: {
    list: (params?: any) =>
      apiClient.get('/posts/', { params }),
    create: (data: any) =>
      apiClient.post('/posts/', data),
    getPost: (id: string) =>
      apiClient.get(`/posts/${id}/`),
    updatePost: (id: string, data: any) =>
      apiClient.put(`/posts/${id}/`, data),
    deletePost: (id: string) =>
      apiClient.delete(`/posts/${id}/`),
    getComments: (postId: string, params?: any) =>
      apiClient.get(`/posts/${postId}/comments/`, { params }),
  },

  // Feed
  feed: {
    getFeed: (params?: any) =>
      apiClient.get('/posts/feed/my_feed/', { params }),
    getExplore: (params?: any) =>
      apiClient.get('/posts/feed/explore/', { params }),
    refreshFeed: () =>
      apiClient.post('/posts/feed/refresh/'),
  },

  // Interactions
  interactions: {
    // Likes
    like: (data: any) =>
      apiClient.post('/interactions/likes/', data),
    unlike: (likeId: string) =>
      apiClient.delete(`/interactions/likes/${likeId}/`),
    toggleLike: (postId: string) =>
      apiClient.post('/interactions/likes/toggle/', { post_id: postId }),
    
    // Comments
    createComment: (data: any) =>
      apiClient.post('/interactions/comments/', data),
    getComment: (id: string) =>
      apiClient.get(`/interactions/comments/${id}/`),
    updateComment: (id: string, data: any) =>
      apiClient.put(`/interactions/comments/${id}/`, data),
    deleteComment: (id: string) =>
      apiClient.delete(`/interactions/comments/${id}/`),
    likeComment: (commentId: string) =>
      apiClient.post(`/interactions/comments/${commentId}/like/`),
    unlikeComment: (commentId: string) =>
      apiClient.post(`/interactions/comments/${commentId}/unlike/`),
  },

  // Notifications
  notifications: {
    list: (params?: any) =>
      apiClient.get('/notifications/', { params }),
    getNotification: (id: string) =>
      apiClient.get(`/notifications/${id}/`),
    markAsRead: (id: string) =>
      apiClient.post(`/notifications/${id}/mark_as_read/`),
    markAllAsRead: (data?: any) =>
      apiClient.post('/notifications/mark_all_as_read/', data),
    getUnreadCount: () =>
      apiClient.get('/notifications/unread_count/'),
    getRecent: () =>
      apiClient.get('/notifications/recent/'),
    deleteAll: () =>
      apiClient.delete('/notifications/delete_all/'),
    getPreferences: () =>
      apiClient.get('/notifications/preferences/'),
    updatePreferences: (data: any) =>
      apiClient.put('/notifications/preferences/', data),
  },
};

export default apiClient;
