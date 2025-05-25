import cytoscape from 'cytoscape';
import { uiStateService } from '../../services/uiStateService';

export function initDijkstra(cy, startNode, endNode) {
  uiStateService.clearAlgorithmSteps();

  // Initialiser le suivi des étapes
  const steps = [];
  steps.push("Initialisation de l'algorithme de Dijkstra");
  steps.push(`Nœud de départ: ${startNode.data('label')}, Nœud d'arrivée: ${endNode.data('label')}`);
  uiStateService.setAlgorithmSteps(steps);

  // Réinitialiser les styles
  cy.edges().style({
    'line-color': '#9dbaea',
    'width': 6
  });

  // Tous les nœuds du graphe
  const nodes = cy.nodes();

  // Maps pour suivre les distances et les parents
  const visited = new Map();
  const distances = new Map();
  const parent = new Map();

  // Initialisation des structures de données
  nodes.forEach(node => {
    const id = node.id();
    distances.set(id, id === startNode.id() ? 0 : Infinity);
    parent.set(id, null);
  });

  // Algorithme de Dijkstra
  while (true) {
    // Trouver le nœud non visité avec la distance minimale
    let minDistance = Infinity;
    let minNode = null;

    nodes.forEach(node => {
      const id = node.id();
      if (!visited.has(id) && distances.get(id) < minDistance) {
        minDistance = distances.get(id);
        minNode = node;
      }
    });

    // Si aucun nœud n'est accessible ou si nous avons atteint le nœud cible
    if (minNode === null || minNode.id() === endNode.id()) break;

    // Marquer le nœud comme visité
    visited.set(minNode.id(), true);
    steps.push(`Exploration du nœud ${minNode.data('label')} avec distance ${distances.get(minNode.id())}`);
    uiStateService.setAlgorithmSteps(steps);

    // Mettre à jour les distances des nœuds adjacents
    const neighbors = minNode.neighborhood().nodes().filter(n => !visited.has(n.id()));

    neighbors.forEach(neighbor => {
      const neighborId = neighbor.id();
      // Trouver l'arête entre minNode et neighbor
      const edge = cy.elements().edges(`[source = "${minNode.id()}"][target = "${neighborId}"], [source = "${neighborId}"][target = "${minNode.id()}"]`);

      // Dans un graphe non pondéré, la distance est 1; sinon utiliser le poids de l'arête
      const weight = edge.data('weight') || 1;
      const distance = distances.get(minNode.id()) + weight;

      if (distance < distances.get(neighborId)) {
        distances.set(neighborId, distance);
        parent.set(neighborId, minNode.id());
        steps.push(`Mise à jour de la distance du nœud ${neighbor.data('label')}: ${distances.get(neighborId)} → ${distance}`);
        uiStateService.setAlgorithmSteps(steps);

        // Animer le changement de couleur
        edge.addClass('highlighted-dijkstra');
        setTimeout(() => {
          edge.removeClass('highlighted-dijkstra');
        }, 1000); // Durée de l'animation
      }
    });
  }

  // Reconstruire le chemin du nœud de départ au nœud d'arrivée
  const path = [];
  let current = endNode.id();

  while (current !== null && current !== startNode.id()) {
    const parentId = parent.get(current);
    if (parentId === null) break; // Pas de chemin

    // Ajouter l'arête au chemin
    const edge = cy.elements().edges(`[source = "${parentId}"][target = "${current}"], [source = "${current}"][target = "${parentId}"]`);
    path.unshift(edge);

    current = parentId;
  }

  // Afficher le chemin trouvé
  if (path.length > 0) {
    path.forEach(edge => {
      edge.style({
        'line-color': 'red', // Couleur pour Dijkstra
        'width': 5
      });
    });

    // Animation facultative
    let delay = 0;
    const animationStep = 500;

    path.forEach(edge => {
      setTimeout(() => {
        edge.flashClass('highlighted-dijkstra', 1000);
      }, delay);
      delay += animationStep;
    });

    console.log(`Algorithme de Dijkstra: chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')} avec ${path.length} arêtes`);
    console.log(`Distance totale: ${distances.get(endNode.id())}`);
    steps.push(`Chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')} avec distance totale ${distances.get(endNode.id())}`);
  } else {
    console.log(`Aucun chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')}`);
    steps.push(`Aucun chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')}`);
  }
  uiStateService.setAlgorithmSteps(steps);

  return path;
}
