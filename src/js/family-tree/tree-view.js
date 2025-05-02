// family-tree/tree-view.js
import OrgChart from '@balkangraph/orgchart.js';

export function initFamilyTree(containerId, familyData) {
  // Configuration avancée
  const chart = new OrgChart(document.getElementById(containerId), {
    // Mode "famille" pour un arbre généalogique
    mode: 'tree',
    // Orientation du haut vers le bas
    orientation: OrgChart.orientation.top,
    // Structure de données adaptée à un arbre familial
    nodeBinding: {
      // Associer les propriétés du JSON aux éléments visuels
      field_0: 'name',
      field_1: 'years',
      img_0: 'img',
      field_2: 'gender'
    },
    // Configuration des templates selon le genre
    template: 'olivia',
    // Niveaux personnalisés
    levelSeparation: 60,
    // Configuration des liens familiaux pour faciliter la visualisation des relations
    nodes: familyData
  });

  // Ajout d'événements interactifs
  chart.on('click', function(sender, args) {
    if (args.node) {
      // Afficher les détails du membre sélectionné dans la sidebar droite
      const personId = args.node.id;
      const person = familyData.find(p => p.id.toString() === personId);
      if (person) {
        updatePersonDetails(person);
      }
    }
  });

  return chart;
}

// Transformation du JSON au format attendu par BalkanFamilyTree avec plus d'informations
export function transformFamilyData(rawData) {
  return rawData.map(person => {
    // Calculer l'information sur les années
    let years = '';
    if (person.birthYear) {
      years = person.birthYear.toString();
      if (person.deathYear) {
        years += ` - ${person.deathYear}`;
      }
    }

    return {
      id: person.id.toString(),
      pid: person.pid ? person.pid.toString() : '', // Parent ID (père)
      mid: person.mid ? person.mid.toString() : '', // Mère ID
      name: person.name,
      gender: person.gender || 'unknown',
      years: years,
      img: person.img || getDefaultAvatar(person.gender || 'unknown'),
      // Informations supplémentaires pour affichage dans les détails
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      // Permet de stocker d'autres attributs utiles pour l'affichage
      tags: person.tags || []
    };
  });
}

// Fonction pour obtenir un avatar par défaut selon le genre
function getDefaultAvatar(gender) {
  switch(gender.toLowerCase()) {
    case 'male':
      return 'https://cdn.balkan.app/shared/m10/5.jpg';
    case 'female':
      return 'https://cdn.balkan.app/shared/w10/1.jpg';
    default:
      return 'https://cdn.balkan.app/shared/empty-img-white.svg';
  }
}

// Fonction pour mettre à jour les détails d'une personne dans la sidebar
function updatePersonDetails(person) {
  const detailsContainer = document.querySelector('#right-sidebar .info-card');
  if (!detailsContainer) return;

  let status = person.deathYear ? 'Décédé(e)' : 'Vivant(e)';
  let age = '';
  
  if (person.birthYear) {
    if (person.deathYear) {
      age = person.deathYear - person.birthYear;
    } else {
      age = new Date().getFullYear() - person.birthYear;
    }
  }

  detailsContainer.innerHTML = `
    <h4>${person.name}</h4>
    <p><strong>Année de naissance:</strong> ${person.birthYear || 'Inconnue'}</p>
    ${person.deathYear ? `<p><strong>Année de décès:</strong> ${person.deathYear}</p>` : ''}
    <p><strong>Âge:</strong> ${age ? age + ' ans' : 'Inconnu'}</p>
    <p><strong>Genre:</strong> ${person.gender === 'male' ? 'Homme' : person.gender === 'female' ? 'Femme' : 'Non spécifié'}</p>
    <p><strong>Statut:</strong> ${status}</p>
  `;
}