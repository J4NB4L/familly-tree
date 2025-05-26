// frontend/src/components/profile.js
import { authService } from '../services/authService';
import { familyDataService } from '../services/familyDataService';

// Helper pour peupler les menus déroulants
async function populateSelect(selectElementId, data, currentValue, excludeIds = [], filterFn = null, defaultOptionText = "-- Aucun(e) --") {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return;

  selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`; 

  let filteredData = data;
  if (filterFn) {
    filteredData = data.filter(filterFn);
  }

  filteredData.forEach(person => {
    if (excludeIds.includes(person.id)) return;

    const option = document.createElement('option');
    option.value = person.id; 
    option.textContent = `${person.name} (${person.birthYear || 'N/A'})`;
    if (currentValue === person.id) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

export function renderProfilePage() {
  // currentUserProfile sera chargé dans setupProfileFormHandler
  // On met des placeholders pour le rendu initial
  const user = {
    id: '', name: 'Chargement...', fid: null, mid: null, pids: [], gender: 'unknown',
    birthYear: '', img: '/assets/avatars/default.svg', gmail: ''
  };

  return `
    <div class="profile-page-container">
      <div class="profile-content-wrapper">
        <h1 class="profile-main-title">Profil utilisateur</h1>
        
        <div class="profile-card">
            <div class="profile-header-section">
              <div class="profile-image-container">
                <img src="${user.img}" alt="Photo de profil" id="profile-image-preview" class="profile-image-preview" />
                <div class="profile-image-upload-trigger" onclick="document.getElementById('profile-imgFile').click()">
                  <span style="color: white; font-size: 22px;">+</span>
                </div>
              </div>
              <h2 id="profile-header-name" class="profile-name-header">${user.name}</h2>
              <input type="file" id="profile-imgFile" name="imgFile" accept="image/*" style="display:none" />
              <input type="url" id="profile-imgUrl" name="imgUrl" style="display:none" value=""/>
            </div>
            
            <form id="profile-form">
              <h3 class="profile-section-title">Informations personnelles</h3>
                
                <div class="profile-info-grid">
                  <div class="profile-form-field">
                    <label for="profile-name">Nom complet:</label>
                    <input type="text" id="profile-name" name="name" value="${user.name}" required />
                  </div>
                  <div class="profile-form-field">
                    <label for="profile-gmail">Email:</label>
                    <input type="email" id="profile-gmail" name="gmail" value="${user.gmail}" />
                  </div>
                  <div class="profile-form-field">
                    <label for="profile-gender">Genre:</label>
                    <select id="profile-gender" name="gender">
                      <option value="unknown" ${user.gender === 'unknown' ? 'selected' : ''}>Non spécifié</option>
                      <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Homme</option>
                      <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Femme</option>
                    </select>
                  </div>
                  <div class="profile-form-field">
                    <label for="profile-birthYear">Année de naissance:</label>
                    <input type="number" id="profile-birthYear" name="birthYear" value="${user.birthYear}" min="1800" max="${new Date().getFullYear()}" />
                  </div>
                   <div class="profile-form-field">
                    <label for="profile-deathYear">Année de décès (si applicable):</label>
                    <input type="number" id="profile-deathYear" name="deathYear" value="${user.deathYear || ''}" min="1800" max="${new Date().getFullYear()}" />
                  </div>
                </div>

                
                <div class="profile-relations-section">
                  <h3 class="profile-section-title">Parents</h3>
                  <div class="profile-parent-fields">
                    <div class="profile-form-field">
                      <label for="profile-fid">Père:</label>
                      <div class="relation-select-wrapper">
                        <select id="profile-fid" name="fid"></select>
                        <button type="button" class="remove-relation-btn small-btn" data-relation-type="fid" title="Retirer le père">✕</button>
                      </div>
                    </div>
                    <div class="profile-form-field">
                      <label for="profile-mid">Mère:</label>
                      <div class="relation-select-wrapper">
                        <select id="profile-mid" name="mid"></select>
                        <button type="button" class="remove-relation-btn small-btn" data-relation-type="mid" title="Retirer la mère">✕</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                
                <div class="profile-family-management-section">
                  <div class="profile-section-header">
                    <h3 class="profile-section-title">Familles (Conjoints et Enfants)</h3>
                    <button type="button" id="add-family-section-btn" class="profile-action-btn positive-btn"><span style="margin-right: 8px;">+</span> Ajouter une famille</button>
                  </div>
                  <div id="family-sections-container">
                    <!-- Les sections de famille seront ajoutées ici dynamiquement -->
                  </div>
                </div>
                
                <div class="profile-actions-footer">
                  <div class="account-actions">
                    <button type="button" id="logout-button" class="profile-action-btn danger-btn">Déconnexion</button>
                    <button type="button" id="delete-account-button" class="profile-action-btn outline-danger-btn">Supprimer le compte</button>
                  </div>
                  <button type="submit" class="profile-action-btn primary-btn submit-btn">Mettre à jour le profil</button>
                </div>
              </form>
              <div id="profile-message" class="profile-message-area"></div>
            </div>
        </div>
      </div>
    </div>
  `;
}

function renderFamilySectionHTML(familyIndex) {
    return `
        <div class="family-section-item" data-family-index="${familyIndex}">
            <div class="family-section-item-header">
                <h4 class="family-section-item-title">Famille ${familyIndex + 1}</h4>
                <button type="button" class="remove-family-section-btn danger-btn small-btn" data-family-index="${familyIndex}" title="Supprimer cette famille">× Supprimer Famille</button>
            </div>
            <div class="profile-form-field">
                <label for="family_conjoint_${familyIndex}">Conjoint:</label>
                <div class="relation-select-wrapper">
                    <select id="family_conjoint_${familyIndex}" name="family_conjoint_${familyIndex}" class="family-conjoint-select" data-family-index="${familyIndex}"></select>
                    <button type="button" class="remove-relation-btn small-btn" data-relation-type="conjoint" data-family-index="${familyIndex}" title="Retirer ce conjoint">✕</button>
                </div>
            </div>
            <div class="family-children-subsection">
                <h5 class="children-subsection-title">Enfants de cette union</h5>
                <div class="family-children-list" data-family-index="${familyIndex}">
                    <!-- Enfants listés ici -->
                </div>
                <div class="profile-form-field">
                    <label for="family_potential_child_${familyIndex}">Ajouter un enfant à cette union:</label>
                    <div class="relation-select-wrapper">
                        <select id="family_potential_child_${familyIndex}" class="family-potential-child-select" data-family-index="${familyIndex}"></select>
                        <button type="button" class="family-add-child-btn positive-btn small-btn" data-family-index="${familyIndex}">+ Ajouter</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function setupDynamicFamilySections(allPeople, currentUserProfile, messageDiv) {
    const container = document.getElementById('family-sections-container');
    if (!container) return;
    container.innerHTML = ''; 

    const pids = currentUserProfile.pids || [];
    if (pids.length === 0) {
        container.insertAdjacentHTML('beforeend', renderFamilySectionHTML(0));
        await setupSingleFamilySectionControls(0, null, allPeople, currentUserProfile, messageDiv);
    } else {
        pids.forEach(async (conjointId, index) => {
            container.insertAdjacentHTML('beforeend', renderFamilySectionHTML(index));
            await setupSingleFamilySectionControls(index, conjointId, allPeople, currentUserProfile, messageDiv);
        });
    }

    document.getElementById('add-family-section-btn').onclick = async () => {
        const nextIndex = container.children.length;
        container.insertAdjacentHTML('beforeend', renderFamilySectionHTML(nextIndex));
        await setupSingleFamilySectionControls(nextIndex, null, allPeople, currentUserProfile, messageDiv);
    };
}

async function setupSingleFamilySectionControls(familyIndex, currentConjointId, allPeople, currentUserProfile, messageDiv) {
    const section = document.querySelector(`.family-section-item[data-family-index="${familyIndex}"]`);
    if (!section) return;

    const conjointSelect = section.querySelector(`.family-conjoint-select`);
    const potentialChildSelect = section.querySelector(`.family-potential-child-select`);
    const childrenListDiv = section.querySelector(`.family-children-list`);
    const addChildBtn = section.querySelector(`.family-add-child-btn`);
    const removeFamilyBtn = section.querySelector(`.remove-family-section-btn`);
    const removeConjointBtn = section.querySelector(`button[data-relation-type="conjoint"][data-family-index="${familyIndex}"]`);

    // 1. Peupler le select du conjoint
    const existingConjointIdsInOtherSections = Array.from(document.querySelectorAll('.family-conjoint-select'))
        .map(s => s.value)
        .filter(v => v && v !== currentConjointId); 

    await populateSelect(conjointSelect.id, allPeople, currentConjointId, 
        [currentUserProfile.id, currentUserProfile.fid, currentUserProfile.mid, ...existingConjointIdsInOtherSections].filter(Boolean), 
        p => { 
            if (p.id === currentUserProfile.id) return false; 
            if (p.id === currentUserProfile.fid || p.id === currentUserProfile.mid) return false; 
            if (allPeople.some(child => (child.fid === currentUserProfile.id || child.mid === currentUserProfile.id) && child.id === p.id)) return false;
            return true;
        },
        "-- Sélectionner Conjoint --"
    );
    if(currentConjointId) conjointSelect.value = currentConjointId;


    async function refreshSpecificFamilyChildren(selectedConjointId) {
        childrenListDiv.innerHTML = ''; 
        
        let enfantsDeCetteUnion = [];
        if (selectedConjointId) {
            enfantsDeCetteUnion = allPeople.filter(p => 
                (p.fid === currentUserProfile.id && p.mid === selectedConjointId) ||
                (p.mid === currentUserProfile.id && p.fid === selectedConjointId)
            );
        }

        if (enfantsDeCetteUnion.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'children-items-list';
            enfantsDeCetteUnion.forEach(child => {
                const li = document.createElement('li');
                li.className = 'child-item-entry';
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'child-item-info';
                const nameSpan = document.createElement('span');
                nameSpan.textContent = child.name;
                nameSpan.className = 'child-item-name';
                const yearSpan = document.createElement('span');
                yearSpan.textContent = `Né(e) en ${child.birthYear || 'N/A'}`;
                yearSpan.className = 'child-item-year';
                
                infoDiv.appendChild(nameSpan);
                infoDiv.appendChild(yearSpan);
                li.appendChild(infoDiv);
                
                const removeChildBtn = document.createElement('button');
                removeChildBtn.innerHTML = '✕';
                removeChildBtn.type = 'button';
                removeChildBtn.className = 'remove-relation-btn small-btn danger-transparent-btn';
                removeChildBtn.title = `Dissocier ${child.name}`;
                
                removeChildBtn.onclick = async () => {
                    if (!confirm(`Dissocier ${child.name} de cette union? Son profil sera mis à jour.`)) return;
                    
                    let childToUpdate = allPeople.find(p => p.id === child.id);
                    if (childToUpdate.fid === currentUserProfile.id && childToUpdate.mid === selectedConjointId) {
                        childToUpdate.fid = null; childToUpdate.mid = null;
                    } else if (childToUpdate.mid === currentUserProfile.id && childToUpdate.fid === selectedConjointId) {
                        childToUpdate.mid = null; childToUpdate.fid = null;
                    } else { 
                         if (childToUpdate.fid === currentUserProfile.id) childToUpdate.fid = null;
                         if (childToUpdate.mid === currentUserProfile.id) childToUpdate.mid = null;
                    }

                    try {
                        await familyDataService.updatePersonInFamilyData(childToUpdate);
                        const refreshedData = await initializeProfilePage(messageDiv, false); 
                        allPeople = refreshedData.allPeople; 
                        await refreshSpecificFamilyChildren(selectedConjointId); 
                        messageDiv.textContent = `${child.name} dissocié(e).`; messageDiv.style.color = 'green';
                    } catch (err) { 
                        messageDiv.textContent = `Erreur dissociation: ${err.message || err}`; messageDiv.style.color = 'red';
                    }
                     setTimeout(() => { messageDiv.textContent = ""; }, 3000);
                };
                li.appendChild(removeChildBtn);
                ul.appendChild(li);
            });
            childrenListDiv.appendChild(ul);
        } else if (selectedConjointId) {
             childrenListDiv.innerHTML = '<p class="no-children-notice">Aucun enfant commun trouvé pour cette union.</p>';
        }


        const currentSelectedConjoint = allPeople.find(p => p.id === selectedConjointId);
        await populateSelect(potentialChildSelect.id, allPeople, null, 
            [currentUserProfile.id, selectedConjointId].filter(Boolean), 
            // Refined filter for potential children (person 'p')
            (p) => {
                // Rule 0: A conjoint must be selected for this union to add children to it.
                if (!selectedConjointId || !currentSelectedConjoint) {
                    return false;
                }

                // Rule 1: Candidate 'p' cannot be the User (currentUserProfile).
                if (p.id === currentUserProfile.id) return false;
                // Rule 2: Candidate 'p' cannot be the selected Conjoint for this family section.
                if (p.id === selectedConjointId) return false;

                // Rule 3: Candidate 'p' cannot be a parent of the User.
                if (currentUserProfile.fid === p.id || currentUserProfile.mid === p.id) return false;
                // Rule 4: Candidate 'p' cannot be a parent of the selected Conjoint.
                if (currentSelectedConjoint.fid === p.id || currentSelectedConjoint.mid === p.id) return false;
                
                // Rule 7: Candidate 'p' cannot already be a child of THIS specific User + Conjoint union.
                // This check verifies if 'p' is already fully parented by both currentUserProfile and currentSelectedConjoint.
                let isAlreadyChildOfThisSpecificUnion = false;
                if (currentUserProfile.gender === 'male' && currentSelectedConjoint.gender === 'female') {
                    if (p.fid === currentUserProfile.id && p.mid === selectedConjointId) isAlreadyChildOfThisSpecificUnion = true;
                } else if (currentUserProfile.gender === 'female' && currentSelectedConjoint.gender === 'male') {
                    if (p.mid === currentUserProfile.id && p.fid === selectedConjointId) isAlreadyChildOfThisSpecificUnion = true;
                } else {
                    if ((p.fid === currentUserProfile.id && p.mid === selectedConjointId) || 
                        (p.mid === currentUserProfile.id && p.fid === selectedConjointId)) {
                        isAlreadyChildOfThisSpecificUnion = true;
                    }
                }
                if (isAlreadyChildOfThisSpecificUnion) return false;

                // Rule 5: Candidate 'p' must be able to accept User as a parent (no conflicting existing parent of same gender).
                if (currentUserProfile.gender === 'male') { // User would be father
                    if (p.fid && p.fid !== currentUserProfile.id) return false; // p already has a DIFFERENT father.
                } else if (currentUserProfile.gender === 'female') { // User would be mother
                    if (p.mid && p.mid !== currentUserProfile.id) return false; // p already has a DIFFERENT mother.
                } else { // User's gender is 'unknown'
                    if (p.fid && p.mid) return false; 
                }

                // Rule 6: Candidate 'p' must be able to accept Conjoint as a parent.
                if (currentSelectedConjoint.gender === 'male') { // Conjoint would be father
                    if (p.fid && p.fid !== currentSelectedConjoint.id) return false; 
                } else if (currentSelectedConjoint.gender === 'female') { // Conjoint would be mother
                    if (p.mid && p.mid !== currentSelectedConjoint.id) return false; 
                } else { // Conjoint's gender is 'unknown'
                    if (p.fid && p.mid) return false;
                }
                
                return true;
            }, 
            "-- Sélectionner enfant existant --"
        );
    }
    
    await refreshSpecificFamilyChildren(currentConjointId);
    conjointSelect.onchange = async (e) => {
        await refreshSpecificFamilyChildren(e.target.value);
    };

    addChildBtn.onclick = async () => {
        const selectedConjointId = conjointSelect.value;
        const childIdToAdd = potentialChildSelect.value;

        if (!selectedConjointId) {
            messageDiv.textContent = "Sélectionnez un conjoint pour cette famille."; messageDiv.style.color = 'orange';
            return;
        }
        if (!childIdToAdd) {
            messageDiv.textContent = "Sélectionnez un enfant à ajouter."; messageDiv.style.color = 'orange';
            return;
        }
        
        const conjoint = allPeople.find(p => p.id === selectedConjointId);
        if (currentUserProfile.gender === 'unknown' || (conjoint && conjoint.gender === 'unknown')) {
             messageDiv.textContent = "Le genre de l'utilisateur et du conjoint doivent être définis (Homme/Femme)."; messageDiv.style.color = 'orange';
             return;
        }
        
        let childToUpdate = allPeople.find(p => p.id === childIdToAdd);
        let newFid = childToUpdate.fid, newMid = childToUpdate.mid;

        if (currentUserProfile.gender === 'male') newFid = currentUserProfile.id;
        else if (currentUserProfile.gender === 'female') newMid = currentUserProfile.id;

        if (conjoint.gender === 'male') newFid = conjoint.id;
        else if (conjoint.gender === 'female') newMid = conjoint.id;

        if (newFid && newMid && newFid === newMid) {
            messageDiv.textContent = "Un enfant ne peut pas avoir la même personne comme père et mère."; messageDiv.style.color = 'red';
            return;
        }
        childToUpdate.fid = newFid;
        childToUpdate.mid = newMid;

        try {
            await familyDataService.updatePersonInFamilyData(childToUpdate);
            const refreshedData = await initializeProfilePage(messageDiv, false);
            allPeople = refreshedData.allPeople;
            await refreshSpecificFamilyChildren(selectedConjointId);
            messageDiv.textContent = `${childToUpdate.name} ajouté(e) à l'union.`; messageDiv.style.color = 'green';
        } catch (err) { 
            messageDiv.textContent = `Erreur ajout enfant: ${err.message || err}`; messageDiv.style.color = 'red';
        }
        setTimeout(() => { messageDiv.textContent = ""; }, 3000);
    };

    removeFamilyBtn.onclick = async () => {
        if (!confirm("Supprimer cette section famille ? Le conjoint sera dissocié. Les enfants de cette union devront être réassignés manuellement si nécessaire.")) return;
        section.remove(); 
        messageDiv.textContent = "Section famille retirée. Sauvegardez le profil pour appliquer."; messageDiv.style.color = 'orange';
        setTimeout(() => { messageDiv.textContent = ""; }, 4000);
        const conjointToRemoveId = conjointSelect.value;
        if(conjointToRemoveId && currentUserProfile.pids) {
            currentUserProfile.pids = currentUserProfile.pids.filter(pid => pid !== conjointToRemoveId);
        }
    };
    
    if (removeConjointBtn) {
        removeConjointBtn.onclick = async () => {
            if (!conjointSelect.value) return;
            const conjointName = allPeople.find(p=>p.id === conjointSelect.value)?.name || 'ce conjoint';
            if (!confirm(`Retirer ${conjointName} de cette famille ? Les enfants communs devront être gérés manuellement.`)) return;
            
            const conjointToRemoveId = conjointSelect.value;
            conjointSelect.value = ""; 
            await refreshSpecificFamilyChildren(null); 
            
            if(conjointToRemoveId && currentUserProfile.pids) {
                 currentUserProfile.pids = currentUserProfile.pids.filter(pid => pid !== conjointToRemoveId);
            }
            messageDiv.textContent = "Conjoint retiré. Sauvegardez le profil pour appliquer."; messageDiv.style.color = 'orange';
            setTimeout(() => { messageDiv.textContent = ""; }, 4000);
        }
    }
}

async function initializeProfilePage(messageDiv, populateMainFields = true) {
    let currentUserProfile, allPeople;
    if(populateMainFields) {
      messageDiv.textContent = "Chargement du profil...";
      messageDiv.style.color = '#4a5568';
    }
    try {
        currentUserProfile = await authService.fetchUserProfileFromServer();
        if (!currentUserProfile) throw new Error("Profil utilisateur non récupéré.");
        allPeople = await familyDataService.getAllFamilyData();

        if(populateMainFields) {
            document.getElementById('profile-name').value = currentUserProfile.name || '';
            document.getElementById('profile-birthYear').value = currentUserProfile.birthYear || '';
            document.getElementById('profile-deathYear').value = currentUserProfile.deathYear || '';
            document.getElementById('profile-gmail').value = currentUserProfile.gmail || '';
            document.getElementById('profile-gender').value = currentUserProfile.gender || 'unknown';
            document.getElementById('profile-image-preview').src = currentUserProfile.img || '/assets/avatars/default.svg';
            const imgUrlInput = document.getElementById('profile-imgUrl');
            if (imgUrlInput && currentUserProfile.img && currentUserProfile.img.startsWith('http')) {
                imgUrlInput.value = currentUserProfile.img;
            }
            const profileNameHeader = document.getElementById('profile-header-name');
            if (profileNameHeader) profileNameHeader.textContent = currentUserProfile.name || 'Votre nom';
        }

        const selfId = [currentUserProfile.id];
        await populateSelect('profile-fid', allPeople, currentUserProfile.fid, selfId, 
            p => p.gender === 'male' && p.id !== currentUserProfile.mid && p.id !== currentUserProfile.id && !allPeople.some(child => (child.fid === currentUserProfile.id || child.mid === currentUserProfile.id) && child.id === p.id) 
        );
        await populateSelect('profile-mid', allPeople, currentUserProfile.mid, selfId, 
            p => p.gender === 'female' && p.id !== currentUserProfile.fid && p.id !== currentUserProfile.id && !allPeople.some(child => (child.fid === currentUserProfile.id || child.mid === currentUserProfile.id) && child.id === p.id)
        );

        await setupDynamicFamilySections(allPeople, currentUserProfile, messageDiv);

        if(populateMainFields) messageDiv.textContent = ""; 
        return { currentUserProfile, allPeople };

    } catch (error) {
        console.error("Erreur critique au chargement du profil:", error);
        messageDiv.textContent = "Erreur critique au chargement du profil. Redirection...";
        messageDiv.style.color = 'red';
        if (!authService.isAuthenticated()) { 
            setTimeout(() => window.location.href = '/login', 2000);
        }
        return { currentUserProfile: null, allPeople: [] }; 
    }
}


export async function setupProfileFormHandler() {
  const form = document.getElementById('profile-form');
  const messageDiv = document.getElementById('profile-message');
  if (!form || !messageDiv) {
    console.error("Éléments du formulaire de profil manquants.");
    return;
  }

  let { currentUserProfile, allPeople } = await initializeProfilePage(messageDiv, true); 
  
  if (!currentUserProfile) return; 

  document.querySelectorAll('.remove-relation-btn[data-relation-type="fid"], .remove-relation-btn[data-relation-type="mid"]').forEach(btn => {
      btn.onclick = () => {
          const type = btn.dataset.relationType;
          if (type === 'fid') document.getElementById('profile-fid').value = "";
          else if (type === 'mid') document.getElementById('profile-mid').value = "";
          messageDiv.textContent = "Parent retiré. Sauvegardez le profil pour appliquer."; messageDiv.style.color = 'orange';
          setTimeout(() => { messageDiv.textContent = ""; }, 4000);
      };
  });

  const imgFileInput = document.getElementById('profile-imgFile');
  const imgPreview = document.getElementById('profile-image-preview');
  const imgUrlInput = document.getElementById('profile-imgUrl');

  if (imgFileInput && imgPreview) {
    imgFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
                if(imgUrlInput) imgUrlInput.value = ''; 
            }
            reader.readAsDataURL(file);
        }
    });
  }
  if (imgUrlInput && imgPreview) {
    imgUrlInput.addEventListener('input', (event) => {
        const url = event.target.value;
        if (url && url.startsWith('http')) { 
            imgPreview.src = url; 
            if (imgFileInput) imgFileInput.value = ''; 
        } else if (!url && imgFileInput && !imgFileInput.files[0] && currentUserProfile) { 
            imgPreview.src = currentUserProfile.img || '/assets/avatars/default.svg'; 
        }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserProfile) {
        messageDiv.textContent = "Profil non chargé. Impossible de sauvegarder."; messageDiv.style.color = 'red';
        return;
    }
    messageDiv.textContent = "Mise à jour..."; messageDiv.style.color = '#4a5568';
    
    const name = document.getElementById('profile-name').value;
    const birthYearRaw = document.getElementById('profile-birthYear').value;
    const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : null;
    const deathYearRaw = document.getElementById('profile-deathYear').value;
    const deathYear = deathYearRaw ? parseInt(deathYearRaw, 10) : null;
    const gmail = document.getElementById('profile-gmail').value;
    const gender = document.getElementById('profile-gender').value;
    const fid = document.getElementById('profile-fid').value || null;
    const mid = document.getElementById('profile-mid').value || null;

    const conjointSelects = document.querySelectorAll('.family-conjoint-select');
    const pids = Array.from(conjointSelects).map(s => s.value).filter(v => v);

    let imgData = currentUserProfile.img || '/assets/avatars/default.svg'; 
    const currentImgFile = imgFileInput ? imgFileInput.files[0] : null;
    const currentImgUrl = imgUrlInput ? imgUrlInput.value : '';

    if (currentImgFile && currentImgFile.size > 0) {
      imgData = await toBase64(currentImgFile);
    } else if (currentImgUrl && currentImgUrl.trim() !== '' && currentImgUrl.startsWith('http')) {
      imgData = currentImgUrl.trim();
    }


    if (fid && mid && fid === mid) {
        messageDiv.textContent = "Le père et la mère ne peuvent pas être la même personne.";
        messageDiv.style.color = 'red';
        setTimeout(() => { messageDiv.textContent = ""; }, 5000);
        return;
    }
    if (pids.includes(fid) || pids.includes(mid)) {
        messageDiv.textContent = "Un conjoint ne peut pas être également un parent direct.";
        messageDiv.style.color = 'red';
        setTimeout(() => { messageDiv.textContent = ""; }, 5000);
        return;
    }


    const updatedProfileData = {
      ...currentUserProfile, 
      name,
      birthYear: birthYear === null ? undefined : birthYear,
      deathYear: deathYear === null ? undefined : deathYear,
      gmail, gender, img: imgData,
      fid, mid,
      pids: Array.from(new Set(pids)), 
    };

    try {
      const savedProfile = await authService.updateCurrentUserProfileInFamilyTree(updatedProfileData);
      
      const refreshed = await initializeProfilePage(messageDiv, true); 
      currentUserProfile = refreshed.currentUserProfile; 
      allPeople = refreshed.allPeople;

      messageDiv.textContent = 'Profil mis à jour avec succès !';
      messageDiv.style.color = 'green';
      
      const navbarUserImg = document.querySelector('#navbar .user-avatar');
      const navbarUserName = document.querySelector('#navbar .user-info span');
      if (navbarUserImg && savedProfile) navbarUserImg.src = savedProfile.img || '/assets/avatars/default.svg';
      if (navbarUserName && savedProfile) navbarUserName.textContent = savedProfile.name || 'Mon Profil';

      setTimeout(() => { messageDiv.textContent = ""; }, 3000);
    } catch (error) {
      console.error("Profile update failed:", error);
      messageDiv.textContent = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour.';
      messageDiv.style.color = 'red';
      setTimeout(() => { messageDiv.textContent = ""; }, 5000);
    }
  });

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      authService.logout();
      window.location.href = '/login'; 
    });
  }

  const deleteAccountButton = document.getElementById('delete-account-button');
  if (deleteAccountButton) {
    deleteAccountButton.addEventListener('click', async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            if (confirm("Confirmation finale : Supprimer définitivement le compte ?")) {
                messageDiv.textContent = "Suppression du compte..."; messageDiv.style.color = 'orange';
                try {
                    await authService.deleteAccount(); 
                    authService.logout(); 
                    messageDiv.textContent = "Compte supprimé. Redirection..."; messageDiv.style.color = 'green';
                    setTimeout(() => { window.location.href = '/login'; }, 2000);
                } catch (error) { 
                    messageDiv.textContent = `Erreur suppression: ${error.response?.data?.message || error.message}`; 
                    messageDiv.style.color = 'red';
                }
            }
        }
    });
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result); 
    reader.onerror = (error) => reject(error);
  });
}