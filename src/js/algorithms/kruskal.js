import cytoscape from 'cytoscape';
import { uiStateService } from '../../services/uiStateService';

export function initKruskal(cy, startNode) {
  uiStateService.clearAlgorithmSteps();

  // Initialiser le suivi des étapes
  const steps = [];
  steps.push("Initialisation de l'algorithme de Kruskal");
  const edges = cy.edges();
  steps.push(`${edges.length} arêtes à examiner`);
  uiStateService.setAlgorithmSteps(steps);

  // Réinitialiser les styles
  cy.edges().style({
    'line-color': '#9dbaea',
    'width': 6
  });

  // Structure pour Union-Find
  const parents = new Map();
  const ranks = new Map();

  // Fonction Find pour Union-Find
  function find(node) {
    if (parents.get(node) !== node) {
      parents.set(node, find(parents.get(node)));
    }
    return parents.get(node);
  }

  // Fonction Union pour Union-Find
  function union(x, y) {
    const rootX = find(x);
    const rootY = find(y);

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
      edge: edge,
      source: edge.source().id(),
      target: edge.target().id(),
      weight: edge.data('weight') || 1
    });
  });

  // Trier les arêtes par poids croissant
  edgesArray.sort((a, b) => a.weight - b.weight);
  steps.push("Arêtes triées par poids croissant");
  uiStateService.setAlgorithmSteps(steps);

  // Algorithme de Kruskal
  const mstEdges = [];

  for (const edgeData of edgesArray) {
    const { edge, source, target } = edgeData;

    // Si l'ajout de cette arête ne crée pas de cycle
    if (find(source) !== find(target)) {
      union(source, target);
      mstEdges.push(edge);
      steps.push(`Ajout de l'arête ${cy.getElementById(source).data('label')}-${cy.getElementById(target).data('label')} de poids ${edgeData.weight} à l'arbre couvrant minimal`);
      uiStateService.setAlgorithmSteps(steps);

      // Colorer l'arête
      edge.style({
        'line-color': 'purple', // Couleur pour Kruskal
        'width': 5
      });

      // Animer le changement de couleur
      edge.addClass('highlighted-kruskal');
      setTimeout(() => {
        edge.removeClass('highlighted-kruskal');
      }, 1000); // Durée de l'animation
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
  steps.push(`Arbre couvrant minimal construit avec ${mstEdges.length} arêtes`);
  uiStateService.setAlgorithmSteps(steps);

  return mstEdges;
}
