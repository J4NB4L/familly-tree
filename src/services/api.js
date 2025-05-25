// frontend/src/services/api.js
import axios from 'axios';

// Tu peux mettre ça dans un .env.local ou .env.development etc.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optionnel: Intercepteur de réponse pour gérer les erreurs globales (ex: 401 Unauthorized)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Gérer la déconnexion automatique si token invalide/expiré
      // Par exemple, en appelant authService.logout() et en redirigeant vers la page de connexion.
      // Attention aux dépendances circulaires si authService importe apiClient.
      console.error('Unauthorized, logging out.');
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userProfile'); // Cache du profil
      window.location.href = '/login'; // Redirection brutale
    }
    return Promise.reject(error);
  }
);

export default apiClient;