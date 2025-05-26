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

  return `
    <div id="right-sidebar">
      <h3 class="sidebar-title">Processus d'Algorithme</h3>
      <ul class="process-steps" style="padding-left: 20px;">
        ${stepsHtml}
      </ul>
    </div>
  `;
}