// frontend/src/services/familyDataService.js
import apiClient from './api';
import { authService } from './authService'; // Utilisé pour mettre à jour le cache si l'utilisateur modifie son propre profil via cette voie (moins direct)

export const familyDataService = {
  getAllFamilyData: async () => {
    try {
      const response = await apiClient.get('/family');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch all family data:", error);
      return [];
    }
  },

  getPersonById: async (personId) => {
    if (!personId) {
        console.warn("getPersonById: personId is undefined or null");
        return null;
    }
    try {
      const response = await apiClient.get(`/family/${personId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch person with id ${personId}:`, error);
      // Si l'erreur est 404, retourner null est approprié.
      // Pour d'autres erreurs, on pourrait vouloir les relancer ou les gérer différemment.
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error; // Relancer les autres erreurs pour une gestion plus haut niveau si nécessaire
    }
  },

  updatePersonInFamilyData: async (personToUpdate) => {
    if (!personToUpdate || !personToUpdate.id) {
      console.error("Données de personne invalides ou ID manquant pour la mise à jour.");
      throw new Error("Données de personne invalides ou ID manquant.");
    }
    try {
      const response = await apiClient.put(`/family/${personToUpdate.id}`, personToUpdate);
      
      const currentUser = authService.getCurrentUserProfile();
      if (currentUser && currentUser.id === response.data.id) {
        // Si la personne mise à jour est l'utilisateur actuellement connecté,
        // son profil est mis à jour par `authService.updateCurrentUserProfileInFamilyTree`.
        // Mais si `updatePersonInFamilyData` est appelé directement pour le user (ex: modif d'un enfant qui met à jour le user comme parent),
        // il faut s'assurer que le cache du user est potentiellement mis à jour.
        // Le plus sûr est de re-fetch le profil user après des opérations qui pourraient l'affecter indirectement.
        // Pour l'instant, on suppose que si c'est le user, c'est géré par authService.
        // Si c'est un enfant mis à jour, le profil user ne change pas directement (sauf si `pids` etc.).
        // La bonne pratique serait que le composant ProfilePage re-fetch son propre profil si des opérations externes le modifient.
        // Pour le moment, on met à jour le cache ici si l'ID correspond, mais c'est une simplification.
        localStorage.setItem('userProfileCache', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to update person with id ${personToUpdate.id}:`, error);
      throw error;
    }
  },

  getPersonalFamilyData: async () => {
    try {
      // L'endpoint /family/personal retourne les données basées sur le token de l'utilisateur
      const response = await apiClient.get('/family/personal');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch personal family data:", error);
      return []; // Retourner un tableau vide en cas d'erreur pour éviter de casser le rendu
    }
  },

  // Helper pour retirer un enfant de la parentalité de l'utilisateur actuel
  // N'est plus explicitement nécessaire car la logique est dans le composant profile.js
  // qui appelle updatePersonInFamilyData sur l'enfant.
  // dissociateChild: async (childId, parentUserId, parentGender) => { ... }
};