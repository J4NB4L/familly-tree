export function renderNavbar() {
  const stored = localStorage.getItem('userProfile');
  const user = stored ? JSON.parse(stored) : null;

  const userSection = user
    ? `
      <a href="/profile" data-link class="user-info">
        <img src="${user.img}" alt="Photo de ${user.name}" class="user-avatar" />
        <span>${user.name}</span>
      </a>
    `
    : `<a href="/login" data-link>Connexion</a>`;

  return `
    <div id="navbar">
      <h1>Arbre Généalogique Familial</h1>
      <div id="navbar-menu">
        <a href="/" data-link>Accueil</a>
        ${userSection}
      </div>
    </div>
  `;
}
