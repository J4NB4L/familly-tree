// js/algorithm/kruskal.js
import cytoscape from 'cytoscape';

export function initKruskal(cy, startNode) {
  const kruskal = cy.elements().kruskal({
    directed: false
  });

  kruskal.edges().style({
    'line-color': 'red',
    'width': 3
  });
}
