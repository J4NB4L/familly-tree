//---> PATH: /c/Users/PC/School/RO/TP/TP1/frontend/src/js/family-tree/graph-view.js
import cytoscape from 'cytoscape';

export function initGraph(containerId, graphData) { // graphData vient de transformGraphData
  const cy = cytoscape({
    container: document.getElementById(containerId),
    elements: graphData, // elements est déjà { nodes: [...], edges: [...] }
    style: [
      // ... (styles inchangés, s'assurent juste que 'data(id)' est bien l'UUID string)
      {
        selector: 'node',
        style: {
          'background-color': '#11479e',
          'label': 'data(label)', // Assurez-vous que label est bien défini dans transformGraphData
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': '100px', // Ajusté pour potentiellement plus de texte/nœuds
          'height': '100px',
          'font-size': '12px', // Ajusté
          'border-color': '#000',
          'border-width': '1px',
          'border-opacity': '0.5',
          'shape': 'ellipse' // ou 'roundrectangle'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3, // Ajusté
          'line-color': '#9dbaea',
          'target-arrow-color': '#9dbaea',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      },
      {
        selector: 'edge[relationship = "partner"]', // Style pour les arêtes de conjoints
        style: {
          'line-color': '#ff69b4', // Rose pour conjoints
          'line-style': 'dashed',
          'target-arrow-shape': 'none' // Pas de flèche pour relation symétrique
        }
      }
    ],
    layout: {
      name: 'cose', // COSE est souvent meilleur pour les graphes sociaux/réseaux
      idealEdgeLength: 100,
      nodeOverlap: 20,
      refresh: 20,
      fit: true,
      padding: 30,
      randomize: false,
      componentSpacing: 100,
      nodeRepulsion: 400000,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0
    }
  });
  return cy;
}

// Transforme les données brutes de l'API (FamilyPerson[]) en un format pour Cytoscape
export function transformGraphData(familyDataArray) { // Renommé pour clarté
  if (!Array.isArray(familyDataArray)) {
    console.error("transformGraphData expects an array, received:", familyDataArray);
    return { nodes: [], edges: [] };
  }

  const nodes = familyDataArray.map(person => {
    if (!person || typeof person.id !== 'string' || person.id === '') { // ID est UUID string
      console.warn('Skipping person with invalid or missing ID (must be UUID string):', person);
      return null;
    }
    return {
      data: {
        id: person.id, // UUID string
        label: person.name || 'Unnamed',
        gender: person.gender,
        birthYear: person.birthYear,
        img: person.img
        // Ajoute d'autres données si tu veux les utiliser dans les styles ou les popups
      }
    };
  }).filter(node => node !== null);

  const edges = [];
  const existingEdges = new Set(); // Pour éviter les doublons d'arêtes de partenariat

  familyDataArray.forEach(person => {
    if (!person || typeof person.id !== 'string' || person.id === '') return;

    const personId = person.id;

    // Arêtes parent-enfant (dirigées du parent vers l'enfant)
    if (person.fid) { // fid est un UUID string du père
      edges.push({ data: { id: `edge-${person.fid}-to-${personId}`, source: person.fid, target: personId, relationship: 'parent-child' } });
    }
    if (person.mid) { // mid est un UUID string de la mère
      edges.push({ data: { id: `edge-${person.mid}-to-${personId}`, source: person.mid, target: personId, relationship: 'parent-child' } });
    }

    // Arêtes de partenariat (non dirigées)
    if (person.pids && Array.isArray(person.pids)) {
      person.pids.forEach(partnerId => { // partnerId est un UUID string
        if (typeof partnerId !== 'string' || partnerId === '') return;

        // Créer un ID d'arête unique pour éviter les doublons (A-B et B-A)
        const edgeId = [personId, partnerId].sort().join('-');
        if (!existingEdges.has(edgeId)) {
          edges.push({ data: { id: `edge-${edgeId}`, source: personId, target: partnerId, relationship: 'partner' } });
          existingEdges.add(edgeId);
        }
      });
    }
  });

  return { nodes, edges };
}