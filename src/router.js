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

export function initRouter(rawFamilyData) {
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
          const familyData = transformFamilyData(rawFamilyData);
          initFamilyTree('family-tree-container', familyData);
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
                const graphData = transformGraphData(rawFamilyData);
                initGraph('graph-container', graphData);
              });
            }
          });
        });

        // Initialiser Cytoscape si le conteneur est visible par défaut
        if (document.getElementById('graph-view').style.display === 'block') {
          import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
            const graphData = transformGraphData(rawFamilyData);
            initGraph('graph-container', graphData);
          });
        }

        // Ajouter un gestionnaire d'événements pour les boutons d'algorithmes
        const algorithmButtons = {
          dijkstra: 'dijkstra-button',
          bellmanFord: 'bellman-ford-button',
          prim: 'prim-button',
          kruskal: 'kruskal-button'
        };

        for (const [algorithm, buttonId] of Object.entries(algorithmButtons)) {
          const button = document.getElementById(buttonId);
          if (button) {
            button.addEventListener('click', () => {
              const formId = `${algorithm}-form`;
              const form = document.getElementById(formId);
              form.style.display = form.style.display === 'none' ? 'block' : 'none';

              // Remplir les sélections avec les noms des individus
              const startPersonSelect = document.getElementById(`${algorithm}-start-person`);
              const endPersonSelect = document.getElementById(`${algorithm}-end-person`);
              if (startPersonSelect && endPersonSelect) {
                startPersonSelect.innerHTML = '';
                endPersonSelect.innerHTML = '';

                rawFamilyData.forEach(person => {
                  const option = document.createElement('option');
                  option.value = person.id;
                  option.textContent = person.name;
                  startPersonSelect.appendChild(option);
                  if (endPersonSelect) {
                    endPersonSelect.appendChild(option.cloneNode(true));
                  }
                });
              }
            });

            // Ajouter un gestionnaire d'événements pour le bouton "Lancer"
            const runButton = document.getElementById(`run-${algorithm}`);
            if (runButton) {
              runButton.addEventListener('click', () => {
                const startPersonId = document.getElementById(`${algorithm}-start-person`).value;
                const endPersonId = document.getElementById(`${algorithm}-end-person`)?.value || null;

                if (startPersonId) {
                  import('./js/family-tree/graph-view').then(({ initGraph, transformGraphData }) => {
                    const graphData = transformGraphData(rawFamilyData);
                    const cy = initGraph('graph-container', graphData);

                    const startNode = cy.getElementById(startPersonId);
                    const endNode = endPersonId ? cy.getElementById(endPersonId) : null;

                    if (startNode) {
                      switch (algorithm) {
                        case 'dijkstra':
                          initDijkstra(cy, startNode, endNode);
                          break;
                        case 'bellmanFord':
                          initBellmanFord(cy, startNode, endNode);
                          break;
                        case 'prim':
                          initPrim(cy, startNode);
                          break;
                        case 'kruskal':
                          initKruskal(cy, startNode);
                          break;
                      }
                    }
                  });
                }
              });
            }
          }
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
