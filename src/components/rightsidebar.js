// frontend/src/components/rightsidebar.js
import { uiStateService } from '../services/uiStateService';

export function renderRightSidebar() {
  const algorithmSteps = uiStateService.getAlgorithmSteps();

  let stepsHtml = '';
  if (algorithmSteps.length > 0) {
    stepsHtml = algorithmSteps.map((step, index) =>
      `<li>${index + 1}. ${step}</li>`
    ).join('');
  } else {
    stepsHtml = '<li>Aucune étape d\'algorithme à afficher. Sélectionnez un algorithme et des nœuds.</li>';
  }

  // Ajout d'un conteneur pour les détails de la personne sélectionnée dans l'arbre
  return `
    <div id="right-sidebar">
      <div class="info-card" style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h4>Détails de la Personne</h4>
        <p>Cliquez sur un nœud dans l'arbre généalogique pour voir les détails ici.</p>
      </div>
      <h3 class="sidebar-title">Processus d'Algorithme</h3>
      <ul class="process-steps" style="max-height: 300px; overflow-y: auto; padding-left: 20px;">
        ${stepsHtml}
      </ul>
    </div>
  `;
}