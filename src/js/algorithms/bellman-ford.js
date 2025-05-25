// src/js/algorithms/bellman-ford.js
import cytoscape from 'cytoscape';
import { uiStateService } from '../../services/uiStateService';

export function initBellmanFord(cy, startNode, endNode) {
  uiStateService.clearAlgorithmSteps();

  // Add initial steps one by one
  uiStateService.addAlgorithmStep("Initialisation de l'algorithme de Bellman-Ford");
  uiStateService.addAlgorithmStep(`Nœud de départ: ${startNode.data('label')}, Nœud d'arrivée: ${endNode.data('label')}`);

  // Réinitialiser les styles
  cy.edges().style({
    'line-color': '#9dbaea',
    'width': 6
  });

  // Tous les nœuds et arêtes du graphe
  const nodes = cy.nodes();
  const edges = cy.edges();

  // Maps pour suivre les distances et les parents
  const distances = new Map();
  const parent = new Map();

  // Initialisation des structures de données
  nodes.forEach(node => {
    const id = node.id();
    distances.set(id, id === startNode.id() ? 0 : Infinity);
    parent.set(id, null);
  });

  // Algorithme de Bellman-Ford
  const V = nodes.length;

  // Relaxation des arêtes V-1 fois
  for (let i = 0; i < V - 1; i++) {
    uiStateService.addAlgorithmStep(`Itération ${i + 1}/${V - 1} - Relaxation de toutes les arêtes`);

    edges.forEach(edge => {
      const source = edge.source().id();
      const target = edge.target().id();
      const weight = edge.data('weight') || 1;

      // Relaxation dans les deux sens car le graphe est non dirigé
      if (distances.get(source) !== Infinity && distances.get(source) + weight < distances.get(target)) {
        distances.set(target, distances.get(source) + weight);
        parent.set(target, source);
        uiStateService.addAlgorithmStep(`Mise à jour de la distance du nœud ${cy.getElementById(target).data('label')}: ${distances.get(source) + weight}`); // Corrected: Displaying the new distance

        edge.addClass('highlighted-bellman-ford');
        setTimeout(() => {
          edge.removeClass('highlighted-bellman-ford');
        }, 1000);
      }

      if (distances.get(target) !== Infinity && distances.get(target) + weight < distances.get(source)) {
        distances.set(source, distances.get(target) + weight);
        parent.set(source, target);
        uiStateService.addAlgorithmStep(`Mise à jour de la distance du nœud ${cy.getElementById(source).data('label')}: ${distances.get(target) + weight}`); // Corrected: Displaying the new distance
        
        edge.addClass('highlighted-bellman-ford');
        setTimeout(() => {
          edge.removeClass('highlighted-bellman-ford');
        }, 1000);
      }
    });
  }

  // Vérification des cycles négatifs
  let hasNegativeCycle = false;
  edges.forEach(edge => {
    const source = edge.source().id();
    const target = edge.target().id();
    const weight = edge.data('weight') || 1;

    if (distances.get(source) !== Infinity && distances.get(source) + weight < distances.get(target)) {
      hasNegativeCycle = true;
    }
    if (distances.get(target) !== Infinity && distances.get(target) + weight < distances.get(source)) {
      hasNegativeCycle = true;
    }
  });

  if (hasNegativeCycle) {
    console.warn("Le graphe contient un cycle de poids négatif!");
    uiStateService.addAlgorithmStep("Cycle négatif détecté dans le graphe");
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
        'line-color': 'blue', 
        'width': 5
      });
    });

    let delay = 0;
    const animationStep = 500;
    path.forEach(edge => {
      setTimeout(() => {
        edge.flashClass('highlighted-bellman-ford', 1000);
      }, delay);
      delay += animationStep;
    });

    console.log(`Algorithme de Bellman-Ford: chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')} avec ${path.length} arêtes`);
    console.log(`Distance totale: ${distances.get(endNode.id())}`);
    uiStateService.addAlgorithmStep(`Chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')} avec distance totale ${distances.get(endNode.id())}`);
  } else {
    console.log(`Aucun chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')}`);
    uiStateService.addAlgorithmStep(`Aucun chemin trouvé de ${startNode.data('label')} à ${endNode.data('label')}`);
  }

  return path;
}