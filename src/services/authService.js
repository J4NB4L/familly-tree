// frontend/src/services/authService.js
import apiClient from './api';

const JWT_TOKEN_KEY = 'jwtToken';
const USER_PROFILE_CACHE_KEY = 'userProfileCache'; // Cache du profil enrichi de l'arbre

export const authService = {
  // Connexion au backend
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem(JWT_TOKEN_KEY, response.data.token);
    // Stocker l'utilisateur de base (id, email, nom) retourné par /auth/login
    // Le profil complet de l'arbre sera chargé séparément ou via ensureUserProfileInFamilyTree
    const baseUser = response.data.user; // {id, email, firstName, lastName}
    
    // Tentative de synchronisation/création du profil dans l'arbre
    try {
      const familyProfile = await authService.ensureUserProfileInFamilyTree({
        id: baseUser.id, // Utiliser l'ID d'authentification
        name: `${baseUser.firstName} ${baseUser.lastName}`,
        gmail: baseUser.email,
        // Les autres champs (gender, birthYear, img, relations) seront undefined
        // et pourront être complétés via la page de profil.
      });
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(familyProfile));
      return familyProfile; // Retourne le profil enrichi de l'arbre
    } catch (ensureError) {
      console.error("Erreur lors de l'intégration du profil dans l'arbre après connexion:", ensureError);
      // Même si l'ensure échoue, l'utilisateur est connecté. On stocke le profil de base.
      // On va stocker un profil minimal pour que getCurrentUserProfile retourne quelque chose
      const minimalProfileForCache = {
          id: baseUser.id,
          name: `${baseUser.firstName} ${baseUser.lastName}`,
          email: baseUser.email,
          // autres champs par défaut
      }
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(minimalProfileForCache));
      return minimalProfileForCache;
    }
  },

  // Inscription au backend
  register: async (userData) => { // userData: {email, password, firstName, lastName}
    const response = await apiClient.post('/auth/register', userData);
    localStorage.setItem(JWT_TOKEN_KEY, response.data.token);
    const baseUser = response.data.user;

    // Après l'inscription, s'assurer que le profil existe dans l'arbre
    try {
      const familyProfileData = {
        id: baseUser.id, // Utiliser l'ID d'authentification comme ID dans l'arbre
        name: `${baseUser.firstName} ${baseUser.lastName}`,
        gmail: baseUser.email,
        gender: 'unknown', // Valeurs par défaut, à compléter par l'utilisateur
        img: '/assets/avatars/default.svg',
        // fid, mid, pids seront null/vide par défaut
      };
      const familyProfile = await authService.ensureUserProfileInFamilyTree(familyProfileData);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(familyProfile));
      return familyProfile; // Retourne le profil enrichi de l'arbre
    } catch (ensureError) {
      console.error("Erreur lors de l'intégration du profil dans l'arbre après inscription:", ensureError);
      const minimalProfileForCache = {
          id: baseUser.id,
          name: `${baseUser.firstName} ${baseUser.lastName}`,
          email: baseUser.email,
      }
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(minimalProfileForCache));
      return minimalProfileForCache;
    }
  },

  logout: () => {
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_CACHE_KEY);
    // Optionnel: appeler un endpoint backend /auth/logout si géré (ex: révocation de token)
    // apiClient.post('/auth/logout'); 
    // Redirection gérée par l'intercepteur de réponse ou le router
  },

  // Récupère le profil mis en cache localement (celui de l'arbre)
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

  // Récupère le profil utilisateur authentifié et son profil familial depuis le serveur
  fetchUserProfileFromServer: async () => {
    try {
      // D'abord, obtenir les infos de l'utilisateur authentifié (nom, email, etc.)
      const authUserResponse = await apiClient.get('/auth/me');
      const authUser = authUserResponse.data; // {id (auth_uuid), email, firstName, lastName}

      // Ensuite, obtenir son profil détaillé de l'arbre généalogique
      // L'ID de personne dans l'arbre est le même que l'ID d'authentification (auth_uuid)
      const familyProfileResponse = await apiClient.get(`/family/${authUser.id}`);
      const familyProfile = familyProfileResponse.data;

      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(familyProfile));
      return familyProfile;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil utilisateur depuis le serveur:", error);
      // Si 404 pour familyProfile, cela signifie qu'il faut l'assurer (ensure)
      if (error.response && error.response.status === 404 && error.config.url.includes('/family/')) {
          const authUser = (await apiClient.get('/auth/me')).data;
           console.log("Profil familial non trouvé, tentative de création/synchronisation...");
           try {
               const ensuredProfile = await authService.ensureUserProfileInFamilyTree({
                   id: authUser.id,
                   name: `${authUser.firstName} ${authUser.lastName}`,
                   gmail: authUser.email,
               });
               localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(ensuredProfile));
               return ensuredProfile;
           } catch (ensureError) {
               console.error("Échec de ensureUserProfileInFamilyTree après 404:", ensureError);
               authService.logout(); // Déconnexion en cas d'erreur critique
               return null;
           }
      }
      authService.logout(); // Déconnexion en cas d'autre erreur critique
      return null;
    }
  },

  // Met à jour le profil de l'utilisateur DANS L'ARBRE généalogique (via /api/family/:id)
  updateCurrentUserProfileInFamilyTree: async (profileDataToUpdate) => {
    if (!profileDataToUpdate.id) {
      console.error("ID de profil manquant pour la mise à jour dans l'arbre");
      throw new Error("ID de profil manquant");
    }
    try {
      const response = await apiClient.put(`/family/${profileDataToUpdate.id}`, profileDataToUpdate);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil dans l'arbre:", error);
      throw error;
    }
  },
  
  // S'assure que l'utilisateur a un profil dans l'arbre, le crée/met à jour si nécessaire.
  // `profileDetails` peut contenir des infos de base comme name, gender, birthYear, etc.
  // L'ID utilisé sera celui de l'utilisateur authentifié.
  ensureUserProfileInFamilyTree: async (profileDetails) => {
    // profileDetails devrait au minimum contenir l'ID qui est l'ID d'authentification.
    // S'il manque d'autres infos, le backend les prendra depuis User ou mettra des défauts.
    try {
      const response = await apiClient.post('/family/ensure-profile', profileDetails);
      // Ne pas mettre à jour le cache ici, car ensure-profile est souvent appelé
      // dans un contexte où le cache sera mis à jour par la fonction appelante (login, register, fetch)
      return response.data;
    } catch (error) {
      console.error("Erreur lors de ensureUserProfileInFamilyTree:", error);
      throw error;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    // Pour une vérification plus robuste, on pourrait décoder le token et vérifier sa date d'expiration.
    // Mais pour une vérification simple côté client, la présence du token suffit souvent.
    // Le backend revalidera toujours le token.
    return !!token;
  }
};