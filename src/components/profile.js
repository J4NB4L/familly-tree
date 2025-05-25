// src/components/profile.js
import { authService } from '../services/authService';
import { familyDataService } from '../services/familyDataService';

export function renderProfilePage() {
  const user = authService.getCurrentUserProfile() || { /* default structure */ };
  // ... rest of render logic using 'user' ...
  // The familyData for select menus will be fetched asynchronously in setupProfileFormHandler
  return `...HTML structure as before...`;
}

export function setupProfileFormHandler() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  // Load initial data for select menus
  (async () => {
    const allFamilyData = await familyDataService.getAllFamilyData();
    const currentUserProfile = authService.getCurrentUserProfile();
    const currentUserId = currentUserProfile ? currentUserProfile.id : null;

    populateSelectMenu('spouse-select', allFamilyData, currentUserId);
    populateSelectMenu('father-select', allFamilyData.filter(p => p.gender === 'male'), currentUserId);
    populateSelectMenu('mother-select', allFamilyData.filter(p => p.gender === 'female'), currentUserId);
    // For child select, it's often populated when 'generate child menus' is clicked.
    // If needed on load, do it here or ensure generate-child-menus click handler does it.
  })();


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    // ... (get form data: name, birthYear, gmail, gender) ...
    const name = formData.get('name');
    const birthYear = parseInt(formData.get('birthYear'), 10);
    const gmail = formData.get('gmail');
    const gender = formData.get('gender');

    let existingUserProfile = authService.getCurrentUserProfile() || {};
    let img = existingUserProfile.img || '/assets/avatars/default.svg';
    // ... (imgFile, imgUrl logic) ...
    const imgFile = formData.get('imgFile');
    const imgUrl = formData.get('imgUrl');

    if (imgFile && imgFile.size > 0) {
      img = await toBase64(imgFile);
    } else if (imgUrl) {
      img = imgUrl;
    }

    const updatedProfileData = {
      ...existingUserProfile,
      id: existingUserProfile.id || Date.now(),
      name,
      gender,
      birthYear,
      img,
      gmail
    };

    authService.updateCurrentUserProfile(updatedProfileData);
    // Also update this person's entry in the main familyData store
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

  function populateSelectMenu(selectId, data, excludeId = null) { /* ... no change ... */ }
  // updateUserInFamilyData is now handled by familyDataService._ensureUserInFamilyData or updatePersonInFamilyData

  // --- Relation Handlers ---
  // Example for Add Spouse:
  const addSpouseConfirmButton = document.getElementById('add-spouse-confirm');
  if (addSpouseConfirmButton) {
    addSpouseConfirmButton.addEventListener('click', async () => {
      const spouseId = parseInt(document.getElementById('spouse-select').value, 10);
      if (!spouseId || isNaN(spouseId)) { /* alert */ return; }

      let userProfile = authService.getCurrentUserProfile();
      const updatedUserProfileAfterSpouse = await familyDataService.addSpouse(userProfile, spouseId);
      
      if (updatedUserProfileAfterSpouse) {
        // Sync userProfile in authService with changes from familyDataService
        authService.updateCurrentUserProfile(updatedUserProfileAfterSpouse);
        alert('Conjoint ajouté avec succès !');
        location.reload();
      } else { /* alert error */ }
    });
  }
  // Similarly refactor addFather, addMother, addChild to use:
  // 1. `authService.getCurrentUserProfile()`
  // 2. `familyDataService.setFather(userProfile, fatherId)`, etc.
  // 3. `authService.updateCurrentUserProfile(updatedProfile)` with the result from step 2.

  // Add Father confirm
    const addFatherConfirmButton = document.getElementById('add-father-confirm');
    if (addFatherConfirmButton) {
      addFatherConfirmButton.addEventListener('click', async () => {
        const fatherId = parseInt(document.getElementById('father-select').value, 10);
        if (!fatherId || isNaN(fatherId)) { alert('Veuillez sélectionner un père.'); return; }
        
        let userProfile = authService.getCurrentUserProfile();
        const fatherNode = await familyDataService.getPersonById(fatherId);

        if (!fatherNode || fatherNode.gender !== 'male') {
            alert('La personne sélectionnée comme père doit être de genre masculin.');
            return;
        }

        const updatedUserProfile = await familyDataService.setFather(userProfile, fatherId);
        if (updatedUserProfile) {
          authService.updateCurrentUserProfile(updatedUserProfile);
          alert('Père ajouté avec succès !');
          location.reload();
        } else { alert('Erreur : père non trouvé ou invalide.'); }
      });
    }

  // Add Mother confirm
    const addMotherConfirmButton = document.getElementById('add-mother-confirm');
    if (addMotherConfirmButton) {
      addMotherConfirmButton.addEventListener('click', async () => {
        const motherId = parseInt(document.getElementById('mother-select').value, 10);
        if (!motherId || isNaN(motherId)) { alert('Veuillez sélectionner une mère.'); return; }

        let userProfile = authService.getCurrentUserProfile();
        const motherNode = await familyDataService.getPersonById(motherId);

        if (!motherNode || motherNode.gender !== 'female') {
            alert('La personne sélectionnée comme mère doit être de genre féminin.');
            return;
        }
        
        const updatedUserProfile = await familyDataService.setMother(userProfile, motherId);
        if (updatedUserProfile) {
          authService.updateCurrentUserProfile(updatedUserProfile);
          alert('Mère ajoutée avec succès !');
          location.reload();
        } else { alert('Erreur : mère non trouvée ou invalide.'); }
      });
    }

  // Add Child confirm
    const addChildConfirmButton = document.getElementById('add-child-confirm');
    if (addChildConfirmButton) {
      addChildConfirmButton.addEventListener('click', async () => {
        let userProfile = authService.getCurrentUserProfile();
        let childrenAdded = 0;
        const childSelects = document.querySelectorAll('.child-select');

        for (const select of childSelects) {
            const childId = parseInt(select.value, 10);
            if (childId && !isNaN(childId)) {
                // familyDataService.addChild will handle linking child to parent
                // The parent's profile (userProfile) isn't directly changed by adding a child to them,
                // but the child's record in familyData is.
                const parentProfileAfterAddingChild = await familyDataService.addChild(userProfile, childId);
                if(parentProfileAfterAddingChild){ // if successful
                    childrenAdded++;
                }
            }
        }

        if (childrenAdded > 0) {
          // No need to update userProfile here as it's the parent, not directly modified
          // familyDataService already saved changes to children.
          alert(`${childrenAdded} enfant(s) ajouté(s) avec succès !`);
          location.reload();
        } else {
          alert("Aucun enfant sélectionné ou erreur lors de l'ajout.");
        }
      });
    }
  
  // generate-child-menus button handler:
  // Needs to fetch allFamilyData for populating select menus
    const generateChildMenusButton = document.getElementById('generate-child-menus');
    if (generateChildMenusButton) {
      generateChildMenusButton.addEventListener('click', async () => {
        // ... (get childCount)
        const childCountInput = document.getElementById('child-count');
        const childCount = parseInt(childCountInput.value, 10);
        const childMenusContainer = document.getElementById('child-menus');
        childMenusContainer.innerHTML = '';

        if (isNaN(childCount) || childCount < 1 || childCount > 10) { /* alert */ return; }
        
        const allFamilyData = await familyDataService.getAllFamilyData();
        const currentUserProfile = authService.getCurrentUserProfile();

        for (let i = 0; i < childCount; i++) {
          // ... (create childMenuDiv HTML as before) ...
          childMenusContainer.appendChild(childMenuDiv);
          populateSelectMenu(`child-select-${i}`, allFamilyData, currentUserProfile.id);
        }
      });
    }


  function toBase64(file) { /* ... no change ... */ }
}