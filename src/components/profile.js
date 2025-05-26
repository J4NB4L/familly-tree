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

// Helper pour gérer la sélection du conjoint (pour pids)
function setupPidsSelect(selectElementId, allPeopleData, currentPids, excludeIds = []) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">-- Aucun(e) --</option>'; // Option pour ne rien sélectionner

    allPeopleData.forEach(person => {
        if (excludeIds.includes(person.id)) return;

        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = `${person.name} (${person.birthYear || 'N/A'})`;
        // Sélectionner le premier conjoint s'il y en a plusieurs
        if (currentPids.length > 0 && currentPids[0] === person.id) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}


export function renderProfilePage() {
  // Essayer de charger le profil frais, sinon utiliser le cache.
  // Cette logique sera dans setupProfileFormHandler pour le chargement initial.
  const user = authService.getCurrentUserProfile() || {
    id: '', name: '', fid: null, mid: null, pids: [], gender: 'unknown',
    birthYear: '', img: '/assets/avatars/default.svg', gmail: ''
  };

  return `
    <div style="background-color: #f8f9fa; min-height: 100vh; padding: 20px; overflow-x: hidden;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <h1 style="color: #333; font-size: 28px; margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">Profil utilisateur</h1>
        
        <div style="display: flex; flex-direction: column; background-color: white; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); overflow: hidden; padding: 0; width: 100%; max-height: calc(100vh - 120px);">
          <div style="display: flex; flex-wrap: wrap;">
            <!-- Colonne de gauche avec photo -->
            <div style="width: 280px; padding: 30px; text-align: center; border-right: 1px solid #e2e8f0; flex-shrink: 0;">
              <div style="position: relative; width: 180px; height: 180px; margin: 0 auto 20px;">
                <img src="${user.img}" alt="Photo de profil" id="profile-image-preview" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #4299e1; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
                <div style="position: absolute; bottom: 5px; right: 5px; background-color: #4299e1; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" onclick="document.getElementById('profile-imgFile').click()">
                  <span style="color: white; font-size: 24px;">+</span>
                </div>
              </div>
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #333; font-weight: 600;">${user.name || 'Votre nom'}</h2>
              
              <!-- Bouton de déconnexion -->
              <button id="logout-button" style="width: 100%; margin-top: 20px; background-color: #f56565; color: white; border: none; padding: 12px 0; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s ease;">Déconnexion</button>
              
              <!-- Champs cachés pour l'upload d'image -->
              <input type="file" id="profile-imgFile" name="imgFile" accept="image/*" style="display:none" />
              <input type="url" id="profile-imgUrl" name="imgUrl" style="display:none" value="${(user.img && user.img.startsWith('http')) ? user.img : ''}"/>
            </div>
            
            <!-- Colonne principale avec informations -->
            <div style="flex: 1; padding: 30px; min-width: 300px;">
              <h3 style="margin: 0 0 25px; color: #2d3748; font-size: 20px; font-weight: 600;">Informations personnelles</h3>
              
              <form id="profile-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; row-gap: 20px;">
                <!-- Informations personnelles -->
                <div style="display: flex; align-items: center;">
                  <span style="width: 180px; color: #4a5568; font-size: 16px; font-weight: 500;">Genre:</span>
                  <select id="profile-gender" name="gender" style="flex: 1; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; background-color: white; font-size: 16px;">
                    <option value="unknown" ${user.gender === 'unknown' ? 'selected' : ''}>Non spécifié</option>
                    <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Homme</option>
                    <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Femme</option>
                  </select>
                </div>
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 180px; color: #4a5568; font-size: 16px; font-weight: 500;">Date de naissance:</span>
                  <input type="number" id="profile-birthYear" name="birthYear" value="${user.birthYear || ''}" min="1800" max="${new Date().getFullYear()}" style="flex: 1; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 16px;" />
                </div>
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 180px; color: #4a5568; font-size: 16px; font-weight: 500;">Email:</span>
                  <input type="email" id="profile-gmail" name="gmail" value="${user.gmail || ''}" pattern=".+@.+\\..+" style="flex: 1; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 16px;" />
                </div>
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 180px; color: #4a5568; font-size: 16px; font-weight: 500;">Nom complet:</span>
                  <input type="text" id="profile-name" name="name" value="${user.name || ''}" required style="flex: 1; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 16px;" />
                </div>
                
                <!-- Section Relations Familiales -->
                <div style="grid-column: 1 / -1; margin-top: 15px;">
                  <h3 style="color: #2d3748; font-size: 20px; font-weight: 600; margin: 15px 0; padding-top: 20px; border-top: 2px solid #e2e8f0;">Relations Familiales</h3>
                </div>
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 180px; color: #4a5568; font-size: 16px; font-weight: 500;">Père:</span>
                  <select id="profile-fid" name="fid" style="flex: 1; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; background-color: white; font-size: 16px;"></select>
                </div>
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 180px; color: #4a5568; font-size: 16px; font-weight: 500;">Mère:</span>
                  <select id="profile-mid" name="mid" style="flex: 1; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; background-color: white; font-size: 16px;"></select>
                </div>
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 180px; color: #4a5568; font-size: 16px; font-weight: 500;">Conjoint:</span>
                  <select id="profile-pids" name="pids" style="flex: 1; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; background-color: white; font-size: 16px;">
                    <!-- Options seront ajoutées dynamiquement -->
                  </select>
                </div>
                
                <!-- Bouton de mise à jour -->
                <div style="grid-column: 1 / -1; text-align: right; margin-top: 20px;">
                  <button type="submit" style="background-color: #4299e1; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Mettre à jour</button>
                </div>
              </form>
              
              <div id="profile-message" style="margin-top: 15px; padding: 12px; border-radius: 6px; font-size: 16px; font-weight: 500; text-align: center;"></div>
            </div>
          </div>
        </div>
      </div>
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