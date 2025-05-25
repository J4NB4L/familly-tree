// src/components/login.js
import { authService } from '../services/authService';
import { familyDataService } from '../services/familyDataService'; // Import familyDataService

export function renderLoginPage() { /* ... no change ... */ }

export function setupLoginFormHandler() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... (formData retrieval as before) ...
    const name = formData.get('name');
    const birthYear = parseInt(formData.get('birthYear'), 10);
    const gmail = formData.get('email');
    const gender = formData.get('gender');
    let img = '/assets/avatars/default.svg';
    // ... (imgFile and imgUrl logic as before to set img) ...
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

  function toBase64(file) { /* ... no change ... */ }
}