// profile.js

export function renderProfilePage() {
  const stored = localStorage.getItem('userProfile');
  const user = stored ? JSON.parse(stored) : {
    id: 100,
    name: '',
    pid: null,
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

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  }
}
