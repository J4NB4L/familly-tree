//---> PATH: src/components/maincontent.js
export function renderMainContent() {
  return `
    <div id="main-content-area">
      <div class="view-controls">
        <div class="view-buttons">
          <button class="view-button active-view-btn" data-view="tree">Arbre Généalogique</button>
          <button class="view-button" data-view="graph">Graphe des Relations</button>
        </div>
        <div class="scope-buttons">
          <button class="scope-button active-scope-btn" data-scope="full">Voir Toute la Famille</button>
          <button class="scope-button" data-scope="personal">Voir Ma Famille Proche</button>
        </div>
      </div>
      <div class="container-card" id="tree-view">
        <h2>Arbre Généalogique</h2>
        <div id="family-tree-container"></div>
      </div>
      <div class="container-card" id="graph-view" style="display: none;">
        <h2>Graphe des Relations</h2>
        <div id="graph-container"></div>
      </div>
    </div>
  `;
}
// END OF FILE: src/components/maincontent.js