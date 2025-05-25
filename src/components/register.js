// frontend/src/components/register.js
import { authService } from '../services/authService';

export function renderRegisterPage() {
  return `
    <div class="container-card" style="max-width: 500px; margin: 40px auto;">
      <h2>Inscription</h2>
      <form id="register-form">
        <label for="firstName">Prénom :</label>
        <input type="text" id="firstName" name="firstName" required />

        <label for="lastName">Nom :</label>
        <input type="text" id="lastName" name="lastName" required />
        
        <label for="email">Email :</label>
        <input type="email" id="email" name="email" required />

        <label for="password">Mot de passe :</label>
        <input type="password" id="password" name="password" required minlength="6" />

        <label for="confirmPassword">Confirmer le mot de passe :</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required />

        <button type="submit">S'inscrire</button>
        <p style="text-align: center; margin-top: 15px;">
          Déjà un compte ? <a href="/login" data-link>Se connecter</a>
        </p>
      </form>
      <div id="register-error" style="color: red; margin-top: 10px;"></div>
    </div>
  `;
}

export function setupRegisterFormHandler() {
  const form = document.getElementById('register-form');
  const errorDiv = document.getElementById('register-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    const formData = new FormData(e.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      errorDiv.textContent = "Les mots de passe ne correspondent pas.";
      return;
    }

    try {
      await authService.register({ email, password, firstName, lastName });
      // authService.register gère la création du profil dans l'arbre.
      window.location.href = '/'; // Ou /profile pour compléter les infos
    } catch (error) {
      console.error("Registration failed:", error);
      errorDiv.textContent = error.response?.data?.message || "Échec de l'inscription.";
    }
  });
}