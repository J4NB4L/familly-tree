// graph-view.js
import cytoscape from 'cytoscape';

export function initGraph(containerId, graphData) {
  const cy = cytoscape({
    container: document.getElementById(containerId),
    elements: graphData,
    style: [
        {
          selector: 'node',
          style: {
            'background-color': '#11479e',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '150px',      // augmenté
            'height': '150px',     // augmenté
            'font-size': '16px',   // pour mieux lire les labels
            'border-color': '#000',
            'border-width': '2px',
            'border-opacity': '0.5'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 6,
            'line-color': '#9dbaea',
            'target-arrow-color': '#9dbaea',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }      
    ],
    layout: {
      name: 'breadthfirst',
      directed: true,
      padding: 30
    }
  });

  return cy;
}

export function transformGraphData(familyData) {
  const nodes = familyData.map(person => ({
    data: { id: person.id.toString(), label: person.name }
  }));

  const edges = familyData
    .filter(person => person.pid !== null)
    .map(person => ({
      data: { id: `${person.pid}-${person.id}`, source: person.pid.toString(), target: person.id.toString() }
    }));

  return { nodes, edges };
}
