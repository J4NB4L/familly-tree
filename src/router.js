// router.js
import { renderNavbar } from './components/navbar';
import { renderLeftSidebar } from './components/leftSidebar';
import { renderRightSidebar } from './components/rightSidebar';
import { renderMainContent } from './components/mainContent';
import { renderProfilePage, setupProfileFormHandler } from './components/profile';
import { renderLoginPage, setupLoginFormHandler } from './components/login';
import { initDijkstra } from './js/algorithms/dijkstra';
import { initBellmanFord } from './js/algorithms/bellman-ford';
import { initPrim } from './js/algorithms/prim';
import { initKruskal } from './js/algorithms/kruskal';

export function initRouter() {
  const app = document.querySelector('#app');

  function navigateTo(path) {
    history.pushState(null, null, path);
    renderRoute();
  }

  function renderRoute() {
    const path = window.location.pathname;
    const userProfile = localStorage.getItem('userProfile');
    const isLoginPage = path === '/login';

    // 🔐 Rediriger vers /login si pas connecté
    if (!userProfile && !isLoginPage) {
      history.replaceState(null, null, '/login');
      return renderRoute();
    }

    // 🔁 Rediriger vers / si déjà connecté et tente d'aller à /login
    if (userProfile && isLoginPage) {
      history.replaceState(null, null, '/');
      return renderRoute();
    }

    // Cas normal
    app.innerHTML = `${renderNavbar()}`;

    // Si pas sur /login ou /profile, on affiche les sidebars
    if (path === '/') {
      app.innerHTML += `
        ${renderLeftSidebar()}
        ${renderRightSidebar()}
      `;
    }

    // Ajout du contenu central
    const contentContainer = document.createElement('div');
    contentContainer.id = 'main-content';
    app.appendChild(contentContainer);

    switch (path) {
      case '/':
        contentContainer.innerHTML = renderMainContent();
        import('./js/family-tree/tree-view').then(({ initFamilyTree, transformFamilyData }) => {
          const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
          initFamilyTree('family-tree-container', transformFamilyData(familyData));
        });

        // Ajouter un gestionnaire d'événements pour les boutons de vue
        document.querySelectorAll('.view-button').forEach(button => {
          button.addEventListener('click', (e) => {
            const view = e.target.getAttribute('data-view');
            document.getElementById('tree-view').style.display = view === 'tree' ? 'block' : 'none';
            document.getElementById('graph-view').style.display = view === 'graph' ? 'block' : 'none';

            // Initialiser Cytoscape uniquement si le conteneur est visible
            if (view === 'graph') {
              import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
                const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
                const graphData = transformGraphData(familyData);
                initGraph('graph-container', graphData);
              });
            }
          });
        });

        // Initialiser Cytoscape si le conteneur est visible par défaut
        if (document.getElementById('graph-view').style.display === 'block') {
          import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
            const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
            const graphData = transformGraphData(familyData);
            initGraph('graph-container', graphData);
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Dijkstra"
        const dijkstraButton = document.getElementById('dijkstra-button');
        if (dijkstraButton) {
          dijkstraButton.addEventListener('click', () => {
            const dijkstraForm = document.getElementById('dijkstra-form');
            dijkstraForm.style.display = dijkstraForm.style.display === 'none' ? 'block' : 'none';

            // Remplir les sélections avec les noms des individus
            const startPersonSelect = document.getElementById('start-person');
            const endPersonSelect = document.getElementById('end-person');
            startPersonSelect.innerHTML = '';
            endPersonSelect.innerHTML = '';

            const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
            familyData.forEach(person => {
              const option = document.createElement('option');
              option.value = person.id;
              option.textContent = person.name;
              startPersonSelect.appendChild(option);
              endPersonSelect.appendChild(option.cloneNode(true));
            });
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Lancer Dijkstra"
        const runDijkstraButton = document.getElementById('run-dijkstra');
        if (runDijkstraButton) {
          runDijkstraButton.addEventListener('click', () => {
            const startPersonId = document.getElementById('start-person').value;
            const endPersonId = document.getElementById('end-person').value;

            if (startPersonId && endPersonId) {
              import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
                const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
                const graphData = transformGraphData(familyData);
                const cy = initGraph('graph-container', graphData);

                const startNode = cy.getElementById(startPersonId);
                const endNode = cy.getElementById(endPersonId);

                if (startNode && endNode) {
                  initDijkstra(cy, startNode, endNode);
                  updateRightSidebar(); // Mettre à jour la barre latérale droite
                }
              });
            }
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Bellman-Ford"
        const bellmanFordButton = document.getElementById('bellman-ford-button');
        if (bellmanFordButton) {
          bellmanFordButton.addEventListener('click', () => {
            const bellmanFordForm = document.getElementById('bellman-ford-form');
            bellmanFordForm.style.display = bellmanFordForm.style.display === 'none' ? 'block' : 'none';

            // Remplir les sélections avec les noms des individus
            const startPersonSelect = document.getElementById('bellman-ford-start-person');
            const endPersonSelect = document.getElementById('bellman-ford-end-person');
            startPersonSelect.innerHTML = '';
            endPersonSelect.innerHTML = '';

            const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
            familyData.forEach(person => {
              const option = document.createElement('option');
              option.value = person.id;
              option.textContent = person.name;
              startPersonSelect.appendChild(option);
              endPersonSelect.appendChild(option.cloneNode(true));
            });
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Lancer Bellman-Ford"
        const runBellmanFordButton = document.getElementById('run-bellman-ford');
        if (runBellmanFordButton) {
          runBellmanFordButton.addEventListener('click', () => {
            const startPersonId = document.getElementById('bellman-ford-start-person').value;
            const endPersonId = document.getElementById('bellman-ford-end-person').value;

            if (startPersonId && endPersonId) {
              import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
                const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
                const graphData = transformGraphData(familyData);
                const cy = initGraph('graph-container', graphData);

                const startNode = cy.getElementById(startPersonId);
                const endNode = cy.getElementById(endPersonId);

                if (startNode && endNode) {
                  initBellmanFord(cy, startNode, endNode);
                  updateRightSidebar(); // Mettre à jour la barre latérale droite
                }
              });
            }
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Prim"
        const primButton = document.getElementById('prim-button');
        if (primButton) {
          primButton.addEventListener('click', () => {
            const primForm = document.getElementById('prim-form');
            primForm.style.display = primForm.style.display === 'none' ? 'block' : 'none';

            // Remplir les sélections avec les noms des individus
            const startPersonSelect = document.getElementById('prim-start-person');
            startPersonSelect.innerHTML = '';

            const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
            familyData.forEach(person => {
              const option = document.createElement('option');
              option.value = person.id;
              option.textContent = person.name;
              startPersonSelect.appendChild(option);
            });
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Lancer Prim"
        const runPrimButton = document.getElementById('run-prim');
        if (runPrimButton) {
          runPrimButton.addEventListener('click', () => {
            const startPersonId = document.getElementById('prim-start-person').value;

            if (startPersonId) {
              import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
                const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
                const graphData = transformGraphData(familyData);
                const cy = initGraph('graph-container', graphData);

                const startNode = cy.getElementById(startPersonId);

                if (startNode) {
                  initPrim(cy, startNode);
                  updateRightSidebar(); // Mettre à jour la barre latérale droite
                }
              });
            }
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Kruskal"
        const kruskalButton = document.getElementById('kruskal-button');
        if (kruskalButton) {
          kruskalButton.addEventListener('click', () => {
            const kruskalForm = document.getElementById('kruskal-form');
            kruskalForm.style.display = kruskalForm.style.display === 'none' ? 'block' : 'none';

            // Remplir les sélections avec les noms des individus
            const startPersonSelect = document.getElementById('kruskal-start-person');
            startPersonSelect.innerHTML = '';

            const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
            familyData.forEach(person => {
              const option = document.createElement('option');
              option.value = person.id;
              option.textContent = person.name;
              startPersonSelect.appendChild(option);
            });
          });
        }

        // Ajouter un gestionnaire d'événements pour le bouton "Lancer Kruskal"
        const runKruskalButton = document.getElementById('run-kruskal');
        if (runKruskalButton) {
          runKruskalButton.addEventListener('click', () => {
            const startPersonId = document.getElementById('kruskal-start-person').value;

            if (startPersonId) {
              import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
                const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
                const graphData = transformGraphData(familyData);
                const cy = initGraph('graph-container', graphData);

                const startNode = cy.getElementById(startPersonId);

                if (startNode) {
                  initKruskal(cy, startNode);
                  updateRightSidebar(); // Mettre à jour la barre latérale droite
                }
              });
            }
          });
        }
        break;

      case '/profile':
        contentContainer.innerHTML = renderProfilePage();
        setupProfileFormHandler(); // Ajouter le gestionnaire du profil
        break;

      case '/login':
        contentContainer.innerHTML = renderLoginPage();
        setupLoginFormHandler(); // Ajouter le gestionnaire de la page de connexion
        break;

      default:
        contentContainer.innerHTML = `
          <div id="main-content">
            <h2>404 - Page non trouvée</h2>
          </div>
        `;
    }
  }

  // Navigation interne
  document.body.addEventListener('click', e => {
    if (e.target.matches('a[data-link]')) {
      e.preventDefault();
      navigateTo(e.target.getAttribute('href'));
    }
  });

  window.addEventListener('popstate', renderRoute); // Back/forward support

  renderRoute(); // Initial load
}

// Fonction pour mettre à jour la barre latérale droite
function updateRightSidebar() {
  const rightSidebar = document.getElementById('right-sidebar');
  if (rightSidebar) {
    rightSidebar.innerHTML = renderRightSidebar();
  }
}
