//---> PATH: /c/Users/PC/School/RO/TP/TP1/frontend/src/js/family-tree/graph-view.js
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
      name: 'breadthfirst', // Consider 'cose' or 'dagre' for more complex family trees
      directed: true,
      padding: 30
    }
  });

  return cy;
}

export function transformGraphData(familyData) {
  // Ensure familyData is an array
  if (!Array.isArray(familyData)) {
    console.error("transformGraphData expects an array, received:", familyData);
    return { nodes: [], edges: [] }; // Return empty graph data
  }

  const nodes = familyData.map(person => {
    // Ensure person and person.id are valid before creating a node
    if (!person || typeof person.id === 'undefined' || person.id === null) {
      console.warn('Skipping person with invalid or missing ID:', person);
      return null; // This entry will be filtered out
    }
    return {
      data: {
        id: person.id.toString(),
        label: person.name || 'Unnamed', // Fallback for missing name
        gender: person.gender,
        birthYear: person.birthYear,
        img: person.img
      }
    };
  }).filter(node => node !== null); // Filter out any null entries due to invalid persons

  const edges = [];

  familyData.forEach(person => {
    // Ensure person and person.id are valid before processing edges
    if (!person || typeof person.id === 'undefined' || person.id === null) {
      return; // Skip this person if their ID is invalid
    }
    const personIdStr = person.id.toString();

    // Father to child edge
    if (typeof person.fid !== 'undefined' && person.fid !== null) {
      const fatherIdStr = person.fid.toString();
      edges.push({
        data: {
          id: `${fatherIdStr}-to-child-${personIdStr}`,
          source: fatherIdStr,
          target: personIdStr,
          relationship: 'father-to-child'
        }
      });
    }

    // Mother to child edge
    if (typeof person.mid !== 'undefined' && person.mid !== null) {
      const motherIdStr = person.mid.toString();
      edges.push({
        data: {
          id: `${motherIdStr}-to-child-${personIdStr}`,
          source: motherIdStr,
          target: personIdStr,
          relationship: 'mother-to-child'
        }
      });
    }

    // Partner edges
    // Ensure person.pids exists, is an array, and has elements
    if (person.pids && Array.isArray(person.pids) && person.pids.length > 0) {
      person.pids.forEach(partnerId => {
        // CRITICAL CHECK: Ensure partnerId is valid before using it
        if (typeof partnerId === 'undefined' || partnerId === null) {
          console.warn(`Invalid partnerId (value: ${partnerId}) found in pids for person ${person.name || 'Unnamed'} (ID: ${personIdStr}). Skipping this partner edge.`);
          return; // Skip this iteration for the invalid partnerId
        }
        const partnerIdStr = partnerId.toString();

        // Parse IDs as numbers for comparison to ensure correct ordering for unique edge creation
        const currentPersonIdNum = parseInt(personIdStr, 10);
        const partnerIdNum = parseInt(partnerIdStr, 10);

        // Create edge only if current person's ID is less than partner's ID
        // This prevents duplicate partner edges (e.g., A-B and B-A)
        if (!isNaN(currentPersonIdNum) && !isNaN(partnerIdNum) && currentPersonIdNum < partnerIdNum) {
          edges.push({
            data: {
              id: `${personIdStr}-partner-${partnerIdStr}`,
              source: personIdStr,
              target: partnerIdStr,
              relationship: 'partner'
            }
          });
        }
      });
    }
  });

  return { nodes, edges };
}
// END OF FILE: src/js/family-tree/graph-view.js