// frontend/src/services/familyDataService.js
import apiClient from './api';
import { authService } from './authService'; // Pour obtenir l'ID de l'utilisateur courant si besoin

export const familyDataService = {
  getAllFamilyData: async () => {
    try {
      const response = await apiClient.get('/family');
      return response.data;
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
      return null;
    }
  },

  // Met à jour les données d'UNE personne dans l'arbre.
  // Cette fonction est générique. Pour mettre à jour le profil de l'utilisateur connecté,
  // il est préférable d'utiliser `authService.updateCurrentUserProfileInFamilyTree`.
  updatePersonInFamilyData: async (personToUpdate) => {
    if (!personToUpdate || !personToUpdate.id) {
      console.error("Données de personne invalides ou ID manquant pour la mise à jour.");
      throw new Error("Données de personne invalides ou ID manquant.");
    }
    try {
      const response = await apiClient.put(`/family/${personToUpdate.id}`, personToUpdate);
      
      // Si la personne mise à jour est l'utilisateur actuellement connecté, mettre à jour son cache
      const currentUser = authService.getCurrentUserProfile();
      if (currentUser && currentUser.id === response.data.id) {
        localStorage.setItem('userProfileCache', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to update person with id ${personToUpdate.id}:`, error);
      throw error;
    }
  },

  // Obtient les données filtrées pour la vue "personnelle" de l'utilisateur connecté
  getPersonalFamilyData: async () => {
    try {
      const response = await apiClient.get('/family/personal');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch personal family data:", error);
      return [];
    }
  },

  // Les fonctions spécifiques addSpouse, setFather etc. sont supprimées.
  // La logique de modification des relations est maintenant gérée par la soumission
  // du formulaire de profil qui appelle `updatePersonInFamilyData` (ou via authService pour le user courant)
  // avec l'objet personne complet incluant les `fid`, `mid`, `pids` mis à jour.
};