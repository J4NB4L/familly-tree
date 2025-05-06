export function renderLeftSidebar() {
  return `
    <div id="left-sidebar">
      <h3 class="sidebar-title">Recherche</h3>
      <ul class="sidebar-menu">
        <li>
          <button id="dijkstra-button" class="sidebar-button">Dijkstra</button>
          <div id="dijkstra-form" class="search-form" style="display: none;">
            <h3 class="sidebar-title">Dijkstra</h3>
            <label>Personne de départ :</label>
            <select id="start-person"></select>
            <label>Personne de fin :</label>
            <select id="end-person"></select>
            <button id="run-dijkstra">Lancer Dijkstra</button>
          </div>
        </li>
        <li>
          <button id="bellman-ford-button" class="sidebar-button">Bellman-Ford</button>
          <div id="bellman-ford-form" class="search-form" style="display: none;">
            <h3 class="sidebar-title">Bellman-Ford</h3>
            <label>Personne de départ :</label>
            <select id="bellman-ford-start-person"></select>
            <label>Personne de fin :</label>
            <select id="bellman-ford-end-person"></select>
            <button id="run-bellman-ford">Lancer Bellman-Ford</button>
          </div>
        </li>
      </ul>
      <h3 class="sidebar-title" style="margin-top: 30px;">Sous-famille</h3>
      <ul class="sidebar-menu">
        <li>
          <button id="prim-button" class="sidebar-button">Prim</button>
          <div id="prim-form" class="search-form" style="display: none;">
            <h3 class="sidebar-title">Prim</h3>
            <label>Personne de départ :</label>
            <select id="prim-start-person"></select>
            <button id="run-prim">Lancer Prim</button>
          </div>
        </li>
        <li>
          <button id="kruskal-button" class="sidebar-button">Kruskal</button>
          <div id="kruskal-form" class="search-form" style="display: none;">
            <h3 class="sidebar-title">Kruskal</h3>
            <label>Personne de départ :</label>
            <select id="kruskal-start-person"></select>
            <button id="run-kruskal">Lancer Kruskal</button>
          </div>
        </li>
      </ul>
    </div>
  `;
}
