// frontend/src/components/navbar.js
import { authService } from '../services/authService';

export function renderNavbar() {
  // Utiliser le profil mis en cache. Le router se charge de le rafraîchir au besoin.
  const userProfile = authService.getCurrentUserProfile(); 

  let userSectionHtml = '<a href="/login" data-link>Connexion</a>'; // Par défaut
  
  if (userProfile && userProfile.id) { // Vérifier si l'utilisateur est "connecté" et a un profil
    userSectionHtml = `
      <a href="/profile" data-link class="user-info">
        <img src="${userProfile.img || '/assets/avatars/default.svg'}" alt="Photo de ${userProfile.name || 'Utilisateur'}" class="user-avatar" />
        <span>${userProfile.name || 'Mon Profil'}</span>
      </a>
    `;
  }

  return `
    <div id="navbar">
      <h1>Arbre Généalogique Familial</h1>
      <div id="navbar-menu">
        <a href="/" data-link>Accueil</a>
        ${userSectionHtml}
      </div>
    </div>
  `;
}