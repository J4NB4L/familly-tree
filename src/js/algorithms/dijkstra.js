// src/js/algorithms/dijkstra.js
import cytoscape from 'cytoscape';
import { uiStateService } from '../../services/uiStateService';

export function initDijkstra(cy, startNode, endNode) {
  uiStateService.clearAlgorithmSteps(); // This is correct

  // Add initial steps one by one
  uiStateService.addAlgorithmStep("Initialisation de l'algorithme de Dijkstra");
  uiStateService.addAlgorithmStep(`Nœud de départ: ${startNode.data('label')}, Nœud d'arrivée: ${endNode.data('label')}`);

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
    uiStateService.addAlgorithmStep(`Exploration du nœud ${minNode.data('label')} avec distance ${distances.get(minNode.id())}`);

    // Mettre à jour les distances des nœuds adjacents
    const neighbors = minNode.neighborhood().nodes().filter(n => !visited.has(n.id()));

    neighbors.forEach(neighbor => {
      const neighborId = neighbor.id();
      const edge = cy.elements().edges(`[source = "${minNode.id()}"][target = "${neighborId}"], [source = "${neighborId}"][target = "${minNode.id()}"]`);
      const weight = edge.data('weight') || 1;
      const distance = distances.get(minNode.id()) + weight;

      if (distance < distances.get(neighborId)) {
        distances.set(neighborId, distance);
        parent.set(neighborId, minNode.id());
        uiStateService.addAlgorithmStep(`Mise à jour de la distance du nœud ${neighbor.data('label')}: ${distances.get(neighborId)} → ${distance}`);

        edge.addClass('highlighted-dijkstra');
        setTimeout(() => {
          edge.removeClass('highlighted-dijkstra');
        }, 1000);
      }
    });
  }

  // Reconstruire le chemin du nœud de départ au nœud d'arrivée
  const path = [];
  let current = endNode.id();

  while (current !== null && current !== startNode.id()) {
    const parentId = parent.get(current);
    if (parentId === null) break;

    const edge = cy.elements().edges(`[source = "${parentId}"][target = "${current}"], [source = "${current}"][target = "${parentId}"]`);
    path.unshift(edge);
    current = parentId;
  }

  // Afficher le chemin trouvé
  if (path.length > 0) {
    path.forEach(edge => {
      edge.style({
        'line-color': 'red',
        'width': 5
      });
    });

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
    uiStateService.addAlgorithmStep(`Chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')} avec distance totale ${distances.get(endNode.id())}`);
  } else {
    console.log(`Aucun chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')}`);
    uiStateService.addAlgorithmStep(`Aucun chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')}`);
  }
  // No longer need to set all steps at the end, as they are added incrementally.

  return path;
}