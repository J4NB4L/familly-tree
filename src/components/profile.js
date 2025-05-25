// src/components/profile.js
import { authService } from '../services/authService';
import { familyDataService } from '../services/familyDataService';

export function renderProfilePage() {
  const user = authService.getCurrentUserProfile() || {
    // Default structure if no profile exists, to prevent render errors
    id: null,
    name: '',
    fid: null,
    mid: null,
    pids: [],
    gender: '',
    birthYear: '',
    img: '/assets/avatars/default.svg',
    gmail: ''
  };

  return `
    <div class="container-card">
      <div class="profile-header">
        <h2>Votre Profil</h2>
        <button id="logout-button" class="logout-button">Déconnexion</button>
      </div>
      <form id="profile-form">
        <img src="${user.img}" alt="Photo de profil" style="max-width: 150px; border-radius: 50%; margin-bottom: 15px; object-fit: cover; border: 3px solid #4299e1;" />

        <label>Nom :</label>
        <input type="text" name="name" value="${user.name || ''}" required />

        <label>Année de naissance :</label>
        <input type="number" name="birthYear" value="${user.birthYear || ''}" required min="1900" max="${new Date().getFullYear()}" />

        <label>Email (Gmail) :</label>
        <input type="email" name="gmail" value="${user.gmail || ''}" required pattern=".+@gmail\\.com" />

        <label>Genre :</label>
        <select name="gender" required>
          <option value="">-- Choisissez --</option>
          <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Homme</option>
          <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Femme</option>
        </select>

        <label>Changer la photo :</label>
        <input type="file" name="imgFile" accept="image/*" />
        <input type="url" name="imgUrl" placeholder="ou collez une URL" />

        <button type="submit">Mettre à jour</button>
      </form>

      <div class="family-relations scrollable-container">
        <h3>Relations Familiales</h3>
        <div class="family-selection-menus">
          <div class="family-selection-menu">
            <button type="button" id="add-spouse-button" class="sidebar-button">Ajouter un conjoint</button>
            <div id="add-spouse-form" class="search-form" style="display: none;">
              <h3 class="sidebar-title">Ajouter un conjoint</h3>
              <label>Nom du conjoint :</label>
              <select id="spouse-select"></select>
              <button id="add-spouse-confirm">Confirmer</button>
            </div>
          </div>
          <div class="family-selection-menu">
            <button type="button" id="add-father-button" class="sidebar-button">Ajouter un père</button>
            <div id="add-father-form" class="search-form" style="display: none;">
              <h3 class="sidebar-title">Ajouter un père</h3>
              <label>Nom du père :</label>
              <select id="father-select"></select>
              <button id="add-father-confirm">Confirmer</button>
            </div>
          </div>
          <div class="family-selection-menu">
            <button type="button" id="add-mother-button" class="sidebar-button">Ajouter une mère</button>
            <div id="add-mother-form" class="search-form" style="display: none;">
              <h3 class="sidebar-title">Ajouter une mère</h3>
              <label>Nom de la mère :</label>
              <select id="mother-select"></select>
              <button id="add-mother-confirm">Confirmer</button>
            </div>
          </div>
          <div class="family-selection-menu">
            <button type="button" id="add-child-button" class="sidebar-button">Ajouter un enfant</button>
            <div id="add-child-form" class="search-form" style="display: none;">
              <h3 class="sidebar-title">Ajouter un enfant</h3>
              <label>Nombre d'enfants :</label>
              <input type="number" id="child-count" min="1" max="10" value="1" />
              <button id="generate-child-menus">Générer les menus</button>
              <div id="child-menus"></div>
              <button id="add-child-confirm" style="display: none;">Confirmer l'ajout des enfants</button>
            </div>
          </div>
        </div>
      </div>

      <div id="family-relations-container"></div>
    </div>
  `;
}

