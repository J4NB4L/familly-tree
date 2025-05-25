//---> PATH: /c/Users/PC/School/RO/TP/TP1/frontend/src/components/profile.js
export function renderProfilePage() {
  const stored = localStorage.getItem('userProfile');
  const user = stored ? JSON.parse(stored) : {
    id: 100, // Default ID if no profile exists
    name: '',
    fid: null, // Changed from pid
    mid: null,
    pids: [],
    gender: '',
    birthYear: '',
    img: '/assets/avatars/default.svg',
    gmail: ''
  };

  // familyData is not directly used in rendering here, but good to be aware of
  // const familyData = JSON.parse(localStorage.getItem('familyData')) || [];

  return `
    <div class="container-card">
      <div class="profile-header">
        <h2>Votre Profil</h2>
        <button id="logout-button" class="logout-button">Déconnexion</button>
      </div>
      <form id="profile-form">
        <img src="${user.img}" alt="Photo de profil" style="max-width: 150px; border-radius: 8px; margin-bottom: 15px;" />

        <label>Nom :</label>
        <input type="text" name="name" value="${user.name}" required />

        <label>Année de naissance :</label>
        <input type="number" name="birthYear" value="${user.birthYear}" required min="1900" max="2025" />

        <label>Email (Gmail) :</label>
        <input type="email" name="gmail" value="${user.gmail}" required pattern=".+@gmail\\.com" />

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
              <button id="add-child-confirm">Confirmer</button>
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

  // Load familyData once and keep it in memory for this scope
  let familyData = JSON.parse(localStorage.getItem('familyData')) || [];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const name = formData.get('name');
    const birthYear = parseInt(formData.get('birthYear'), 10);
    const gmail = formData.get('gmail');
    const gender = formData.get('gender');

    const existingUserProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
    let img = existingUserProfile.img || '/assets/avatars/default.svg';
    const imgFile = formData.get('imgFile');
    const imgUrl = formData.get('imgUrl');

    if (imgFile && imgFile.size > 0) {
      img = await toBase64(imgFile);
    } else if (imgUrl) {
      img = imgUrl;
    }

    const updatedProfileData = {
      ...existingUserProfile, // Preserve existing relationships (fid, mid, pids) and ID
      id: existingUserProfile.id || Date.now(), // Ensure ID is present, fallback to new if none
      name,
      gender,
      birthYear,
      img,
      gmail
    };

    localStorage.setItem('userProfile', JSON.stringify(updatedProfileData));
    
    // Update user's representation in familyData as well
    updateUserInFamilyData(updatedProfileData, familyData);
    localStorage.setItem('familyData', JSON.stringify(familyData));

    alert('Profil mis à jour avec succès !');
    location.reload(); // recharger pour voir les changements
  });

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('userProfile');
      // Optionally, clear familyData if it's tied to the user session, or leave it.
      // localStorage.removeItem('familyData'); 
      window.location.href = '/login';
    });
  }

  function populateSelectMenu(selectId, data, excludeId = null) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">-- Choisissez --</option>'; // Clear existing and add default
    data.forEach(person => {
      if (person.id === excludeId) return; // Exclude the user themselves if needed

      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = `${person.name}`;
      selectElement.appendChild(option);
    });
  }
  
  // Helper function to manage the user's representation in familyData
  // Ensures the user object exists in familyData and is up-to-date.
  // Returns the reference to the user object within the familyData array.
  function updateUserInFamilyData(userProfileSource, targetFamilyData) {
    let userInFamily = targetFamilyData.find(p => p.id === userProfileSource.id);
    if (!userInFamily) {
      userInFamily = JSON.parse(JSON.stringify(userProfileSource)); // Add a deep copy
      targetFamilyData.push(userInFamily);
    } else {
      // User exists, update it with properties from userProfileSource
      Object.assign(userInFamily, userProfileSource);
    }
    return userInFamily;
  }


  // Initial population of select menus
  // The current user (profile being edited) should not be selectable as their own parent/spouse.
  const currentUserProfileForExclusion = JSON.parse(localStorage.getItem('userProfile'));
  const currentUserId = currentUserProfileForExclusion ? currentUserProfileForExclusion.id : null;

  populateSelectMenu('spouse-select', familyData, currentUserId);
  populateSelectMenu('father-select', familyData.filter(p => p.gender === 'male'), currentUserId);
  populateSelectMenu('mother-select', familyData.filter(p => p.gender === 'female'), currentUserId);


  // Add Spouse
  const addSpouseButton = document.getElementById('add-spouse-button');
  if (addSpouseButton) {
    addSpouseButton.addEventListener('click', () => {
      document.getElementById('add-spouse-form').style.display = 
        document.getElementById('add-spouse-form').style.display === 'none' ? 'block' : 'none';
    });

    const addSpouseConfirmButton = document.getElementById('add-spouse-confirm');
    if (addSpouseConfirmButton) {
      addSpouseConfirmButton.addEventListener('click', () => {
        const spouseId = parseInt(document.getElementById('spouse-select').value, 10);
        if (!spouseId || isNaN(spouseId)) {
          alert('Veuillez sélectionner un conjoint.');
          return;
        }

        const userProfileData = JSON.parse(localStorage.getItem('userProfile'));
        const userInFamily = updateUserInFamilyData(userProfileData, familyData); // Get/update user in familyData
        const spouseInFamily = familyData.find(p => p.id === spouseId);

        if (userInFamily && spouseInFamily) {
          // Update user's pids
          userInFamily.pids = userInFamily.pids || [];
          if (!userInFamily.pids.includes(spouseId)) {
            userInFamily.pids.push(spouseId);
          }

          // Update spouse's pids
          spouseInFamily.pids = spouseInFamily.pids || [];
          if (!spouseInFamily.pids.includes(userInFamily.id)) {
            spouseInFamily.pids.push(userInFamily.id);
          }

          localStorage.setItem('userProfile', JSON.stringify(userInFamily)); // Save updated user profile
          localStorage.setItem('familyData', JSON.stringify(familyData));
          alert('Conjoint ajouté avec succès !');
          location.reload();
        } else {
          alert('Erreur : conjoint non trouvé.');
        }
      });
    }
  }

  // Add Father
  const addFatherButton = document.getElementById('add-father-button');
  if (addFatherButton) {
    addFatherButton.addEventListener('click', () => {
      document.getElementById('add-father-form').style.display =
        document.getElementById('add-father-form').style.display === 'none' ? 'block' : 'none';
    });

    const addFatherConfirmButton = document.getElementById('add-father-confirm');
    if (addFatherConfirmButton) {
      addFatherConfirmButton.addEventListener('click', () => {
        const fatherId = parseInt(document.getElementById('father-select').value, 10);
        if (!fatherId || isNaN(fatherId)) {
          alert('Veuillez sélectionner un père.');
          return;
        }
        
        const userProfileData = JSON.parse(localStorage.getItem('userProfile'));
        const userInFamily = updateUserInFamilyData(userProfileData, familyData);
        const fatherInFamily = familyData.find(p => p.id === fatherId);

        if (userInFamily && fatherInFamily) {
          if (fatherInFamily.gender !== 'male') {
            alert('La personne sélectionnée comme père doit être de genre masculin.');
            return;
          }
          userInFamily.fid = fatherId;
          // If this person was previously the mother, clear mid to avoid conflict.
          if (userInFamily.mid === fatherId) userInFamily.mid = null;


          localStorage.setItem('userProfile', JSON.stringify(userInFamily));
          localStorage.setItem('familyData', JSON.stringify(familyData)); // familyData was modified via userInFamily
          alert('Père ajouté avec succès !');
          location.reload();
        } else {
          alert('Erreur : père non trouvé.');
        }
      });
    }
  }

  // Add Mother
  const addMotherButton = document.getElementById('add-mother-button');
  if (addMotherButton) {
    addMotherButton.addEventListener('click', () => {
      document.getElementById('add-mother-form').style.display =
        document.getElementById('add-mother-form').style.display === 'none' ? 'block' : 'none';
    });
    
    const addMotherConfirmButton = document.getElementById('add-mother-confirm');
    if (addMotherConfirmButton) {
      addMotherConfirmButton.addEventListener('click', () => {
        const motherId = parseInt(document.getElementById('mother-select').value, 10);
        if (!motherId || isNaN(motherId)) {
          alert('Veuillez sélectionner une mère.');
          return;
        }

        const userProfileData = JSON.parse(localStorage.getItem('userProfile'));
        const userInFamily = updateUserInFamilyData(userProfileData, familyData);
        const motherInFamily = familyData.find(p => p.id === motherId);

        if (userInFamily && motherInFamily) {
          if (motherInFamily.gender !== 'female') {
            alert('La personne sélectionnée comme mère doit être de genre féminin.');
            return;
          }
          userInFamily.mid = motherId;
          // If this person was previously the father, clear fid.
          if (userInFamily.fid === motherId) userInFamily.fid = null;

          localStorage.setItem('userProfile', JSON.stringify(userInFamily));
          localStorage.setItem('familyData', JSON.stringify(familyData));
          alert('Mère ajoutée avec succès !');
          location.reload();
        } else {
          alert('Erreur : mère non trouvée.');
        }
      });
    }
  }

  // Add Child
  const addChildButton = document.getElementById('add-child-button');
  if (addChildButton) {
    addChildButton.addEventListener('click', () => {
      document.getElementById('add-child-form').style.display =
        document.getElementById('add-child-form').style.display === 'none' ? 'block' : 'none';
      // Pre-generate one child menu by default if not already generated
      if(document.getElementById('child-menus').children.length === 0) {
        document.getElementById('generate-child-menus').click();
      }
    });

    const generateChildMenusButton = document.getElementById('generate-child-menus');
    if (generateChildMenusButton) {
      generateChildMenusButton.addEventListener('click', () => {
        const childCountInput = document.getElementById('child-count');
        const childCount = parseInt(childCountInput.value, 10);
        const childMenusContainer = document.getElementById('child-menus');
        childMenusContainer.innerHTML = ''; // Clear existing menus

        if (isNaN(childCount) || childCount < 1 || childCount > 10) {
            alert("Veuillez entrer un nombre d'enfants valide (1-10).");
            childCountInput.value = "1"; // Reset to default
            return;
        }
        
        const userProfileData = JSON.parse(localStorage.getItem('userProfile'));

        for (let i = 0; i < childCount; i++) {
          const childMenuDiv = document.createElement('div');
          childMenuDiv.classList.add('child-menu');
          childMenuDiv.innerHTML = `
            <label>Nom de l'enfant ${i + 1} :</label>
            <select id="child-select-${i}" class="child-select"></select>
          `;
          childMenusContainer.appendChild(childMenuDiv);
          // Populate this specific child select menu, excluding the current user and their existing parents/spouses
          // to prevent logical impossibilities like being your own child.
          populateSelectMenu(`child-select-${i}`, familyData, userProfileData.id);
        }
      });
    }

    const addChildConfirmButton = document.getElementById('add-child-confirm');
    if (addChildConfirmButton) {
      addChildConfirmButton.addEventListener('click', () => {
        const userProfileData = JSON.parse(localStorage.getItem('userProfile'));
        // userInFamily is not directly modified for adding children, but we get it to ensure it's in familyData
        const userInFamily = updateUserInFamilyData(userProfileData, familyData); 
        let childrenAdded = 0;

        document.querySelectorAll('.child-select').forEach(select => {
          const childId = parseInt(select.value, 10);
          if (childId && !isNaN(childId)) {
            const childInFamily = familyData.find(p => p.id === childId);
            if (childInFamily) {
              if (userInFamily.gender === 'male') {
                childInFamily.fid = userInFamily.id;
                // If current user was previously child's mother, clear it
                if (childInFamily.mid === userInFamily.id) childInFamily.mid = null;
              } else if (userInFamily.gender === 'female') {
                childInFamily.mid = userInFamily.id;
                // If current user was previously child's father, clear it
                if (childInFamily.fid === userInFamily.id) childInFamily.fid = null;
              }
              childrenAdded++;
            }
          }
        });

        if (childrenAdded > 0) {
          // userProfileData (userInFamily) itself isn't changed when adding children,
          // but its representation in familyData might have been updated by updateUserInFamilyData.
          // We save familyData which contains the modified children.
          localStorage.setItem('userProfile', JSON.stringify(userInFamily)); // Keep userProfile consistent
          localStorage.setItem('familyData', JSON.stringify(familyData));
          alert(`${childrenAdded} enfant(s) ajouté(s) avec succès !`);
          location.reload();
        } else {
          alert("Aucun enfant sélectionné ou erreur lors de l'ajout.");
        }
      });
    }
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  }
}