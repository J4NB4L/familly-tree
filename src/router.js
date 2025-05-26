// router.js
import { renderNavbar } from './components/navbar';
import { renderLeftSidebar } from './components/leftSidebar';
import { renderRightSidebar } from './components/rightSidebar';
import { renderMainContent } from './components/mainContent';
import { renderProfilePage, setupProfileFormHandler } from './components/profile';
import { renderLoginPage, setupLoginFormHandler } from './components/login';
import { renderRegisterPage, setupRegisterFormHandler } from './components/register';
import { authService } from './services/authService';
import { familyDataService } from './services/familyDataService';
import { uiStateService } from './services/uiStateService';

import { initDijkstra } from './js/algorithms/dijkstra';
import { initBellmanFord } from './js/algorithms/bellman-ford';
import { initPrim } from './js/algorithms/prim';
import { initKruskal } from './js/algorithms/kruskal'; 


let currentActiveView = 'tree';
let currentDataScope = 'personal'; // MODIFIÉ: Vue personnelle par défaut
let cyInstance = null;
let familyTreeInstance = null;

export function initRouter() {
  const app = document.querySelector('#app');

  function navigateTo(path) {
    history.pushState(null, null, path);
    renderRoute();
  }

  async function getPreparedData() {
    uiStateService.clearAlgorithmSteps(); // Effacer les étapes d'algo lors du changement de données
    updateRightSidebar(); // Mettre à jour la sidebar pour refléter l'effacement

    if (currentDataScope === 'personal') {
      return await familyDataService.getPersonalFamilyData();
    }
    return await familyDataService.getAllFamilyData();
  }

  async function renderFamilyTree() {
    const container = document.getElementById('family-tree-container');
    if (familyTreeInstance && typeof familyTreeInstance.destroy === 'function') {
        familyTreeInstance.destroy();
        familyTreeInstance = null;
    }
    if (container) container.innerHTML = ''; 

    document.getElementById('tree-view').style.display = 'block';
    document.getElementById('graph-view').style.display = 'none';

    const dataToDisplay = await getPreparedData();
    if (!dataToDisplay || dataToDisplay.length === 0) {
      container.innerHTML = 
        '<p style="text-align:center; padding-top:20px;">Aucune donnée familiale à afficher pour cette vue.</p>';
      return;
    }
    
    const transformedDataForTree = dataToDisplay.map(p => ({
        ...p,
        id: String(p.id), // FamilyTree.js attend des strings pour les IDs
        fid: p.fid ? String(p.fid) : undefined,
        mid: p.mid ? String(p.mid) : undefined,
        pids: p.pids ? p.pids.map(pid => String(pid)) : [],
        // Ajout du tag pour le genre pour le style
        tags: p.gender ? [p.gender] : ['unknown'] 
    }));

    import('./js/family-tree/tree-view').then(({ initFamilyTree }) => {
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
     if (!dataToDisplay || dataToDisplay.length === 0) {
      container.innerHTML = 
        '<p style="text-align:center; padding-top:20px;">Aucune donnée familiale à afficher pour le graphe.</p>';
      return;
    }

    import('./js/family-tree/graph-view').then(async ({ initGraph, transformGraphData }) => {
      const graphData = transformGraphData(dataToDisplay);
      cyInstance = initGraph('graph-container', graphData);
      setupAlgorithmButtons(cyInstance); // S'assurer que les boutons sont (ré)initialisés
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
      button.addEventListener('click', async (e) => { // rendu async
        currentDataScope = e.target.getAttribute('data-scope');
        // Re-fetch and re-render
        if (currentActiveView === 'tree') await renderFamilyTree();
        else if (currentActiveView === 'graph') await renderGraphView();
        updateActiveButtons();
        // Mettre à jour les selects des algos avec les nouvelles données si la vue graphe est active
        if (currentActiveView === 'graph') {
            const familyDataForSelect = await getPreparedData(); // Utilise déjà le bon scope
            populateAlgorithmSelects(['start-person', 'end-person', 'bellman-ford-start-person', 'bellman-ford-end-person', 'prim-start-person', 'kruskal-start-person'], familyDataForSelect);
        }
      });
    });
  }
  
  function setupAlgorithmButtons(cy) {
    const algoErrorContainer = document.getElementById('algorithm-error-message'); // Défini dans leftsidebar.js
    
    const handleAlgoRun = (algoName, startNodeId, endNodeId, initFn) => {
        if (currentActiveView === 'tree') {
            if (algoErrorContainer) {
                algoErrorContainer.textContent = `Pour utiliser ${algoName}, veuillez basculer vers la vue "Graphe des Relations".`;
                algoErrorContainer.style.display = 'block';
            } else {
                uiStateService.addAlgorithmStep(`ERREUR: ${algoName} ne peut être lancé qu'en vue "Graphe".`);
                updateRightSidebar();
            }
            return;
        }
        if (algoErrorContainer) algoErrorContainer.style.display = 'none';

        if (!cy) {
            uiStateService.addAlgorithmStep("ERREUR: Graphe non initialisé.");
            updateRightSidebar();
            return;
        }

        const startNode = cy.getElementById(startNodeId);
        let endNode;
        if (endNodeId) endNode = cy.getElementById(endNodeId);

        let nodesValid = startNode && startNode.length > 0;
        if (endNodeId) nodesValid = nodesValid && endNode && endNode.length > 0;
        
        // Pour Kruskal, startNodeId et endNodeId ne sont pas utilisés directement par l'algo lui-même
        if (algoName === "Kruskal") {
            initFn(cy); // Kruskal n'a pas besoin de start/end node spécifiques pour son initialisation
            updateRightSidebar();
            return;
        }


        if (nodesValid) {
            if (endNodeId) initFn(cy, startNode, endNode);
            else initFn(cy, startNode); // Pour Prim
            updateRightSidebar();
        } else {
            uiStateService.addAlgorithmStep(`ERREUR ${algoName}: Nœud de départ ou d'arrivée non trouvé.`);
            updateRightSidebar();
            console.warn(`${algoName}: Start or end node not found. Start: ${startNodeId}, End: ${endNodeId}`);
        }
    };

    const runDijkstraButton = document.getElementById('run-dijkstra');
    if (runDijkstraButton) {
      runDijkstraButton.onclick = () => { 
        const startPersonId = document.getElementById('start-person').value;
        const endPersonId = document.getElementById('end-person').value;
        handleAlgoRun("Dijkstra", startPersonId, endPersonId, initDijkstra);
      };
    }

    const runBellmanFordButton = document.getElementById('run-bellman-ford');
    if (runBellmanFordButton) {
      runBellmanFordButton.onclick = () => {
        const startPersonId = document.getElementById('bellman-ford-start-person').value;
        const endPersonId = document.getElementById('bellman-ford-end-person').value;
        handleAlgoRun("Bellman-Ford", startPersonId, endPersonId, initBellmanFord);
      };
    }

    const runPrimButton = document.getElementById('run-prim');
    if (runPrimButton) {
      runPrimButton.onclick = () => {
        const startPersonId = document.getElementById('prim-start-person').value;
        handleAlgoRun("Prim", startPersonId, null, initPrim);
      };
    }

    const runKruskalButton = document.getElementById('run-kruskal');
    if (runKruskalButton) {
      runKruskalButton.onclick = () => {
        // Kruskal n'a pas besoin de start/end node ici, le select est juste pour UI
        handleAlgoRun("Kruskal", null, null, initKruskal);
      };
    }
  }

  async function renderRoute() {
    const path = window.location.pathname;
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated && path !== '/login' && path !== '/register') {
      navigateTo('/login');
      return;
    }
    if (isAuthenticated && (path === '/login' || path === '/register')) {
      navigateTo('/');
      return;
    }

    // Essayer de charger le profil utilisateur pour s'assurer que le token est valide avant de rendre quoi que ce soit
    // Sauf pour les pages de login/register elles-mêmes
    if (path !== '/login' && path !== '/register') {
        try {
            const user = await authService.fetchUserProfileFromServer();
            if (!user) { // Si fetchUserProfileFromServer retourne null (ex: token invalide déconnecté)
                if (authService.isAuthenticated()) authService.logout(); // Double check pour nettoyer
                navigateTo('/login');
                return;
            }
        } catch (error) { // Erreur critique pendant fetchUserProfileFromServer
            if (authService.isAuthenticated()) authService.logout();
            navigateTo('/login');
            return;
        }
    }

    // Toujours rendre la navbar après la vérification d'auth (sauf si redirection)
    const appContainer = document.getElementById('app');
    if (appContainer) appContainer.innerHTML = renderNavbar(); 

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
        mainLayoutHtml = `<div id="main-content-register" class="login-container">${renderRegisterPage()}</div>`;
    } else {
        mainLayoutHtml = `<div id="main-content-404"><h2>404 - Page non trouvée</h2></div>`;
    }
    
    if (appContainer) appContainer.innerHTML += mainLayoutHtml;


    // Initialisations spécifiques à la page
    if (path === '/') {
      // La navbar a déjà été mise à jour implicitement par le fetchUserProfileFromServer global
      // et le renderNavbar() au début de renderRoute().

      if (currentActiveView === 'tree') await renderFamilyTree();
      else await renderGraphView(); // Ceci va appeler getPreparedData qui utilise currentDataScope
      
      setupMainViewControls();
      updateActiveButtons();

      // Peupler les selects des algorithmes avec les données actuellement affichées
      const familyDataForSelect = await getPreparedData(); // Utilise currentDataScope
      if (familyDataForSelect && familyDataForSelect.length > 0) {
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
                    populateAlgorithmSelects(['kruskal-start-person'], familyDataForSelect); 
                });
            }
        }
      if (cyInstance) setupAlgorithmButtons(cyInstance); // S'assurer que les boutons sont liés si cyInstance est créé

    } else if (path === '/profile') {
      await setupProfileFormHandler(); 
    } else if (path === '/login') {
      setupLoginFormHandler();
    } else if (path === '/register') {
      setupRegisterFormHandler();
    }

    // S'assurer que les liens de navigation SPA fonctionnent
    document.querySelectorAll('a[data-link]').forEach(link => {
        if (!link.dataset.spaHandlerAttached) { // Eviter d'attacher plusieurs fois
            link.addEventListener('click', e => {
                e.preventDefault();
                navigateTo(link.getAttribute('href'));
            });
            link.dataset.spaHandlerAttached = 'true';
        }
    });
  }

  function populateAlgorithmSelects(selectIds, data) {
    if (!data || data.length === 0) {
        selectIds.forEach(selectId => {
            const selectElement = document.getElementById(selectId);
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Aucune personne à sélectionner</option>';
            }
        });
        return;
    }
    selectIds.forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            const currentValue = selectElement.value; 
            selectElement.innerHTML = ''; 
            data.forEach(person => {
                const option = document.createElement('option');
                option.value = person.id; 
                option.textContent = person.name;
                selectElement.appendChild(option);
            });
            if(currentValue && data.some(p => p.id === currentValue)) {
                 selectElement.value = currentValue;
            } else if (data.length > 0) {
                selectElement.value = data[0].id; // Select first by default if no/invalid previous value
            }
        }
    });
  }
  
  // Attacher l'event listener pour la navigation SPA une seule fois au body
  document.body.addEventListener('click', e => {
    const target = e.target.closest('a[data-link]'); // Chercher un parent <a> si clic sur un enfant
    if (target) {
      e.preventDefault();
      navigateTo(target.getAttribute('href'));
    }
  });

  window.addEventListener('popstate', renderRoute);
  renderRoute(); 
}

export function updateRightSidebar() { // Rendre exportable si utilisé ailleurs, sinon garder local
  const rightSidebarContainer = document.getElementById('right-sidebar');
  if (rightSidebarContainer) {
    rightSidebarContainer.innerHTML = renderRightSidebar();
  }
}