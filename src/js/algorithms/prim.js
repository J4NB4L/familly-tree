// js/algorithm/prim.js
import cytoscape from 'cytoscape';

export function initPrim(cy, startNode) {
  const prim = cy.elements().prim({
    root: startNode,
    directed: false
  });

  prim.edges().style({
    'line-color': 'red',
    'width': 3
  });
}
