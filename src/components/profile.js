// src/components/profile.js
import { authService } from '../services/authService';
import { familyDataService } from '../services/familyDataService';

// Helper pour peupler les menus déroulants des relations
// `data` est la liste complète des personnes (FamilyPerson[])
// `currentValue` est l'ID (UUID string) actuellement sélectionné pour ce champ
// `excludeIds` est un tableau d'IDs (UUID strings) à exclure des options (ex: soi-même)
async function populateRelationSelect(selectElementId, data, currentValue, excludeIds = [], filterGender = null) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return;

  selectElement.innerHTML = '<option value="">-- Aucun(e) --</option>'; // Option pour ne rien sélectionner

  let filteredData = data;
  if (filterGender) {
    filteredData = data.filter(p => p.gender === filterGender);
  }

  filteredData.forEach(person => {
    if (excludeIds.includes(person.id)) return;

    const option = document.createElement('option');
    option.value = person.id; // UUID
    option.textContent = `${person.name} (${person.birthYear || 'N/A'})`;
    if (person.id === currentValue) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

// Helper pour gérer les sélections multiples (pour pids)
function setupPidsSelect(selectElementId, allPeopleData, currentPids, excludeIds = []) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;

    selectElement.innerHTML = ''; // Clear existing options

    allPeopleData.forEach(person => {
        if (excludeIds.includes(person.id)) return;

        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = `${person.name} (${person.birthYear || 'N/A'})`;
        if (currentPids.includes(person.id)) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
    // Ici, tu pourrais initialiser une librairie de 'select multiple' si tu en utilises une (ex: Select2, Choices.js)
    // Pour un select multiple HTML standard, l'attribut `multiple` doit être sur la balise <select>.
}


export function renderProfilePage() {
  // Essayer de charger le profil frais, sinon utiliser le cache.
  // Cette logique sera dans setupProfileFormHandler pour le chargement initial.
  const user = authService.getCurrentUserProfile() || {
    id: '', name: '', fid: null, mid: null, pids: [], gender: 'unknown',
    birthYear: '', img: '/assets/avatars/default.svg', gmail: ''
  };

  return `
    <div class="container-card">
      <div class="profile-header">
        <h2>Votre Profil</h2>
        <button id="logout-button" class="logout-button">Déconnexion</button>
      </div>
      <form id="profile-form">
        <div style="grid-column: 1 / -1; text-align: center;">
            <img src="${user.img}" alt="Photo de profil" id="profile-image-preview" style="max-width: 150px; height: 150px; border-radius: 50%; margin-bottom: 15px; object-fit: cover; border: 3px solid #4299e1;" />
        </div>

        <label for="profile-name">Nom complet :</label>
        <input type="text" id="profile-name" name="name" value="${user.name || ''}" required />

        <label for="profile-birthYear">Année de naissance :</label>
        <input type="number" id="profile-birthYear" name="birthYear" value="${user.birthYear || ''}" min="1800" max="${new Date().getFullYear()}" />

        <label for="profile-gmail">Email (associé à l'arbre) :</label>
        <input type="email" id="profile-gmail" name="gmail" value="${user.gmail || ''}" pattern=".+@.+\\..+" />

        <label for="profile-gender">Genre :</label>
        <select id="profile-gender" name="gender" required>
          <option value="unknown" ${user.gender === 'unknown' ? 'selected' : ''}>Non spécifié</option>
          <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Homme</option>
          <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Femme</option>
        </select>

        <label for="profile-imgFile">Changer la photo (fichier) :</label>
        <input type="file" id="profile-imgFile" name="imgFile" accept="image/*" />
        
        <label for="profile-imgUrl">Changer la photo (URL) :</label>
        <input type="url" id="profile-imgUrl" name="imgUrl" placeholder="Ou collez une URL d'image" value="${(user.img && user.img.startsWith('http')) ? user.img : ''}"/>

        <hr style="grid-column: 1 / -1; margin: 20px 0; border-color: #e2e8f0;"/>
        <h3 style="grid-column: 1 / -1; color: #2d3748; font-weight:600;">Relations Familiales</h3>

        <label for="profile-fid">Père :</label>
        <select id="profile-fid" name="fid"></select>

        <label for="profile-mid">Mère :</label>
        <select id="profile-mid" name="mid"></select>

        <label for="profile-pids">Conjoint(s) :</label>
        <select id="profile-pids" name="pids" multiple style="min-height: 100px;"></select>
        <small style="grid-column: 1 / -1; text-align:center;">Maintenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs conjoints.</small>


        <button type="submit" style="grid-column: 1 / -1;">Mettre à jour le profil</button>
      </form>
      <div id="profile-message" style="margin-top: 15px; text-align: center;"></div>
    </div>
  `;
}

export async function setupProfileFormHandler() {
  const form = document.getElementById('profile-form');
  const messageDiv = document.getElementById('profile-message');
  if (!form) return;

  let currentUserProfile = authService.getCurrentUserProfile(); // Depuis le cache
  // Essayer de charger le profil frais du serveur
  try {
    messageDiv.textContent = "Chargement du profil...";
    const freshProfile = await authService.fetchUserProfileFromServer();
    if (freshProfile) {
      currentUserProfile = freshProfile;
    }
    messageDiv.textContent = "";
  } catch (error) {
    console.error("Erreur au chargement du profil frais:", error);
    messageDiv.textContent = "Erreur au chargement du profil. Certaines données peuvent être obsolètes.";
    if (!currentUserProfile) { // Si même le cache est vide (improbable après login)
        window.location.href = '/login'; // Rediriger si pas de profil du tout
        return;
    }
  }
  
  // Pré-remplir le formulaire avec les données du profil chargé
  document.getElementById('profile-name').value = currentUserProfile.name || '';
  document.getElementById('profile-birthYear').value = currentUserProfile.birthYear || '';
  document.getElementById('profile-gmail').value = currentUserProfile.gmail || '';
  document.getElementById('profile-gender').value = currentUserProfile.gender || 'unknown';
  document.getElementById('profile-image-preview').src = currentUserProfile.img || '/assets/avatars/default.svg';
  if (currentUserProfile.img && currentUserProfile.img.startsWith('http')) {
      document.getElementById('profile-imgUrl').value = currentUserProfile.img;
  }


  // Charger toutes les personnes pour les menus déroulants
  let allPeople = [];
  try {
    allPeople = await familyDataService.getAllFamilyData();
  } catch (error) {
    console.error("Impossible de charger la liste des personnes pour les relations:", error);
    messageDiv.textContent = "Erreur: Impossible de charger les options de relations.";
  }

  // Peupler les selects pour les relations
  // Exclure l'utilisateur lui-même des options pour père, mère, conjoint.
  const selfId = [currentUserProfile.id];
  await populateRelationSelect('profile-fid', allPeople, currentUserProfile.fid, selfId, 'male');
  await populateRelationSelect('profile-mid', allPeople, currentUserProfile.mid, selfId, 'female');
  setupPidsSelect('profile-pids', allPeople, currentUserProfile.pids || [], selfId);


  const imgFileInput = document.getElementById('profile-imgFile');
  const imgPreview = document.getElementById('profile-image-preview');
  imgFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              imgPreview.src = e.target.result;
              document.getElementById('profile-imgUrl').value = ''; // Effacer l'URL si un fichier est choisi
          }
          reader.readAsDataURL(file);
      }
  });
   document.getElementById('profile-imgUrl').addEventListener('input', (event) => {
        const url = event.target.value;
        if (url) {
            imgPreview.src = url; // Met à jour l'aperçu dynamiquement
            if (imgFileInput.value) imgFileInput.value = ''; // Effacer le fichier si une URL est entrée
        } else if (!imgFileInput.files[0]) { // Si l'URL est effacée et pas de fichier
            imgPreview.src = currentUserProfile.img || '/assets/avatars/default.svg'; // Remettre l'image actuelle ou défaut
        }
    });


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = "Mise à jour en cours...";
    const formData = new FormData(form);
    
    const name = formData.get('name');
    const birthYear = formData.get('birthYear') ? parseInt(formData.get('birthYear'), 10) : undefined;
    const gmail = formData.get('gmail');
    const gender = formData.get('gender');
    
    const fid = formData.get('fid') || null; // Sera l'UUID string ou null
    const mid = formData.get('mid') || null; // Sera l'UUID string ou null
    
    // Pour un select multiple, get() ne retourne que la première. Il faut getAll().
    const pids = formData.getAll('pids'); // Array d'UUIDs strings

    let imgData = currentUserProfile.img || '/assets/avatars/default.svg'; // Conserver l'image actuelle par défaut
    const imgFile = formData.get('imgFile');
    const imgUrl = formData.get('imgUrl');

    if (imgFile && imgFile.size > 0) {
      imgData = await toBase64(imgFile);
    } else if (imgUrl && imgUrl.trim() !== '') {
      imgData = imgUrl.trim();
    }

    const updatedProfileData = {
      ...currentUserProfile, // Base avec ID, et autres champs non modifiables directement
      name,
      birthYear,
      gmail,
      gender,
      img: imgData,
      fid,
      mid,
      pids,
    };

    try {
      const savedProfile = await authService.updateCurrentUserProfileInFamilyTree(updatedProfileData);
      currentUserProfile = savedProfile; // Mettre à jour la variable locale avec la réponse du serveur
      messageDiv.textContent = 'Profil mis à jour avec succès !';
      messageDiv.style.color = 'green';
      // Optionnel: re-remplir le formulaire avec `savedProfile` si le backend a modifié des choses
      // ou simplement faire confiance que `currentUserProfile` est maintenant à jour.
    } catch (error) {
      console.error("Profile update failed:", error);
      messageDiv.textContent = error.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
      messageDiv.style.color = 'red';
    }
  });

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      authService.logout();
      window.location.href = '/login'; // Rediriger vers la page de connexion
    });
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result); // Retourne la Data URL complète
    reader.onerror = (error) => reject(error);
  });
}