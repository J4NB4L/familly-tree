// src/js/algorithms/prim.js
import cytoscape from 'cytoscape';
import { uiStateService } from '../../services/uiStateService';

export function initPrim(cy, startNode) {
  uiStateService.clearAlgorithmSteps();

  // Add initial steps
  uiStateService.addAlgorithmStep("Initialisation de l'algorithme de Prim");
  uiStateService.addAlgorithmStep(`Nœud de départ: ${startNode.data('label')}`);

  // Réinitialiser les styles
  cy.edges().style({
    'line-color': '#9dbaea',
    'width': 6
  });

  // Tous les nœuds du graphe
  const allNodes = cy.nodes(); // Renamed to avoid confusion
  const totalNodes = allNodes.length;

  // Maps pour suivre les "keys" (min weight to connect to MST) et les parents in MST
  const inMST = new Map();    // Tracks if a node is already in the MST
  const key = new Map();      // Min weight to connect this node to the MST
  const parentEdge = new Map(); // Stores the edge used to connect the node to its parent in MST

  // Initialisation des structures de données
  allNodes.forEach(node => {
    const id = node.id();
    key.set(id, Infinity);
    inMST.set(id, false);
    parentEdge.set(id, null);
  });

  // Start with the given startNode
  key.set(startNode.id(), 0);

  // Algorithme de Prim
  for (let count = 0; count < totalNodes; count++) {
    // Trouver le nœud non dans MST avec la clé (key) minimale
    let minKey = Infinity;
    let uNode = null; // The node to be added to MST

    allNodes.forEach(node => {
      const id = node.id();
      if (!inMST.get(id) && key.get(id) < minKey) {
        minKey = key.get(id);
        uNode = node;
      }
    });

    // Si aucun nœud n'est accessible ou tous les nœuds sont dans MST
    if (uNode === null) break;

    // Marquer le nœud comme faisant partie du MST
    inMST.set(uNode.id(), true);
    uiStateService.addAlgorithmStep(`Ajout du nœud ${uNode.data('label')} à l'arbre couvrant minimal`);

    // Mettre à jour les valeurs de clé des nœuds adjacents au nœud choisi
    const neighbors = uNode.neighborhood().filter(el => el.isNode() && !inMST.get(el.id()));

    neighbors.forEach(vNode => { // vNode is an adjacent node
      const vNodeId = vNode.id();
      // Trouver l'arête entre uNode et vNode
      const edgeConnecting = uNode.edgesWith(vNode).filter(e => e.source().id() === uNode.id() && e.target().id() === vNodeId || e.source().id() === vNodeId && e.target().id() === uNode.id());
      
      if (edgeConnecting.length > 0) {
        const weight = edgeConnecting.first().data('weight') || 1;

        if (weight < key.get(vNodeId)) {
          key.set(vNodeId, weight);
          parentEdge.set(vNodeId, edgeConnecting.first()); // Store the edge itself
          uiStateService.addAlgorithmStep(`Mise à jour de la clé du nœud ${vNode.data('label')} à ${weight} via ${uNode.data('label')}`);
          
          // Animer le changement de couleur (de l'arête qui est maintenant le meilleur candidat)
          // This animation might be too noisy if edges are reconsidered often.
          // For Prim, typically edges are highlighted when *chosen* for the MST.
        }
      }
    });
  }

  // Colorer les arêtes de l'arbre couvrant minimal et animer
  let delay = 0;
  const animationStep = 500;
  const mstEdgesCollected = [];

  parentEdge.forEach((edge, nodeId) => {
    if (edge !== null) { // Edges that are part of the MST
      mstEdgesCollected.push(edge);
      edge.style({
        'line-color': 'green',
        'width': 5
      });
      setTimeout(() => {
        edge.flashClass('highlighted-prim', 1000);
      }, delay);
      delay += animationStep;
    }
  });
  
  uiStateService.addAlgorithmStep(`Arbre couvrant minimal construit avec ${mstEdgesCollected.length} arêtes (et ${Array.from(inMST.values()).filter(Boolean).length} nœuds).`);
  // Note: For a connected graph, mstEdgesCollected.length should be totalNodes - 1 if totalNodes > 0.
}