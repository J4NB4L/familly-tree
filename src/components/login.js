// src/components/login.js
import { authService } from '../services/authService';
import { familyDataService } from '../services/familyDataService'; // Import familyDataService

export function renderLoginPage() {
  return `
    <div class="container-card">
      <h2>Connexion</h2>
      <form id="login-form">
        <label>Nom complet :</label>
        <input type="text" name="name" required />

        <label>Année de naissance :</label>
        <input type="number" name="birthYear" required min="1900" max="2025" />

        <label>Email (Gmail) :</label>
        <input type="email" name="email" pattern=".+@gmail\\.com" required />

        <label>Genre :</label>
        <select name="gender" required>
          <option value="">-- Choisissez --</option>
          <option value="male">Homme</option>
          <option value="female">Femme</option>
        </select>

        <label>Photo (URL ou fichier) :</label>
        <input type="file" name="imgFile" accept="image/*" />
        <input type="url" name="imgUrl" placeholder="ou collez une URL d'image" />

        <button type="submit">Se connecter</button>
      </form>
    </div>
  `;
}

export function setupLoginFormHandler() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    // ... (formData retrieval as before) ...
    const name = formData.get('name');
    const birthYear = parseInt(formData.get('birthYear'), 10);
    const gmail = formData.get('email');
    const gender = formData.get('gender');
    let img = '/assets/avatars/default.svg';
    // ... (imgFile and imgUrl logic as before to set img) ...
    const imgFile = formData.get('imgFile');
    const imgUrl = formData.get('imgUrl');
    if (imgFile && imgFile.size > 0) {
        img = await toBase64(imgFile);
      } else if (imgUrl) {
        img = imgUrl;
      }

    try {
      const userProfile = await authService.login(name, birthYear, gmail, gender, img);
      // Ensure the new user profile is also reflected in the main familyData
      // This is important if the user is "new" to the dataset
      await familyDataService.updatePersonInFamilyData(userProfile);
      
      // Ensure dummy data is loaded if this is the first time (or handled by getAllFamilyData)
      await familyDataService.getAllFamilyData(); // This ensures it's loaded/initialized

      window.location.href = '/profile'; // Or use router navigateTo
    } catch (error) {
      console.error("Login failed:", error);
      // Handle login error display
    }
  });

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });
  }
}