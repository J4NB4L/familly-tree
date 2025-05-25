// router.js
import { renderNavbar } from './components/navbar';
import { renderLeftSidebar } from './components/leftSidebar'; // corrected casing
import { renderRightSidebar } from './components/rightSidebar'; // corrected casing
import { renderMainContent } from './components/mainContent'; // corrected casing
import { renderProfilePage, setupProfileFormHandler } from './components/profile';
import { renderLoginPage, setupLoginFormHandler } from './components/login';
import { authService } from './services/authService';
import { familyDataService } from './services/familyDataService';
import { uiStateService } from './services/uiStateService';
import { initDijkstra } from './js/algorithms/dijkstra';
import { initBellmanFord } from './js/algorithms/bellman-ford';
import { initPrim } from './js/algorithms/prim';
import { initKruskal } from './js/algorithms/kruskal'; 

// Module-level state for current view and scope
let currentActiveView = 'tree'; // 'tree' or 'graph'
let currentDataScope = 'full'; // 'full' or 'personal'
let cyInstance = null; // To keep track of cytoscape instance for destroy
let familyTreeInstance = null; // To keep track of FamilyTree instance

export function initRouter() {
  const app = document.querySelector('#app');

  function navigateTo(path) {
    history.pushState(null, null, path);
    renderRoute();
  }

  async function getPreparedData() {
    const fullFamilyData = await familyDataService.getAllFamilyData(); 
    if (currentDataScope === 'personal') {
      const userProfile = authService.getCurrentUserProfile();
      if (!userProfile || typeof userProfile.id === 'undefined') { /* ... error handling ... */ return []; }
      console.log("Router - User profile being used for personal scope:", userProfile);
      return await familyDataService.getPersonalFamilyData(userProfile);
    }
    return fullFamilyData;
  }

  async function renderFamilyTree() {
    if (familyTreeInstance) {
        // Attempt to destroy or clean up the old instance if the library supports it
        // For BalkanGraph, re-creating is often the simplest for data changes.
        // Ensure the container is empty or the library handles replacement.
        const container = document.getElementById('family-tree-container');
        if(container) container.innerHTML = ''; // Simple clear
    }
    document.getElementById('tree-view').style.display = 'block';
    document.getElementById('graph-view').style.display = 'none';
    import('./js/family-tree/tree-view').then(async ({ initFamilyTree, transformFamilyData }) => {
      const dataToDisplay = await getPreparedData();
      if (dataToDisplay.length === 0 && currentDataScope === 'personal') {
        document.getElementById('family-tree-container').innerHTML = 
          '<p style="text-align:center; padding-top:20px;">Aucune donnée familiale proche à afficher. Vérifiez votre profil et vos relations.</p>';
        return;
      }
      familyTreeInstance = initFamilyTree('family-tree-container', transformFamilyData(dataToDisplay));
    });
  }

  async function renderGraphView() {
    if (cyInstance) {
      cyInstance.destroy();
      cyInstance = null;
    }
    document.getElementById('tree-view').style.display = 'none';
    document.getElementById('graph-view').style.display = 'block';
    import('./js/family-tree/graph-view').then(async ({ initGraph, transformGraphData }) => {
      const dataToDisplay = await getPreparedData();
      if (dataToDisplay.length === 0 && currentDataScope === 'personal') {
         document.getElementById('graph-container').innerHTML = 
           '<p style="text-align:center; padding-top:20px;">Aucune donnée familiale proche à afficher pour le graphe.</p>';
        return;
      }
      const graphData = transformGraphData(dataToDisplay);
      cyInstance = initGraph('graph-container', graphData);
      // Re-attach algorithm button handlers if cyInstance is new
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
        if (currentActiveView === 'tree') {
          renderFamilyTree();
        } else if (currentActiveView === 'graph') {
          renderGraphView();
        }
        updateActiveButtons();
      });
    });

    document.querySelectorAll('.scope-button').forEach(button => {
      button.addEventListener('click', (e) => {
        currentDataScope = e.target.getAttribute('data-scope');
        if (currentActiveView === 'tree') {
          renderFamilyTree();
        } else if (currentActiveView === 'graph') {
          renderGraphView();
        }
        updateActiveButtons();
      });
    });
  }
  
  function setupAlgorithmButtons(cy) { // Pass cy instance
    const runDijkstraButton = document.getElementById('run-dijkstra');
    if (runDijkstraButton) {
      runDijkstraButton.onclick = () => { // Use onclick to overwrite previous if any, or manage listeners carefully
        const startPersonId = document.getElementById('start-person').value;
        const endPersonId = document.getElementById('end-person').value;
        if (startPersonId && endPersonId && cy) {
          const startNode = cy.getElementById(startPersonId);
          const endNode = cy.getElementById(endPersonId);
          if (startNode.length && endNode.length) { // Cytoscape returns collections
            initDijkstra(cy, startNode, endNode);
            updateRightSidebar();
          } else {
            console.warn("Dijkstra: Start or end node not found in current graph view.");
          }
        }
      };
    }

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
        // Kruskal doesn't strictly need a start node from UI for its logic, but your UI has one
        // const startPersonId = document.getElementById('kruskal-start-person').value;
        if (cy) { // Kruskal operates on the whole graph
            initKruskal(cy); // Pass full cy, startNode might be optional or handled inside
            updateRightSidebar();
        }
      };
    }
  }


  async function renderRoute() { // Now async
    const path = window.location.pathname;
    // const userProfile = authService.getCurrentUserProfile(); // Use service
    const isAuthenticated = authService.isAuthenticated(); // Use service
    const isLoginPage = path === '/login';

    if (!isAuthenticated && !isLoginPage) {
      history.replaceState(null, null, '/login');
      return renderRoute(); // Recursive call to re-evaluate
    }

    if (isAuthenticated && isLoginPage) {
      history.replaceState(null, null, '/');
      return renderRoute(); // Recursive call
    }

    app.innerHTML = `${renderNavbar()}`;

    // Main layout structure
    let mainLayoutHtml = '';
    if (path === '/') {
        mainLayoutHtml = `
            ${renderLeftSidebar()}
            ${renderMainContent()} {/* This now includes the view/scope buttons */}
            ${renderRightSidebar()}
        `;
    } else if (path === '/profile') {
        // Profile page might not need sidebars or a different layout
        mainLayoutHtml = `<div id="main-content-profile" class="profile-container">${renderProfilePage()}</div>`;
    } else if (path === '/login') {
        mainLayoutHtml = `<div id="main-content-login" class="login-container">${renderLoginPage()}</div>`;
    } else {
        mainLayoutHtml = `<div id="main-content-404"><h2>404 - Page non trouvée</h2></div>`;
    }
    app.innerHTML += mainLayoutHtml;


    // Content-specific initializations
    if (path === '/') {
        // Initial view rendering
        if (currentActiveView === 'tree') {
            await renderFamilyTree();
        } else {
            await renderGraphView(); // This will also setup algorithm buttons via its callback
        }
        setupMainViewControls();
        updateActiveButtons();

        const familyDataForSelect = await familyDataService.getAllFamilyData();

        // Setup algorithm selection forms (populating dropdowns)
        // These don't depend on cyInstance directly for setup, only for execution
        const dijkstraButton = document.getElementById('dijkstra-button');
        if (dijkstraButton) {
          dijkstraButton.addEventListener('click', () => {
            const dijkstraForm = document.getElementById('dijkstra-form');
            dijkstraForm.style.display = dijkstraForm.style.display === 'none' ? 'block' : 'none';
            populateAlgorithmSelects(['start-person', 'end-person'], familyDataForSelect);
          });
        }

        const bellmanFordButton = document.getElementById('bellman-ford-button');
        if (bellmanFordButton) {
          bellmanFordButton.addEventListener('click', () => {
            const bellmanFordForm = document.getElementById('bellman-ford-form');
            bellmanFordForm.style.display = bellmanFordForm.style.display === 'none' ? 'block' : 'none';
            populateAlgorithmSelects(['bellman-ford-start-person', 'bellman-ford-end-person'], familyDataForSelect);
          });
        }

        const primButton = document.getElementById('prim-button');
        if (primButton) {
          primButton.addEventListener('click', () => {
            const primForm = document.getElementById('prim-form');
            primForm.style.display = primForm.style.display === 'none' ? 'block' : 'none';
            populateAlgorithmSelects(['prim-start-person'], familyDataForSelect);
          });
        }
        
        const kruskalButton = document.getElementById('kruskal-button');
        if (kruskalButton) {
          kruskalButton.addEventListener('click', () => {
            const kruskalForm = document.getElementById('kruskal-form');
            kruskalForm.style.display = kruskalForm.style.display === 'none' ? 'block' : 'none';
            populateAlgorithmSelects(['kruskal-start-person'], familyDataForSelect); 
          });
        }
        // Initial setup of algorithm buttons (will be re-attached if graph view re-renders)
        if (cyInstance) {
            setupAlgorithmButtons(cyInstance);
        }


    } else if (path === '/profile') {
        setupProfileFormHandler();
    } else if (path === '/login') {
        setupLoginFormHandler();
    }
  }

  function populateAlgorithmSelects(selectIds, data) {
    selectIds.forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            selectElement.innerHTML = ''; // Clear previous options
            data.forEach(person => {
                const option = document.createElement('option');
                option.value = person.id;
                option.textContent = person.name;
                selectElement.appendChild(option);
            });
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
  renderRoute();
}

function updateRightSidebar() {
  const rightSidebar = document.getElementById('right-sidebar');
  if (rightSidebar) {
    rightSidebar.innerHTML = renderRightSidebar();
  }
}
// END OF FILE: src/router.js