export function renderMainContent() {
  return `
    <div id="main-content">
      <div class="view-buttons">
        <button class="view-button" data-view="tree">Arbre Généalogique</button>
        <button class="view-button" data-view="graph">Graphe des Relations</button>
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
