import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const saveToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getToken = () => {
  return localStorage.getItem('authToken');
};

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiService = {
  // Треки
  getTracks: () => api.get('/tracks/'),
  getTopTracks: () => api.get('/top-tracks/'),
  
  // Авторизация
  register: (userData) => api.post('/register/', userData),
  login: (credentials) => api.post('/login/', credentials),
  logout: () => {
    localStorage.removeItem('authToken');
    return api.post('/logout/');
  },
  checkAuth: () => api.get('/check-auth/'),
  getCSRFToken: () => api.get('/get-csrf/'),
  
  // Избранное
  addToFavorites: (trackId) => api.post(`/favorite/${trackId}/`),
  checkFavorite: (trackId) => api.get(`/check-favorite/${trackId}/`),
  
  // Статистика
  getFavoritesStats: () => api.get('/favorites/stats/'),
  getUserFavorites: () => api.get('/user/favorites/'),
  
  // Профиль пользователя
  getProfile: () => api.get('/profile/'),
  
  // Смена email и пароля
  changeEmail: (data) => api.post('/change-email/', data),
  changePassword: (data) => api.post('/change-password/', data),
  
  // Комментарии
  getComments: (trackId) => api.get(`/tracks/${trackId}/comments/`),
  addComment: (trackId, text) => api.post(`/tracks/${trackId}/comments/`, { text }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}/`),
  
  // Количество лайков у трека
  getTrackFavoriteCount: (trackId) => api.get(`/tracks/${trackId}/favorite-count/`),
  
  // ДОБАВЛЕНО: Отметка комментариев как от удаленного аккаунта
  markCommentsAsDeleted: (userId) => api.post(`/users/${userId}/mark-comments-deleted/`),
  
  // ДОБАВЛЕНО: Удаление аккаунта (если у тебя есть такой эндпоинт)
  deleteAccount: () => api.post('/delete-account/'),
};

export default api;