// src/js/algorithms/kruskal.js
import cytoscape from 'cytoscape';
import { uiStateService } from '../../services/uiStateService';

export function initKruskal(cy, startNode) { // startNode is passed but not used by Kruskal's core logic
  uiStateService.clearAlgorithmSteps();

  // Add initial steps
  uiStateService.addAlgorithmStep("Initialisation de l'algorithme de Kruskal");
  const edgesInGraph = cy.edges(); // Renamed to avoid conflict with edgesArray later
  uiStateService.addAlgorithmStep(`${edgesInGraph.length} arêtes à examiner`);

  // Réinitialiser les styles
  cy.edges().style({
    'line-color': '#9dbaea',
    'width': 6
  });

  // Structure pour Union-Find
  const parents = new Map();
  const ranks = new Map();

  function find(nodeId) { // Parameter is nodeId
    if (parents.get(nodeId) !== nodeId) {
      parents.set(nodeId, find(parents.get(nodeId)));
    }
    return parents.get(nodeId);
  }

  function union(xId, yId) { // Parameters are node IDs
    const rootX = find(xId);
    const rootY = find(yId);

    if (rootX === rootY) return false;

    if (ranks.get(rootX) < ranks.get(rootY)) {
      parents.set(rootX, rootY);
    } else if (ranks.get(rootX) > ranks.get(rootY)) {
      parents.set(rootY, rootX);
    } else {
      parents.set(rootY, rootX);
      ranks.set(rootX, ranks.get(rootX) + 1);
    }
    return true;
  }

  // Initialiser Union-Find
  cy.nodes().forEach(node => {
    const id = node.id();
    parents.set(id, id);
    ranks.set(id, 0);
  });

  // Collecter toutes les arêtes avec leurs poids
  const edgesArray = [];
  cy.edges().forEach(edge => {
    edgesArray.push({
      edgeElement: edge, // Store the Cytoscape edge element
      sourceId: edge.source().id(),
      targetId: edge.target().id(),
      weight: edge.data('weight') || 1 // Default weight if none specified
    });
  });

  // Trier les arêtes par poids croissant
  edgesArray.sort((a, b) => a.weight - b.weight);
  uiStateService.addAlgorithmStep("Arêtes triées par poids croissant");

  // Algorithme de Kruskal
  const mstEdges = []; // Array to store Cytoscape edge elements of the MST

  for (const edgeData of edgesArray) {
    const { edgeElement, sourceId, targetId, weight } = edgeData;

    // Si l'ajout de cette arête ne crée pas de cycle
    if (find(sourceId) !== find(targetId)) {
      union(sourceId, targetId);
      mstEdges.push(edgeElement);
      uiStateService.addAlgorithmStep(`Ajout de l'arête ${cy.getElementById(sourceId).data('label')}-${cy.getElementById(targetId).data('label')} (poids ${weight}) à l'arbre couvrant minimal`);

      // Colorer l'arête
      edgeElement.style({
        'line-color': 'purple',
        'width': 5
      });

      // Animer le changement de couleur
      edgeElement.addClass('highlighted-kruskal');
      setTimeout(() => {
        edgeElement.removeClass('highlighted-kruskal');
      }, 1000);
    }
  }

  // Animation facultative
  let delay = 0;
  const animationStep = 500;
  mstEdges.forEach(edge => {
    setTimeout(() => {
      edge.flashClass('highlighted-kruskal', 1000);
    }, delay);
    delay += animationStep;
  });

  // Ajouter des logs pour débogage
  console.log(`Algorithme de Kruskal: ${mstEdges.length} arêtes dans l'arbre couvrant minimal`);
  uiStateService.addAlgorithmStep(`Arbre couvrant minimal construit avec ${mstEdges.length} arêtes`);

  return mstEdges; // Return the array of Cytoscape edge elements forming the MST
}