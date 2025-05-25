import { uiStateService } from '../services/uiStateService';

export function renderRightSidebar() {
  const algorithmSteps = uiStateService.getAlgorithmSteps();

  // Générer la liste des étapes
  let stepsHtml = '';
  if (algorithmSteps.length > 0) {
    stepsHtml = algorithmSteps.map((step, index) =>
      `<li>${index + 1}. ${step}</li>`
    ).join('');
  } else {
    stepsHtml = '<li>Aucune étape à afficher</li>';
  }

  return `
    <div id="right-sidebar">
      <h3 class="sidebar-title">Processus</h3>
      <ul class="process-steps">
        ${stepsHtml}
      </ul>
    </div>
  `;
}
