// router.js
import { renderNavbar } from './components/navbar';
import { renderLeftSidebar } from './components/leftSidebar';
import { renderRightSidebar } from './components/rightSidebar';
import { renderMainContent } from './components/mainContent';
import { renderProfilePage, setupProfileFormHandler } from './components/profile';
import { renderLoginPage, setupLoginFormHandler } from './components/login';
import { renderRegisterPage, setupRegisterFormHandler } from './components/register'; // Nouveau
import { authService } from './services/authService';
import { familyDataService } from './services/familyDataService';
// uiStateService reste local, pas de changement majeur
// Les imports d'algorithmes restent
import { initDijkstra } from './js/algorithms/dijkstra';
import { initBellmanFord } from './js/algorithms/bellman-ford';
import { initPrim } from './js/algorithms/prim';
import { initKruskal } from './js/algorithms/kruskal'; 


let currentActiveView = 'tree';
let currentDataScope = 'full';
let cyInstance = null;
let familyTreeInstance = null;

export function initRouter() {
  const app = document.querySelector('#app');

  function navigateTo(path) {
    history.pushState(null, null, path);
    renderRoute();
  }

  async function getPreparedData() {
    if (currentDataScope === 'personal') {
      // `getPersonalFamilyData` utilise maintenant le token pour identifier l'utilisateur côté backend
      return await familyDataService.getPersonalFamilyData();
    }
    return await familyDataService.getAllFamilyData();
  }

  async function renderFamilyTree() {
    const container = document.getElementById('family-tree-container');
    if (familyTreeInstance && typeof familyTreeInstance.destroy === 'function') {
        familyTreeInstance.destroy();
    } else if (container) {
        container.innerHTML = '';
    }
    if (container) container.innerHTML = ''; // Simple clear

    document.getElementById('tree-view').style.display = 'block';
    document.getElementById('graph-view').style.display = 'none';

    const dataToDisplay = await getPreparedData();
    if (dataToDisplay.length === 0) {
      container.innerHTML = 
        '<p style="text-align:center; padding-top:20px;">Aucune donnée familiale à afficher pour cette vue.</p>';
      return;
    }
    
    // Assurer que les IDs sont des strings pour FamilyTree.js
    const transformedDataForTree = dataToDisplay.map(p => ({
        ...p,
        id: String(p.id),
        fid: p.fid ? String(p.fid) : undefined,
        mid: p.mid ? String(p.mid) : undefined,
        pids: p.pids ? p.pids.map(pid => String(pid)) : [],
    }));

    import('./js/family-tree/tree-view').then(({ initFamilyTree, transformFamilyData }) => { // transformFamilyData n'est plus utilisé ici
      familyTreeInstance = initFamilyTree('family-tree-container', transformedDataForTree);
    });
  }

  async function renderGraphView() {
    if (cyInstance) {
      cyInstance.destroy();
      cyInstance = null;
    }
    const container = document.getElementById('graph-container');
    if(container) container.innerHTML = '';


    document.getElementById('tree-view').style.display = 'none';
    document.getElementById('graph-view').style.display = 'block';
    
    const dataToDisplay = await getPreparedData();
    if (dataToDisplay.length === 0) {
      container.innerHTML = 
        '<p style="text-align:center; padding-top:20px;">Aucune donnée familiale à afficher pour le graphe.</p>';
      return;
    }

    import('./js/family-tree/graph-view').then(async ({ initGraph, transformGraphData }) => {
      // transformGraphData s'attend à ce que les IDs soient déjà corrects (UUID strings)
      const graphData = transformGraphData(dataToDisplay);
      cyInstance = initGraph('graph-container', graphData);
      setupAlgorithmButtons(cyInstance);
    });
  }

  function updateActiveButtons() {
    document.querySelectorAll('.view-button').forEach(btn => {
        btn.classList.toggle('active-view-btn', btn.getAttribute('data-view') === currentActiveView);
    });
    document.querySelectorAll('.scope-button').forEach(btn => {
        btn.classList.toggle('active-scope-btn', btn.getAttribute('data-scope') === currentDataScope);
    });
  }

  function setupMainViewControls() {
    document.querySelectorAll('.view-button').forEach(button => {
      button.addEventListener('click', (e) => {
        currentActiveView = e.target.getAttribute('data-view');
        if (currentActiveView === 'tree') renderFamilyTree();
        else if (currentActiveView === 'graph') renderGraphView();
        updateActiveButtons();
      });
    });

    document.querySelectorAll('.scope-button').forEach(button => {
      button.addEventListener('click', (e) => {
        currentDataScope = e.target.getAttribute('data-scope');
        if (currentActiveView === 'tree') renderFamilyTree();
        else if (currentActiveView === 'graph') renderGraphView();
        updateActiveButtons();
      });
    });
  }
  
  function setupAlgorithmButtons(cy) {
    const runDijkstraButton = document.getElementById('run-dijkstra');
    if (runDijkstraButton) {
      runDijkstraButton.onclick = () => { 
        const startPersonId = document.getElementById('start-person').value; // UUID
        const endPersonId = document.getElementById('end-person').value;     // UUID
        if (startPersonId && endPersonId && cy) {
          const startNode = cy.getElementById(startPersonId);
          const endNode = cy.getElementById(endPersonId);
          if (startNode.length && endNode.length) {
            initDijkstra(cy, startNode, endNode);
            updateRightSidebar(); // Assurez-vous que cette fonction est définie
          } else {
            console.warn("Dijkstra: Start or end node not found.");
          }
        }
      };
    }
    // ... Idem pour Bellman-Ford, Prim, Kruskal ...
    const runBellmanFordButton = document.getElementById('run-bellman-ford');
    if (runBellmanFordButton) {
      runBellmanFordButton.onclick = () => {
        const startPersonId = document.getElementById('bellman-ford-start-person').value;
        const endPersonId = document.getElementById('bellman-ford-end-person').value;
        if (startPersonId && endPersonId && cy) {
          const startNode = cy.getElementById(startPersonId);
          const endNode = cy.getElementById(endPersonId);
          if (startNode.length && endNode.length) {
            initBellmanFord(cy, startNode, endNode);
            updateRightSidebar();
          } else {
            console.warn("Bellman-Ford: Start or end node not found.");
          }
        }
      };
    }

    const runPrimButton = document.getElementById('run-prim');
    if (runPrimButton) {
      runPrimButton.onclick = () => {
        const startPersonId = document.getElementById('prim-start-person').value;
        if (startPersonId && cy) {
          const startNode = cy.getElementById(startPersonId);
          if (startNode.length) {
            initPrim(cy, startNode);
            updateRightSidebar();
          } else {
            console.warn("Prim: Start node not found.");
          }
        }
      };
    }

    const runKruskalButton = document.getElementById('run-kruskal');
    if (runKruskalButton) {
      runKruskalButton.onclick = () => {
        if (cy) { 
            initKruskal(cy); 
            updateRightSidebar();
        }
      };
    }
  }

  async function renderRoute() {
    const path = window.location.pathname;
    const isAuthenticated = authService.isAuthenticated();

    // Gestion des redirections
    if (!isAuthenticated && path !== '/login' && path !== '/register') {
      navigateTo('/login');
      return;
    }
    if (isAuthenticated && (path === '/login' || path === '/register')) {
      navigateTo('/');
      return;
    }

    // Toujours rendre la navbar
    app.innerHTML = renderNavbar(); // renderNavbar devra peut-être être asynchrone si elle utilise fetchUserProfileFromServer

    let mainLayoutHtml = '';
    if (path === '/') {
        mainLayoutHtml = `
            ${renderLeftSidebar()}
            ${renderMainContent()}
            ${renderRightSidebar()}
        `;
    } else if (path === '/profile') {
        mainLayoutHtml = `<div id="main-content-profile" class="profile-container">${renderProfilePage()}</div>`;
    } else if (path === '/login') {
        mainLayoutHtml = `<div id="main-content-login" class="login-container">${renderLoginPage()}</div>`;
    } else if (path === '/register') {
        mainLayoutHtml = `<div id="main-content-register" class="login-container">${renderRegisterPage()}</div>`; // Utilise login-container pour le style
    } else {
        mainLayoutHtml = `<div id="main-content-404"><h2>404 - Page non trouvée</h2></div>`;
    }
    app.innerHTML += mainLayoutHtml;

    // Initialisations spécifiques à la page
    if (path === '/') {
      // Tentative de chargement du profil utilisateur pour s'assurer que le token est valide
      // et que le profil est à jour dans le cache pour la navbar et autres.
      try {
        await authService.fetchUserProfileFromServer(); 
        // Mettre à jour la navbar si elle dépend du profil chargé dynamiquement
        const newNavbarHtml = renderNavbar();
        const navbarElement = document.getElementById('navbar');
        if (navbarElement) navbarElement.outerHTML = newNavbarHtml;

      } catch (error) {
          // fetchUserProfileFromServer gère déjà la déconnexion en cas d'erreur critique
          // Pas besoin de rediriger à nouveau ici si authService le fait.
          console.log("Utilisateur non authentifié ou erreur de profil, redirection gérée par authService ou intercepteur.")
          return; // Arrêter le rendu si l'utilisateur est déconnecté
      }


      if (currentActiveView === 'tree') await renderFamilyTree();
      else await renderGraphView();
      
      setupMainViewControls();
      updateActiveButtons();

      // Peupler les selects des algorithmes
      const familyDataForSelect = await familyDataService.getAllFamilyData();
      if (familyDataForSelect.length > 0) {
            const dijkstraButton = document.getElementById('dijkstra-button');
            if (dijkstraButton) {
              dijkstraButton.addEventListener('click', () => {
                document.getElementById('dijkstra-form').style.display = document.getElementById('dijkstra-form').style.display === 'none' ? 'block' : 'none';
                populateAlgorithmSelects(['start-person', 'end-person'], familyDataForSelect);
              });
            }
             const bellmanFordButton = document.getElementById('bellman-ford-button');
            if (bellmanFordButton) {
                bellmanFordButton.addEventListener('click', () => {
                    document.getElementById('bellman-ford-form').style.display = document.getElementById('bellman-ford-form').style.display === 'none' ? 'block' : 'none';
                    populateAlgorithmSelects(['bellman-ford-start-person', 'bellman-ford-end-person'], familyDataForSelect);
                });
            }
            const primButton = document.getElementById('prim-button');
            if (primButton) {
                primButton.addEventListener('click', () => {
                    document.getElementById('prim-form').style.display = document.getElementById('prim-form').style.display === 'none' ? 'block' : 'none';
                    populateAlgorithmSelects(['prim-start-person'], familyDataForSelect);
                });
            }
            const kruskalButton = document.getElementById('kruskal-button');
            if (kruskalButton) {
                kruskalButton.addEventListener('click', () => {
                    document.getElementById('kruskal-form').style.display = document.getElementById('kruskal-form').style.display === 'none' ? 'block' : 'none';
                     // Kruskal n'a pas besoin de sélection utilisateur dans ce formulaire, mais on le garde pour la cohérence de l'UI
                    populateAlgorithmSelects(['kruskal-start-person'], familyDataForSelect);
                });
            }
        }
      if (cyInstance) setupAlgorithmButtons(cyInstance);

    } else if (path === '/profile') {
      await setupProfileFormHandler(); // Doit être async car il fait des appels API
    } else if (path === '/login') {
      setupLoginFormHandler();
    } else if (path === '/register') {
      setupRegisterFormHandler();
    }
  }

  function populateAlgorithmSelects(selectIds, data) {
    selectIds.forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            const currentValue = selectElement.value; // Conserver la valeur si possible (moins pertinent ici)
            selectElement.innerHTML = ''; // Clear previous options
            data.forEach(person => {
                const option = document.createElement('option');
                option.value = person.id; // UUID
                option.textContent = person.name;
                selectElement.appendChild(option);
            });
            if(currentValue) selectElement.value = currentValue; // Restaurer si l'option existe toujours
        }
    });
  }

  document.body.addEventListener('click', e => {
    if (e.target.matches('a[data-link]')) {
      e.preventDefault();
      navigateTo(e.target.getAttribute('href'));
    }
  });

  window.addEventListener('popstate', renderRoute);
  renderRoute(); // Premier rendu
}

// S'assurer que cette fonction est bien définie et importée/exportée correctement si elle est dans un autre module.
// Pour l'instant, je la définis ici pour la simplicité.
function updateRightSidebar() {
  const rightSidebarContainer = document.getElementById('right-sidebar');
  if (rightSidebarContainer) {
    // Assumons que renderRightSidebar() est synchrone et utilise uiStateService
    // qui est toujours basé sur localStorage.
    rightSidebarContainer.innerHTML = renderRightSidebar();
  }
}