export function setupProfileFormHandler() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result); // Keep the full data URI
      reader.onerror = reject;
    });
  }

  function populateSelectMenu(selectId, data, excludeId = null, filterGender = null) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">-- Choisissez --</option>';
    let filteredData = data;
    if (filterGender) {
        filteredData = data.filter(p => p.gender === filterGender);
    }

    filteredData.forEach(person => {
      if (person.id === excludeId) return;

      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = `${person.name} (né en ${person.birthYear || 'N/A'})`;
      selectElement.appendChild(option);
    });
  }

  // Load initial data for select menus
  (async () => {
    const allFamilyData = await familyDataService.getAllFamilyData();
    const currentUserProfile = authService.getCurrentUserProfile();
    const currentUserId = currentUserProfile ? currentUserProfile.id : null;

    if (!currentUserProfile) {
        console.error("Profile setup: No current user profile found. Cannot populate relation selects.");
        return;
    }

    populateSelectMenu('spouse-select', allFamilyData, currentUserId);
    populateSelectMenu('father-select', allFamilyData, currentUserId, 'male');
    populateSelectMenu('mother-select', allFamilyData, currentUserId, 'female');
    // Child select menus are populated dynamically by 'generate-child-menus' button
  })();


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const name = formData.get('name');
    const birthYear = parseInt(formData.get('birthYear'), 10);
    const gmail = formData.get('gmail');
    const gender = formData.get('gender');

    let existingUserProfile = authService.getCurrentUserProfile() || {}; // Ensure there's a base
    let img = existingUserProfile.img || '/assets/avatars/default.svg';
    
    const imgFile = formData.get('imgFile');
    const imgUrl = formData.get('imgUrl');

    if (imgFile && imgFile.size > 0) {
      img = await toBase64(imgFile);
    } else if (imgUrl && imgUrl.trim() !== '') {
      img = imgUrl.trim();
    }

    const updatedProfileData = {
      ...existingUserProfile, // Preserve existing IDs and relationship fields (fid, mid, pids)
      id: existingUserProfile.id || Date.now(), // Ensure ID exists
      name,
      gender,
      birthYear,
      img,
      gmail
      // Note: fid, mid, pids are managed by relation handlers, not this form directly
    };

    authService.updateCurrentUserProfile(updatedProfileData);
    await familyDataService.updatePersonInFamilyData(updatedProfileData);

    alert('Profil mis à jour avec succès !');
    location.reload();
  });

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      authService.logout();
      window.location.href = '/login';
    });
  }

  // --- Relation Section Toggles & Handlers ---

  // Add Spouse
  const addSpouseButton = document.getElementById('add-spouse-button');
  const addSpouseForm = document.getElementById('add-spouse-form');
  const addSpouseConfirmButton = document.getElementById('add-spouse-confirm');

  if (addSpouseButton && addSpouseForm) {
    addSpouseButton.addEventListener('click', () => {
      addSpouseForm.style.display = addSpouseForm.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (addSpouseConfirmButton) {
    addSpouseConfirmButton.addEventListener('click', async () => {
      const spouseId = parseInt(document.getElementById('spouse-select').value, 10);
      if (!spouseId || isNaN(spouseId)) { 
        alert('Veuillez sélectionner un conjoint.');
        return;
      }
      const userProfile = authService.getCurrentUserProfile();
      if (!userProfile) { alert("Utilisateur non connecté."); return; }

      const updatedUserProfile = await familyDataService.addSpouse(userProfile, spouseId);
      if (updatedUserProfile) {
        authService.updateCurrentUserProfile(updatedUserProfile); // Update profile in localStorage
        alert('Conjoint ajouté avec succès !');
        location.reload();
      } else { 
        alert('Erreur lors de l\'ajout du conjoint. Vérifiez que la personne sélectionnée existe.');
      }
    });
  }

  // Add Father
  const addFatherButton = document.getElementById('add-father-button');
  const addFatherForm = document.getElementById('add-father-form');
  const addFatherConfirmButton = document.getElementById('add-father-confirm');

  if (addFatherButton && addFatherForm) {
    addFatherButton.addEventListener('click', () => {
      addFatherForm.style.display = addFatherForm.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (addFatherConfirmButton) {
    addFatherConfirmButton.addEventListener('click', async () => {
      const fatherId = parseInt(document.getElementById('father-select').value, 10);
      if (!fatherId || isNaN(fatherId)) { alert('Veuillez sélectionner un père.'); return; }
      
      const userProfile = authService.getCurrentUserProfile();
      if (!userProfile) { alert("Utilisateur non connecté."); return; }

      const fatherNode = await familyDataService.getPersonById(fatherId);
      if (!fatherNode || fatherNode.gender !== 'male') {
        alert('La personne sélectionnée comme père doit être de genre masculin et exister.');
        return;
      }

      const updatedUserProfile = await familyDataService.setFather(userProfile, fatherId);
      if (updatedUserProfile) {
        authService.updateCurrentUserProfile(updatedUserProfile);
        alert('Père ajouté avec succès !');
        location.reload();
      } else { alert('Erreur lors de l\'ajout du père.'); }
    });
  }

  // Add Mother
  const addMotherButton = document.getElementById('add-mother-button');
  const addMotherForm = document.getElementById('add-mother-form');
  const addMotherConfirmButton = document.getElementById('add-mother-confirm');
  
  if (addMotherButton && addMotherForm) {
    addMotherButton.addEventListener('click', () => {
      addMotherForm.style.display = addMotherForm.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (addMotherConfirmButton) {
    addMotherConfirmButton.addEventListener('click', async () => {
      const motherId = parseInt(document.getElementById('mother-select').value, 10);
      if (!motherId || isNaN(motherId)) { alert('Veuillez sélectionner une mère.'); return; }

      const userProfile = authService.getCurrentUserProfile();
      if (!userProfile) { alert("Utilisateur non connecté."); return; }

      const motherNode = await familyDataService.getPersonById(motherId);
      if (!motherNode || motherNode.gender !== 'female') {
        alert('La personne sélectionnée comme mère doit être de genre féminin et exister.');
        return;
      }
      
      const updatedUserProfile = await familyDataService.setMother(userProfile, motherId);
      if (updatedUserProfile) {
        authService.updateCurrentUserProfile(updatedUserProfile);
        alert('Mère ajoutée avec succès !');
        location.reload();
      } else { alert('Erreur lors de l\'ajout de la mère.'); }
    });
  }

  // Add Child(ren)
  const addChildButton = document.getElementById('add-child-button');
  const addChildForm = document.getElementById('add-child-form');
  const generateChildMenusButton = document.getElementById('generate-child-menus');
  const childMenusContainer = document.getElementById('child-menus');
  const addChildConfirmButton = document.getElementById('add-child-confirm');

  if (addChildButton && addChildForm) {
    addChildButton.addEventListener('click', () => {
      addChildForm.style.display = addChildForm.style.display === 'none' ? 'block' : 'none';
      // Pre-generate one child menu if not already generated
      if (addChildForm.style.display === 'block' && childMenusContainer.children.length === 0) {
        document.getElementById('child-count').value = "1"; // Reset to 1
        generateChildMenusButton.click(); // Trigger menu generation
      }
    });
  }

  if (generateChildMenusButton && childMenusContainer && addChildConfirmButton) {
    generateChildMenusButton.addEventListener('click', async () => {
      const childCountInput = document.getElementById('child-count');
      const childCount = parseInt(childCountInput.value, 10);
      childMenusContainer.innerHTML = ''; // Clear existing menus

      if (isNaN(childCount) || childCount < 1 || childCount > 10) {
          alert("Veuillez entrer un nombre d'enfants valide (1-10).");
          childCountInput.value = "1"; 
          addChildConfirmButton.style.display = 'none';
          return;
      }
      
      const allFamilyData = await familyDataService.getAllFamilyData();
      const currentUserProfile = authService.getCurrentUserProfile();
      if (!currentUserProfile) { alert("Utilisateur non connecté."); return; }


      for (let i = 0; i < childCount; i++) {
        const childMenuDiv = document.createElement('div');
        childMenuDiv.classList.add('child-menu');
        // Note: IDs for selects should be unique if this is ever inside a loop generating multiple similar forms.
        // Here, `child-select-${i}` makes them unique.
        childMenuDiv.innerHTML = `
          <label>Enfant ${i + 1} :</label>
          <select id="child-select-${i}" class="child-select"></select>
        `;
        childMenusContainer.appendChild(childMenuDiv);
        // Populate this specific child select menu, excluding current user and their parents/spouses.
        // A child cannot be the user themselves, their parent, or their spouse.
        const existingRelations = [
            currentUserProfile.id, 
            ...(currentUserProfile.pids || []),
            currentUserProfile.fid,
            currentUserProfile.mid
        ].filter(id => id != null); // Filter out nulls

        const eligibleChildrenData = allFamilyData.filter(p => !existingRelations.includes(p.id));
        populateSelectMenu(`child-select-${i}`, eligibleChildrenData, null); // No need to exclude current user again
      }
      addChildConfirmButton.style.display = childCount > 0 ? 'block' : 'none';
    });
  }

  if (addChildConfirmButton) {
    addChildConfirmButton.addEventListener('click', async () => {
      const userProfile = authService.getCurrentUserProfile();
      if (!userProfile) { alert("Utilisateur non connecté."); return; }

      let childrenAddedSuccessfully = 0;
      const childSelects = document.querySelectorAll('.child-select');

      for (const select of childSelects) {
        const childId = parseInt(select.value, 10);
        if (childId && !isNaN(childId)) {
          const result = await familyDataService.addChild(userProfile, childId);
          if (result) {
            childrenAddedSuccessfully++;
          } else {
            alert(`Erreur lors de l'ajout de l'enfant avec ID ${childId}. Vérifiez qu'il existe et n'est pas déjà un parent/conjoint.`);
          }
        }
      }

      if (childrenAddedSuccessfully > 0) {
        // The userProfile itself (parent) isn't directly modified by adding a child,
        // but the child's record in familyData is.
        // We might want to re-fetch userProfile if `addChild` could modify it (e.g., pids with other parent),
        // but current `addChild` in service only modifies child's fid/mid.
        // authService.updateCurrentUserProfile(userProfile); // Not strictly necessary if userProfile object itself didn't change
        alert(`${childrenAddedSuccessfully} enfant(s) ajouté(s) avec succès !`);
        location.reload();
      } else if (childSelects.length > 0) {
        alert("Aucun enfant valide sélectionné ou erreur lors de l'ajout.");
      }
      // Optionally hide the form again
      // addChildForm.style.display = 'none';
      // childMenusContainer.innerHTML = '';
      // addChildConfirmButton.style.display = 'none';
    });
  }
}