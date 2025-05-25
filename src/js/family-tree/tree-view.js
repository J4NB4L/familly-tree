// src/js/family-tree/tree-view.js
import FamilyTree from '@balkangraph/familytree.js';
import { familyDataService } from '../../services/familyDataService'; // Pour les détails dans updatePersonDetails

// initFamilyTree reçoit directement les données formatées par le router
export function initFamilyTree(containerId, familyDataForTree) {
  // familyDataForTree a déjà les IDs en string
  const chart = new FamilyTree(document.getElementById(containerId), {
    mode: 'tree', // ou 'light', 'dark' etc.
    orientation: FamilyTree.orientation.top,
    nodeBinding: {
      field_0: 'name',
      field_1: 'years', // Sera calculé dans transformFamilyData (ou ici)
      img_0: 'img'
    },
    // Utilise un template standard ou personnalisé. 'hugo' est un bon point de départ.
    template: 'hugo', 
    // Pour des templates plus personnalisés, réfère-toi à la documentation de BalkanGraph
    // Par exemple, pour afficher le genre différemment :
    // FamilyTree.templates.tommy_male = Object.assign({}, FamilyTree.templates.tommy);
    // FamilyTree.templates.tommy_male.defs = '<style>...</style>'; // Ajouter des styles spécifiques au genre

    levelSeparation: 70,
    siblingSeparation: 60,
    subtreeSeparation: 80,
    nodes: familyDataForTree.map(person => { // Calculer 'years' ici
        let years = '';
        if (person.birthYear) {
            years = person.birthYear.toString();
            if (person.deathYear) {
                years += ` - ${person.deathYear}`;
            }
        }
        return {...person, years };
    }),
    // Gestion des clics pour afficher les détails (optionnel, peut être géré autrement)
     onClick: function (sender, args) { // Note: 'this' ici est l'instance de FamilyTree
        if (args.node) {
            const personId = args.node.id; // C'est l'UUID string
            updatePersonDetailsById(personId); // Fonction pour charger et afficher les détails
            return false; // Pour éviter le comportement par défaut si tu le gères entièrement
        }
    },
    editForm: { // Désactiver le formulaire d'édition intégré si tu gères tout via ta page de profil
        generateElements: false,
        buttons: {}
    },
    menu: { // Personnaliser le menu contextuel du noeud
        pdf: { text: "Exporter en PDF" },
        png: { text: "Exporter en PNG" },
        // edit: null, // Désactiver le bouton d'édition du menu si besoin
    },
    tags: { // Pour styler les noeuds par genre (si ton template le supporte)
        male: {
            template: "hugo" // ou un template spécifique "hugo_male"
            // css: "path/to/male.css"
        },
        female: {
            template: "hugo" // ou "hugo_female"
            // css: "path/to/female.css"
        },
        unknown: {
            template: "hugo"
        }
    }
  });
  return chart;
}

// La transformation principale des données (UUIDs, etc.) est faite dans le router avant d'appeler initFamilyTree.
// Cette fonction n'est plus exportée ou utilisée de la même manière.
// export function transformFamilyData(rawData) { ... } // DEPRECATED ou usage interne

// Fonction pour afficher les détails d'une personne dans la sidebar droite
async function updatePersonDetailsById(personId) {
  const detailsContainer = document.querySelector('#right-sidebar .info-card'); // Assure-toi que .info-card existe
  if (!detailsContainer) {
      // Créer le conteneur s'il n'existe pas (ou log une erreur)
      const rightSidebar = document.getElementById('right-sidebar');
      if(rightSidebar) {
          const card = document.createElement('div');
          card.className = 'info-card'; // Ajoute une classe pour le style
          rightSidebar.appendChild(card);
          // detailsContainer = card; // Attention, cette assignation ne fonctionnera pas comme prévu ici.
          // Il vaut mieux s'assurer que le HTML initial de rightsidebar contient déjà .info-card
      } else {
          console.error("Right sidebar container not found for person details.");
          return;
      }
  }


  try {
    const person = await familyDataService.getPersonById(personId);
    if (!person) {
      detailsContainer.innerHTML = '<p>Personne non trouvée.</p>';
      return;
    }
    
    // Pour obtenir les noms des parents/conjoints/enfants, on a besoin de toutes les données
    // ou de faire des appels supplémentaires. Pour l'instant, on va chercher dans toutes les données si possible.
    // C'est moins performant mais plus simple pour l'affichage.
    // Idéalement, le backend pourrait renvoyer ces infos déjà "populées".
    const allFamilyData = await familyDataService.getAllFamilyData();

    let status = person.deathYear ? 'Décédé(e)' : 'Vivant(e)';
    let age = '';
    if (person.birthYear) {
      const endYear = person.deathYear || new Date().getFullYear();
      age = (endYear - person.birthYear).toString();
    }

    const father = person.fid ? allFamilyData.find(p => p.id === person.fid) : null;
    const mother = person.mid ? allFamilyData.find(p => p.id === person.mid) : null;
    const partners = person.pids ? person.pids.map(pid => allFamilyData.find(p => p.id === pid)).filter(p => p) : [];
    const children = allFamilyData.filter(p => p.fid === person.id || p.mid === person.id);

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
          ${partners.map(partner => `<p>${partner.name}</p>`).join('')}
        </div>
      ` : ''}
      
      ${children.length > 0 ? `
        <div class="family-section">
          <h5>Enfants</h5>
          ${children.map(child => `<p>${child.name}</p>`).join('')}
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error("Erreur lors de la mise à jour des détails de la personne:", error);
    detailsContainer.innerHTML = '<p>Erreur lors du chargement des détails.</p>';
  }
}