import cytoscape from 'cytoscape';
import { uiStateService } from '../../services/uiStateService';

export function initPrim(cy, startNode) {
  uiStateService.clearAlgorithmSteps();

  // Initialiser le suivi des étapes
  const steps = [];
  steps.push("Initialisation de l'algorithme de Prim");
  steps.push(`Nœud de départ: ${startNode.data('label')}`);
  uiStateService.setAlgorithmSteps(steps);

  // Réinitialiser les styles
  cy.edges().style({
    'line-color': '#9dbaea',
    'width': 6
  });

  // Tous les nœuds du graphe
  const nodes = cy.nodes();
  const totalNodes = nodes.length;

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

  // Algorithme de Prim
  for (let i = 0; i < totalNodes; i++) {
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

    // Si aucun nœud n'est accessible, le graphe n'est pas connecté
    if (minNode === null) break;

    // Marquer le nœud comme visité
    visited.set(minNode.id(), true);
    steps.push(`Ajout du nœud ${minNode.data('label')} à l'arbre couvrant minimal`);
    uiStateService.setAlgorithmSteps(steps);

    // Mettre à jour les distances des nœuds adjacents
    const neighbors = minNode.neighborhood().nodes().filter(n => !visited.has(n.id()));

    neighbors.forEach(neighbor => {
      const neighborId = neighbor.id();
      // Dans un graphe non pondéré, la distance entre deux nœuds adjacents est 1
      // Dans votre cas, vous pourriez utiliser un attribut weight des arêtes
      const edge = cy.elements().edges(`[source = "${minNode.id()}"][target = "${neighborId}"], [source = "${neighborId}"][target = "${minNode.id()}"]`);
      const weight = edge.data('weight') || 1;

      if (weight < distances.get(neighborId)) {
        distances.set(neighborId, weight);
        parent.set(neighborId, minNode.id());
        steps.push(`Mise à jour de la distance du nœud ${neighbor.data('label')}: ${distances.get(neighborId)} → ${weight}`);
        uiStateService.setAlgorithmSteps(steps);

        // Animer le changement de couleur
        edge.addClass('highlighted-prim');
        setTimeout(() => {
          edge.removeClass('highlighted-prim');
        }, 1000); // Durée de l'animation
      }
    });
  }

  // Colorer les arêtes de l'arbre couvrant minimal
  nodes.forEach(node => {
    const nodeId = node.id();
    const parentId = parent.get(nodeId);

    if (parentId !== null) {
      const edge = cy.elements().edges(`[source = "${parentId}"][target = "${nodeId}"], [source = "${nodeId}"][target = "${parentId}"]`);
      edge.style({
        'line-color': 'green', // Couleur pour Prim
        'width': 5
      });
    }
  });

  // Animation facultative pour montrer le processus
  let delay = 0;
  const animationStep = 500; // 500ms entre chaque étape

  nodes.forEach(node => {
    const nodeId = node.id();
    const parentId = parent.get(nodeId);

    if (parentId !== null) {
      setTimeout(() => {
        const edge = cy.elements().edges(`[source = "${parentId}"][target = "${nodeId}"], [source = "${nodeId}"][target = "${parentId}"]`);
        edge.flashClass('highlighted-prim', 1000);
      }, delay);
      delay += animationStep;
    }
  });

  steps.push(`Arbre couvrant minimal construit avec ${visited.size} nœuds`);
  uiStateService.setAlgorithmSteps(steps);
}
