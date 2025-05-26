// frontend/src/services/authService.js
import apiClient from './api';

const JWT_TOKEN_KEY = 'jwtToken';
const USER_PROFILE_CACHE_KEY = 'userProfileCache'; 

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem(JWT_TOKEN_KEY, response.data.token);
    const baseUser = response.data.user; 
    
    try {
      const familyProfile = await authService.ensureUserProfileInFamilyTree({
        id: baseUser.id, 
        name: `${baseUser.firstName} ${baseUser.lastName}`,
        gmail: baseUser.email,
      });
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(familyProfile));
      return familyProfile;
    } catch (ensureError) {
      console.error("Erreur lors de l'intégration du profil dans l'arbre après connexion:", ensureError);
      const minimalProfileForCache = {
          id: baseUser.id,
          name: `${baseUser.firstName} ${baseUser.lastName}`,
          email: baseUser.email, // Correction: utiliser baseUser.email
      }
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(minimalProfileForCache));
      return minimalProfileForCache;
    }
  },

  register: async (userData) => { 
    const response = await apiClient.post('/auth/register', userData);
    localStorage.setItem(JWT_TOKEN_KEY, response.data.token);
    const baseUser = response.data.user;

    try {
      const familyProfileData = {
        id: baseUser.id, 
        name: `${baseUser.firstName} ${baseUser.lastName}`,
        gmail: baseUser.email,
        gender: 'unknown', 
        img: '/assets/avatars/default.svg',
      };
      const familyProfile = await authService.ensureUserProfileInFamilyTree(familyProfileData);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(familyProfile));
      return familyProfile; 
    } catch (ensureError) {
      console.error("Erreur lors de l'intégration du profil dans l'arbre après inscription:", ensureError);
      const minimalProfileForCache = {
          id: baseUser.id,
          name: `${baseUser.firstName} ${baseUser.lastName}`,
          email: baseUser.email, // Correction: utiliser baseUser.email
      }
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(minimalProfileForCache));
      return minimalProfileForCache;
    }
  },

  logout: () => {
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_CACHE_KEY);
    // La redirection est gérée par le router ou l'intercepteur de réponse
  },

  getCurrentUserProfile: () => {
    const stored = localStorage.getItem(USER_PROFILE_CACHE_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error parsing user profile from cache", e);
      localStorage.removeItem(USER_PROFILE_CACHE_KEY);
      return null;
    }
  },

  fetchUserProfileFromServer: async () => {
    try {
      const authUserResponse = await apiClient.get('/auth/me'); // Infos d'authentification
      const authUser = authUserResponse.data;

      // Tenter de récupérer le profil familial.
      // Si 404, cela signifie qu'il n'est pas encore dans familydata.json.
      try {
        const familyProfileResponse = await apiClient.get(`/family/me`); // Utilise /family/me qui est lié au token
        const familyProfile = familyProfileResponse.data;
        localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(familyProfile));
        return familyProfile;
      } catch (familyError) {
        if (familyError.response && familyError.response.status === 404) {
          console.log("Profil familial non trouvé pour l'utilisateur authentifié, tentative de création/synchronisation...");
          const ensuredProfile = await authService.ensureUserProfileInFamilyTree({
            id: authUser.id,
            name: `${authUser.firstName} ${authUser.lastName}`,
            gmail: authUser.email,
          });
          localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(ensuredProfile));
          return ensuredProfile;
        }
        throw familyError; // Relancer d'autres erreurs liées à /family/me
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil utilisateur depuis le serveur:", error);
      // Si l'erreur est 401 ou 403, l'intercepteur de apiClient devrait déjà gérer la déconnexion.
      // Sinon, on déconnecte manuellement ici en cas d'échec critique.
      if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
        authService.logout(); // Déconnexion en cas d'erreur critique non gérée par l'intercepteur
      }
      return null; // Ou throw error pour que l'appelant gère.
    }
  },

  updateCurrentUserProfileInFamilyTree: async (profileDataToUpdate) => {
    if (!profileDataToUpdate.id) {
      console.error("ID de profil manquant pour la mise à jour dans l'arbre");
      throw new Error("ID de profil manquant");
    }
    try {
      // L'ID de la personne dans l'arbre est l'ID de l'utilisateur authentifié
      const response = await apiClient.put(`/family/${profileDataToUpdate.id}`, profileDataToUpdate);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil dans l'arbre:", error);
      throw error;
    }
  },
  
  ensureUserProfileInFamilyTree: async (profileDetails) => {
    try {
      // `profileDetails` doit contenir au moins `id` (auth_uuid), `name`, `gmail`.
      // Le backend complètera avec des valeurs par défaut si nécessaire.
      const response = await apiClient.post('/family/ensure-profile', profileDetails);
      // Le cache sera mis à jour par la fonction appelante (login, register, fetchUserProfileFromServer)
      return response.data;
    } catch (error) {
      console.error("Erreur lors de ensureUserProfileInFamilyTree:", error);
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      // L'endpoint /auth/delete-account utilisera le token pour identifier l'utilisateur
      await apiClient.delete('/auth/delete-account');
      // Le logout est géré après succès dans profile.js
    } catch (error) {
      console.error("Erreur lors de la suppression du compte:", error);
      throw error;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    return !!token;
  }
};