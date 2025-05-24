import FamilyTree from '@balkangraph/familytree.js';

export function initFamilyTree(containerId, familyData) {
  const chart = new FamilyTree(document.getElementById(containerId), {
    mode: 'tree',
    orientation: FamilyTree.orientation.top,
    nodeBinding: {
      field_0: 'name',
      field_1: 'years',
      img_0: 'img'
    },
    template: 'hugo', // Template par défaut qui fonctionne avec FamilyTree.js
    // Ou utilisez un template personnalisé :
    // template: FamilyTree.templates.hugo
    levelSeparation: 60,
    siblingSeparation: 60,
    subtreeSeparation: 80,
    nodes: familyData
  });

  chart.on('click', function(sender, args) {
    if (args.node) {
      const personId = args.node.id;
      const person = familyData.find(p => p.id.toString() === personId);
      if (person) {
        updatePersonDetails(person);
      }
    }
  });

  return chart;
}

export function transformFamilyData(rawData) {
  return rawData.map(person => {
    let years = '';
    if (person.birthYear) {
      years = person.birthYear.toString();
      if (person.deathYear) {
        years += ` - ${person.deathYear}`;
      }
    }

    return {
      id: person.id.toString(),
      fid: person.fid ? person.fid.toString() : undefined, // Father ID
      mid: person.mid ? person.mid.toString() : undefined, // Mother ID
      pids: person.pids ? person.pids.map(pid => pid.toString()) : [], // Partner IDs
      name: person.name,
      gender: person.gender || 'unknown',
      years: years,
      img: person.img || getDefaultAvatar(person.gender || 'unknown'),
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      gmail: person.gmail,
      tags: [person.gender] // Ajouter le genre comme tag pour le styling
    };
  });
}

function getDefaultAvatar(gender) {
  switch(gender.toLowerCase()) {
    case 'male':
      return '/assets/avatars/default-male.svg';
    case 'female':
      return '/assets/avatars/default-female.svg';
    default:
      return '/assets/avatars/default.svg';
  }
}

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

  // Récupérer les données complètes depuis localStorage pour les relations
  const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
  
  // Trouver les partenaires
  let partners = [];
  if (person.pids && person.pids.length > 0) {
    partners = person.pids.map(pid => {
      const partner = familyData.find(p => p.id.toString() === pid.toString());
      return partner ? partner.name : 'Inconnu';
    });
  }

  // Trouver les enfants
  const children = familyData.filter(p => 
    (p.fid && p.fid.toString() === person.id.toString()) || 
    (p.mid && p.mid.toString() === person.id.toString())
  );

  // Trouver les parents
  let father = null, mother = null;
  if (person.fid) {
    father = familyData.find(p => p.id.toString() === person.fid.toString());
  }
  if (person.mid) {
    mother = familyData.find(p => p.id.toString() === person.mid.toString());
  }

  detailsContainer.innerHTML = `
    <h4>${person.name}</h4>
    <p><strong>Année de naissance:</strong> ${person.birthYear || 'Inconnue'}</p>
    ${person.deathYear ? `<p><strong>Année de décès:</strong> ${person.deathYear}</p>` : ''}
    <p><strong>Âge:</strong> ${age ? age + ' ans' : 'Inconnu'}</p>
    <p><strong>Genre:</strong> ${person.gender === 'male' ? 'Homme' : person.gender === 'female' ? 'Femme' : 'Non spécifié'}</p>
    <p><strong>Statut:</strong> ${status}</p>
    ${person.gmail ? `<p><strong>Email:</strong> ${person.gmail}</p>` : ''}
    
    ${father || mother ? `
      <div class="family-section">
        <h5>Parents</h5>
        ${father ? `<p>Père: ${father.name}</p>` : ''}
        ${mother ? `<p>Mère: ${mother.name}</p>` : ''}
      </div>
    ` : ''}
    
    ${partners.length > 0 ? `
      <div class="family-section">
        <h5>Conjoint(s)</h5>
        ${partners.map(partner => `<p>${partner}</p>`).join('')}
      </div>
    ` : ''}
    
    ${children.length > 0 ? `
      <div class="family-section">
        <h5>Enfants</h5>
        ${children.map(child => `<p>${child.name}</p>`).join('')}
      </div>
    ` : ''}
  `;
}