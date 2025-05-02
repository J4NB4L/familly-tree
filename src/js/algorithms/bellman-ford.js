// js/algorithm/bellman-ford.js
import cytoscape from 'cytoscape';

export function initBellmanFord(cy, startNode, endNode) {
  const bellmanFord = cy.elements().bellmanFord({
    root: startNode,
    directed: false
  });

  const pathToEnd = bellmanFord.pathTo(endNode);

  if (pathToEnd.length > 0) {
    pathToEnd.edges().style({
      'line-color': 'red',
      'width': 3
    });
  }
}
