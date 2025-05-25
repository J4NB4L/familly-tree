// frontend/src/components/login.js (ou LoginPage.js)
import { authService } from '../services/authService';
// import { familyDataService } from '../services/familyDataService'; // Moins direct ici

export function renderLoginPage() {
  return `
    <div class="container-card" style="max-width: 500px; margin: 40px auto;">
      <h2>Connexion</h2>
      <form id="login-form">
        <label for="email">Email :</label>
        <input type="email" id="email" name="email" required />

        <label for="password">Mot de passe :</label>
        <input type="password" id="password" name="password" required />

        <button type="submit">Se connecter</button>
        <p style="text-align: center; margin-top: 15px;">
          Pas encore de compte ? <a href="/register" data-link>S'inscrire</a>
        </p>
      </form>
      <div id="login-error" style="color: red; margin-top: 10px;"></div>
    </div>
  `;
}

export function setupLoginFormHandler() {
  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = ''; // Clear previous errors
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const userProfileFromTree = await authService.login(email, password); // authService.login gère maintenant la synchro avec l'arbre
      if (userProfileFromTree) {
        window.location.href = '/'; // Ou la page de profil /dashboard
      } else {
        // Ce cas ne devrait pas arriver si authService.login lève une erreur en cas d'échec
        errorDiv.textContent = "Échec de la connexion. Profil non chargé.";
      }
    } catch (error) {
      console.error("Login failed:", error);
      errorDiv.textContent = error.response?.data?.message || "Échec de la connexion. Vérifiez vos identifiants.";
    }
  });
}