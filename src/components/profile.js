// profile.js

export function renderProfilePage() {
  const stored = localStorage.getItem('userProfile');
  const user = stored ? JSON.parse(stored) : {
    id: 100,
    name: '',
    pid: null,
    mid: null,
    pids: [],
    gender: '',
    birthYear: '',
    img: '/assets/avatars/default.svg',
    gmail: ''
  };

  const familyData = JSON.parse(localStorage.getItem('familyData')) || [];

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
              <input type="number" id="child-count" min="1" max="10" />
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const name = formData.get('name');
    const birthYear = parseInt(formData.get('birthYear'), 10);
    const gmail = formData.get('gmail');
    const gender = formData.get('gender');

    let img = JSON.parse(localStorage.getItem('userProfile'))?.img || '/assets/avatars/default.svg';
    const imgFile = formData.get('imgFile');
    const imgUrl = formData.get('imgUrl');

    if (imgFile && imgFile.size > 0) {
      img = await toBase64(imgFile);
    } else if (imgUrl) {
      img = imgUrl;
    }

    const updatedProfile = {
      id: 100,
      name,
      pid: null,
      mid: null,
      pids: [],
      gender,
      birthYear,
      img,
      gmail
    };

    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    location.reload(); // recharger pour voir les changements
  });

  // Ajouter un gestionnaire d'événements pour le bouton "Déconnexion"
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('userProfile'); // Supprimer uniquement l'élément userProfile
      window.location.href = '/login'; // Rediriger vers la page de connexion
    });
  }

  // Fonction pour remplir les menus déroulants avec les noms des membres de la famille
  function populateSelectMenu(selectId, familyData) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    selectElement.innerHTML = ''; // Clear existing options
    familyData.forEach(person => {
      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = person.name;
      selectElement.appendChild(option);
    });
  }

  // Remplir les menus déroulants
  let familyData = JSON.parse(localStorage.getItem('familyData')) || [];
  populateSelectMenu('spouse-select', familyData);
  populateSelectMenu('father-select', familyData);
  populateSelectMenu('mother-select', familyData);

  // Fonction pour ajouter l'utilisateur à familyData s'il n'y est pas déjà
  function ensureUserInFamilyData(userProfile) {
    const existingUser = familyData.find(person => person.id === userProfile.id);
    if (!existingUser) {
      familyData.push(userProfile);
      localStorage.setItem('familyData', JSON.stringify(familyData));
    }
  }

  // Ajouter un gestionnaire d'événements pour le bouton "Ajouter un conjoint"
  const addSpouseButton = document.getElementById('add-spouse-button');
  if (addSpouseButton) {
    addSpouseButton.addEventListener('click', () => {
      const form = document.getElementById('add-spouse-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    const addSpouseConfirmButton = document.getElementById('add-spouse-confirm');
    if (addSpouseConfirmButton) {
      addSpouseConfirmButton.addEventListener('click', () => {
        const spouseSelect = document.getElementById('spouse-select');
        const spouseId = spouseSelect.value;
        if (spouseId) {
          const userProfile = JSON.parse(localStorage.getItem('userProfile'));
          ensureUserInFamilyData(userProfile);

          userProfile.mid = parseInt(spouseId, 10);
          localStorage.setItem('userProfile', JSON.stringify(userProfile));

          const spouse = familyData.find(person => person.id === parseInt(spouseId, 10));
          if (spouse) {
            spouse.mid = userProfile.id;
            spouse.pids = userProfile.pids; // Sync pids
            localStorage.setItem('familyData', JSON.stringify(familyData));
          }

          alert('Conjoint ajouté avec succès !');
          location.reload();
        }
      });
    }
  }

  // Ajouter un gestionnaire d'événements pour le bouton "Ajouter un père"
  const addFatherButton = document.getElementById('add-father-button');
  if (addFatherButton) {
    addFatherButton.addEventListener('click', () => {
      const form = document.getElementById('add-father-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    const addFatherConfirmButton = document.getElementById('add-father-confirm');
    if (addFatherConfirmButton) {
      addFatherConfirmButton.addEventListener('click', () => {
        const fatherSelect = document.getElementById('father-select');
        const fatherId = fatherSelect.value;
        if (fatherId) {
          const userProfile = JSON.parse(localStorage.getItem('userProfile'));
          ensureUserInFamilyData(userProfile);

          userProfile.pid = parseInt(fatherId, 10);
          localStorage.setItem('userProfile', JSON.stringify(userProfile));

          const father = familyData.find(person => person.id === parseInt(fatherId, 10));
          if (father) {
            father.pids.push(userProfile.id);
            localStorage.setItem('familyData', JSON.stringify(familyData));
          }

          alert('Père ajouté avec succès !');
          location.reload();
        }
      });
    }
  }

  // Ajouter un gestionnaire d'événements pour le bouton "Ajouter une mère"
  const addMotherButton = document.getElementById('add-mother-button');
  if (addMotherButton) {
    addMotherButton.addEventListener('click', () => {
      const form = document.getElementById('add-mother-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    const addMotherConfirmButton = document.getElementById('add-mother-confirm');
    if (addMotherConfirmButton) {
      addMotherConfirmButton.addEventListener('click', () => {
        const motherSelect = document.getElementById('mother-select');
        const motherId = motherSelect.value;
        if (motherId) {
          const userProfile = JSON.parse(localStorage.getItem('userProfile'));
          ensureUserInFamilyData(userProfile);

          userProfile.mid = parseInt(motherId, 10);
          localStorage.setItem('userProfile', JSON.stringify(userProfile));

          const mother = familyData.find(person => person.id === parseInt(motherId, 10));
          if (mother) {
            mother.pids.push(userProfile.id);
            localStorage.setItem('familyData', JSON.stringify(familyData));
          }

          alert('Mère ajoutée avec succès !');
          location.reload();
        }
      });
    }
  }

  // Ajouter un gestionnaire d'événements pour le bouton "Ajouter un enfant"
  const addChildButton = document.getElementById('add-child-button');
  if (addChildButton) {
    addChildButton.addEventListener('click', () => {
      const form = document.getElementById('add-child-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    const generateChildMenusButton = document.getElementById('generate-child-menus');
    if (generateChildMenusButton) {
      generateChildMenusButton.addEventListener('click', () => {
        const childCount = parseInt(document.getElementById('child-count').value, 10);
        const childMenusContainer = document.getElementById('child-menus');
        childMenusContainer.innerHTML = ''; // Clear existing menus

        for (let i = 0; i < childCount; i++) {
          const childMenu = document.createElement('div');
          childMenu.classList.add('child-menu');
          childMenu.innerHTML = `
            <label>Nom de l'enfant ${i + 1} :</label>
            <select class="child-select" data-index="${i}"></select>
          `;
          childMenusContainer.appendChild(childMenu);
        }

        // Populate the child select menus
        document.querySelectorAll('.child-select').forEach(select => {
          populateSelectMenu(select.getAttribute('data-index'), familyData);
        });
      });
    }

    const addChildConfirmButton = document.getElementById('add-child-confirm');
    if (addChildConfirmButton) {
      addChildConfirmButton.addEventListener('click', () => {
        const userProfile = JSON.parse(localStorage.getItem('userProfile'));
        ensureUserInFamilyData(userProfile);

        document.querySelectorAll('.child-select').forEach(select => {
          const childId = select.value;
          if (childId) {
            userProfile.pids.push(parseInt(childId, 10));

            const child = familyData.find(person => person.id === parseInt(childId, 10));
            if (child) {
              if (userProfile.gender === 'male') {
                child.pid = userProfile.id;
              } else {
                child.mid = userProfile.id;
              }
              localStorage.setItem('familyData', JSON.stringify(familyData));
            }
          }
        });

        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        alert('Enfants ajoutés avec succès !');
        location.reload();
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
