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
          'width': '150px',
          'height': '150px',
          'font-size': '16px',
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
      },
      {
        selector: 'edge[relationship = "partner"]',
        style: {
          'width': 6,
          'line-color': '#ff69b4',
          'line-style': 'dashed',
          'target-arrow-shape': 'none',
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
    data: {
      id: person.id.toString(),
      label: person.name,
      gender: person.gender,
      birthYear: person.birthYear,
      img: person.img
    }
  }));

  const edges = [];

  familyData.forEach(person => {
    // Child to father edge
    if (person.fid !== null) {
      edges.push({
        data: {
          id: `${person.id}-to-father-${person.fid}`,
          source: person.id.toString(),
          target: person.fid.toString(),
          relationship: 'child-to-father'
        }
      });
    }

    // Child to mother edge
    if (person.mid !== null) {
      edges.push({
        data: {
          id: `${person.id}-to-mother-${person.mid}`,
          source: person.id.toString(),
          target: person.mid.toString(),
          relationship: 'child-to-mother'
        }
      });
    }

    // Partner edges
    if (person.pids && person.pids.length > 0) {
      person.pids.forEach(partnerId => {
        if (parseInt(person.id) < parseInt(partnerId)) {
          edges.push({
            data: {
              id: `${person.id}-partner-${partnerId}`,
              source: person.id.toString(),
              target: partnerId.toString(),
              relationship: 'partner'
            }
          });
        }
      });
    }
  });

  return { nodes, edges };
}
