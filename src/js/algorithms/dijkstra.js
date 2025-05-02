// js/algorithm/dijkstra.js
import cytoscape from 'cytoscape';

export function initDijkstra(cy, startNode, endNode) {
  const dijkstra = cy.elements().dijkstra({
    root: startNode,
    directed: false
  });

  const pathToEnd = dijkstra.pathTo(endNode);

  if (pathToEnd.length > 0) {
    pathToEnd.edges().style({
      'line-color': 'red',
      'width': 3
    });
  }
}
