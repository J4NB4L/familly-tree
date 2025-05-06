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
  // Créer les nœuds
  const nodes = familyData.map(person => ({
    data: { 
      id: person.id.toString(), 
      label: person.name,
      gender: person.gender,
      birthYear: person.birthYear,
      img: person.img
    }
  }));
  
  // Créer les arêtes (enfant → parents)
  const edges = [];
  
  familyData.forEach(person => {
    // Si la personne a un père (pid), créer une arête de l'enfant vers le père
    if (person.pid !== null) {
      edges.push({
        data: { 
          id: `${person.id}-to-father-${person.pid}`, 
          source: person.id.toString(), 
          target: person.pid.toString(),
          relationship: 'child-to-father'
        }
      });
    }
    
    // Si la personne a une mère (mid), créer une arête de l'enfant vers la mère
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
  });
  
  return { nodes, edges };
}





//avec conJoint

// graph-view.js
// import cytoscape from 'cytoscape';

// export function initGraph(containerId, graphData) {
//   const cy = cytoscape({
//     container: document.getElementById(containerId),
//     elements: graphData,
//     style: [
//         {
//           selector: 'node',
//           style: {
//             'background-color': '#11479e',
//             'label': 'data(label)',
//             'color': '#fff',
//             'text-valign': 'center',
//             'text-halign': 'center',
//             'width': '150px',      // augmenté
//             'height': '150px',     // augmenté
//             'font-size': '16px',   // pour mieux lire les labels
//             'border-color': '#000',
//             'border-width': '2px',
//             'border-opacity': '0.5'
//           }
//         },
//         {
//           selector: 'edge',
//           style: {
//             'width': 6,
//             'line-color': '#9dbaea',
//             'target-arrow-color': '#9dbaea',
//             'target-arrow-shape': 'triangle',
//             'curve-style': 'bezier'
//           }
//         },
//         {
//           selector: 'edge[relationship = "partner"]',
//           style: {
//             'width': 6,
//             'line-color': '#ff69b4',  // Rose pour les relations conjugales
//             'line-style': 'dashed',
//             'target-arrow-shape': 'none',
//             'curve-style': 'bezier'
//           }
//         }
//     ],
//     layout: {
//       name: 'breadthfirst',
//       directed: true,
//       padding: 30
//     }
//   });

//   return cy;
// }

// export function transformGraphData(familyData) {
//   // Créer les nœuds
//   const nodes = familyData.map(person => ({
//     data: { 
//       id: person.id.toString(), 
//       label: person.name,
//       gender: person.gender,
//       birthYear: person.birthYear,
//       img: person.img
//     }
//   }));
  
//   // Créer les arêtes (enfant → parents)
//   const edges = [];
  
//   familyData.forEach(person => {
//     // Si la personne a un père (pid), créer une arête de l'enfant vers le père
//     if (person.pid !== null) {
//       edges.push({
//         data: { 
//           id: `${person.id}-to-father-${person.pid}`, 
//           source: person.id.toString(), 
//           target: person.pid.toString(),
//           relationship: 'child-to-father'
//         }
//       });
//     }
    
//     // Si la personne a une mère (mid), créer une arête de l'enfant vers la mère
//     if (person.mid !== null) {
//       edges.push({
//         data: { 
//           id: `${person.id}-to-mother-${person.mid}`, 
//           source: person.id.toString(), 
//           target: person.mid.toString(),
//           relationship: 'child-to-mother'
//         }
//       });
//     }
    
//     // Ajouter des arêtes pour les relations conjugales (pids)
//     if (person.pids && person.pids.length > 0) {
//       // Pour chaque conjoint, créer une arête
//       person.pids.forEach(partnerId => {
//         // Créer l'arête seulement si l'ID de la personne est inférieur à celui du partenaire
//         // pour éviter les arêtes en double
//         if (parseInt(person.id) < parseInt(partnerId)) {
//           edges.push({
//             data: {
//               id: `${person.id}-partner-${partnerId}`,
//               source: person.id.toString(),
//               target: partnerId.toString(),
//               relationship: 'partner'
//             }
//           });
//         }
//       });
//     }
//   });
  
//   return { nodes, edges };
// }