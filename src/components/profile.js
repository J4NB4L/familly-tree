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
                <label for="family_conjoint_${familyIndex}">Conjoint(e) pour cette famille :</label>
                <div class="relation-select-wrapper">
                    <select id="family_conjoint_${familyIndex}" name="family_conjoint_${familyIndex}" class="family-conjoint-select" data-family-index="${familyIndex}"></select>
                    <button type="button" class="remove-relation-btn small-btn" data-relation-type="conjoint" data-family-index="${familyIndex}" title="Retirer ce conjoint">✕</button>
                </div>
            </div>
            <div class="family-children-subsection">
                <h5 class="children-subsection-title">Enfants de cette union/famille</h5>
                <div class="family-children-list" data-family-index="${familyIndex}">
                    <!-- Enfants listés ici -->
                </div>
                <div class="profile-form-field">
                    <label for="family_potential_child_${familyIndex}">Ajouter un enfant existant à cette union/famille:</label>
                    <div class="relation-select-wrapper">
                        <select id="family_potential_child_${familyIndex}" class="family-potential-child-select" data-family-index="${familyIndex}"></select>
                        <button type="button" class="family-add-child-btn positive-btn small-btn" data-family-index="${familyIndex}">+ Ajouter Enfant</button>
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
    
    // Always render at least one section, even if pids is empty, for user's direct children or to add a new family.
    if (pids.length === 0) {
        container.insertAdjacentHTML('beforeend', renderFamilySectionHTML(0));
        await setupSingleFamilySectionControls(0, null, allPeople, currentUserProfile, messageDiv);
    } else { // User has spouses, create a section for each
        pids.forEach(async (conjointId, index) => {
            container.insertAdjacentHTML('beforeend', renderFamilySectionHTML(index));
            await setupSingleFamilySectionControls(index, conjointId, allPeople, currentUserProfile, messageDiv);
        });
    }

    // "Add Family Section" button logic
    const addFamilyBtn = document.getElementById('add-family-section-btn');
    if (addFamilyBtn) {
        addFamilyBtn.onclick = async () => {
            // Find the highest current family index to determine the next one
            const existingSections = container.querySelectorAll('.family-section-item');
            let nextIndex = 0;
            if (existingSections.length > 0) {
                 nextIndex = Math.max(...Array.from(existingSections).map(s => parseInt(s.dataset.familyIndex, 10))) + 1;
            }
            // If a user has pids, but we want to add a new section for "no spouse" children,
            // we need to ensure this new section doesn't conflict with existing pids.
            // The `renderFamilySectionHTML` and `setupSingleFamilySectionControls` will handle this.
            // The main purpose here is to add a new UI block.
            container.insertAdjacentHTML('beforeend', renderFamilySectionHTML(nextIndex));
            await setupSingleFamilySectionControls(nextIndex, null, allPeople, currentUserProfile, messageDiv);
        };
    }
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
    // Get all conjoint IDs currently selected in OTHER family sections
    const existingConjointIdsInOtherSections = Array.from(document.querySelectorAll('.family-conjoint-select'))
        .filter(s => s.id !== conjointSelect.id) // Exclude the current section's select
        .map(s => s.value)
        .filter(v => v && v.trim() !== ""); 

    await populateSelect(conjointSelect.id, allPeople, currentConjointId, 
        [currentUserProfile.id, currentUserProfile.fid, currentUserProfile.mid, ...existingConjointIdsInOtherSections].filter(Boolean), 
        p => { // p is a potential conjoint candidate
            if (p.id === currentUserProfile.id) return false; 
            if (p.id === currentUserProfile.fid || p.id === currentUserProfile.mid) return false; 
            if (allPeople.some(child => (child.fid === currentUserProfile.id || child.mid === currentUserProfile.id) && child.id === p.id)) return false;
            // Cannot select someone as spouse if they are already selected as spouse in another section (handled by existingConjointIdsInOtherSections in excludeIds)
            return true;
        },
        "-- Sélectionner Conjoint(e) --"
    );
    if(currentConjointId) {
        conjointSelect.value = currentConjointId;
    }


    async function refreshSpecificFamilyChildren(selectedConjointIdForRefresh) {
        childrenListDiv.innerHTML = ''; 
        
        let enfantsDeCetteUnion = [];
        if (selectedConjointIdForRefresh && selectedConjointIdForRefresh.trim() !== "") {
            // Children parented by BOTH user and the selected conjoint
            enfantsDeCetteUnion = allPeople.filter(p =>
                (p.fid === currentUserProfile.id && p.mid === selectedConjointIdForRefresh) ||
                (p.mid === currentUserProfile.id && p.fid === selectedConjointIdForRefresh)
            );
        } else {
            // No spouse selected for this family section: list children parented by user AND other parent is null/empty
            enfantsDeCetteUnion = allPeople.filter(p =>
                (p.fid === currentUserProfile.id && (!p.mid || p.mid === "")) ||
                (p.mid === currentUserProfile.id && (!p.fid || p.fid === ""))
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
                yearSpan.textContent = ` (Né(e) en ${child.birthYear || 'N/A'})`;
                yearSpan.className = 'child-item-year';
                
                infoDiv.appendChild(nameSpan);
                infoDiv.appendChild(yearSpan);
                li.appendChild(infoDiv);
                
                const removeChildBtn = document.createElement('button');
                removeChildBtn.innerHTML = '✕';
                removeChildBtn.type = 'button';
                removeChildBtn.className = 'remove-relation-btn small-btn danger-transparent-btn';
                removeChildBtn.title = `Dissocier ${child.name} de cette union/famille`;
                
                removeChildBtn.onclick = async () => {
                    if (!confirm(`Dissocier ${child.name} de cette union/famille ? Son profil sera mis à jour pour retirer les liens parentaux correspondants.`)) return;
                    
                    let childToUpdate = JSON.parse(JSON.stringify(allPeople.find(p => p.id === child.id))); // Deep copy for modification
                    let changed = false;

                    if (selectedConjointIdForRefresh && selectedConjointIdForRefresh.trim() !== "") { 
                        if (childToUpdate.fid === currentUserProfile.id && childToUpdate.mid === selectedConjointIdForRefresh) {
                            childToUpdate.fid = null; childToUpdate.mid = null; changed = true;
                        } else if (childToUpdate.mid === currentUserProfile.id && childToUpdate.fid === selectedConjointIdForRefresh) {
                            childToUpdate.mid = null; childToUpdate.fid = null; changed = true;
                        } else { 
                            if (childToUpdate.fid === currentUserProfile.id) { childToUpdate.fid = null; changed = true; }
                            if (childToUpdate.mid === currentUserProfile.id) { childToUpdate.mid = null; changed = true; }
                        }
                    } else { 
                        if (childToUpdate.fid === currentUserProfile.id) {
                            childToUpdate.fid = null; changed = true;
                        }
                        if (childToUpdate.mid === currentUserProfile.id) {
                            childToUpdate.mid = null; changed = true;
                        }
                    }

                    if (changed) {
                        try {
                            await familyDataService.updatePersonInFamilyData(childToUpdate);
                            const refreshedData = await initializeProfilePage(messageDiv, false); 
                            allPeople = refreshedData.allPeople; 
                            currentUserProfile = refreshedData.currentUserProfile || currentUserProfile; 
                            await refreshSpecificFamilyChildren(selectedConjointIdForRefresh); 
                            messageDiv.textContent = `${child.name} dissocié(e).`; messageDiv.style.color = 'green';
                        } catch (err) { 
                            messageDiv.textContent = `Erreur dissociation: ${err.message || err}`; messageDiv.style.color = 'red';
                        }
                    } else {
                        messageDiv.textContent = `${child.name} n'était pas lié(e) comme attendu. Aucune modification.`; messageDiv.style.color = 'orange';
                    }
                    setTimeout(() => { messageDiv.textContent = ""; }, 3000);
                };
                li.appendChild(removeChildBtn);
                ul.appendChild(li);
            });
            childrenListDiv.appendChild(ul);
        } else if (selectedConjointIdForRefresh && selectedConjointIdForRefresh.trim() !== "") { 
             childrenListDiv.innerHTML = '<p class="no-children-notice">Aucun enfant commun trouvé pour cette union.</p>';
        } else { 
             childrenListDiv.innerHTML = '<p class="no-children-notice">Aucun enfant (sans autre conjoint désigné) lié à vous dans cette famille.</p>';
        }

        // Populate potential child select
        const currentSelectedConjointForFilter = allPeople.find(p => p.id === selectedConjointIdForRefresh);

        await populateSelect(potentialChildSelect.id, allPeople, null, 
            [currentUserProfile.id, selectedConjointIdForRefresh].filter(id => id && id.trim() !== ""), 
            (p) => { // p is the potential child
                if (p.id === currentUserProfile.id) return false; 
                if (selectedConjointIdForRefresh && p.id === selectedConjointIdForRefresh) return false; 

                if (currentUserProfile.fid === p.id || currentUserProfile.mid === p.id) return false;
                if (currentSelectedConjointForFilter && (currentSelectedConjointForFilter.fid === p.id || currentSelectedConjointForFilter.mid === p.id)) return false;

                let p_can_have_user_as_parent = false;
                if (currentUserProfile.gender === 'male') {
                    if (!p.fid || p.fid === currentUserProfile.id) p_can_have_user_as_parent = true;
                } else if (currentUserProfile.gender === 'female') {
                    if (!p.mid || p.mid === currentUserProfile.id) p_can_have_user_as_parent = true;
                } else { 
                    if ((!p.fid || p.fid === currentUserProfile.id) || (!p.mid || p.mid === currentUserProfile.id)) p_can_have_user_as_parent = true;
                }
                if (!p_can_have_user_as_parent) return false;

                if (currentSelectedConjointForFilter) {
                    let p_can_have_conjoint_as_parent = false;
                    if (currentSelectedConjointForFilter.gender === 'male') {
                        if (!p.fid || p.fid === currentSelectedConjointForFilter.id) p_can_have_conjoint_as_parent = true;
                    } else if (currentSelectedConjointForFilter.gender === 'female') {
                        if (!p.mid || p.mid === currentSelectedConjointForFilter.id) p_can_have_conjoint_as_parent = true;
                    } else { 
                         if ((!p.fid || p.fid === currentSelectedConjointForFilter.id) || (!p.mid || p.mid === currentSelectedConjointForFilter.id)) p_can_have_conjoint_as_parent = true;
                    }
                    if (!p_can_have_conjoint_as_parent) return false;

                    if ((p.fid === currentUserProfile.id && p.mid === currentSelectedConjointForFilter.id) ||
                        (p.mid === currentUserProfile.id && p.fid === currentSelectedConjointForFilter.id)) {
                        return false;
                    }
                } else { 
                    if ((p.fid === currentUserProfile.id && (!p.mid || p.mid === "")) ||
                        (p.mid === currentUserProfile.id && (!p.fid || p.fid === ""))) {
                        return false;
                    }
                }
                return true;
            }, 
            "-- Sélectionner enfant existant --"
        );
    }
    
    await refreshSpecificFamilyChildren(currentConjointId || null); // Initial call
    conjointSelect.onchange = async (e) => {
        await refreshSpecificFamilyChildren(e.target.value || null); 
    };

    addChildBtn.onclick = async () => {
        const selectedConjointIdForAdd = conjointSelect.value || null; 
        const childIdToAdd = potentialChildSelect.value;

        if (!childIdToAdd) {
            messageDiv.textContent = "Sélectionnez un enfant à ajouter."; messageDiv.style.color = 'orange';
            setTimeout(() => { messageDiv.textContent = ""; }, 3000);
            return;
        }
        
        const conjointForAdd = selectedConjointIdForAdd ? allPeople.find(p => p.id === selectedConjointIdForAdd) : null;

        if (currentUserProfile.gender === 'unknown') {
             messageDiv.textContent = "Le genre de l'utilisateur doit être défini (Homme/Femme) pour assigner un rôle parental."; messageDiv.style.color = 'orange';
             setTimeout(() => { messageDiv.textContent = ""; }, 4000);
             return;
        }
        if (conjointForAdd && conjointForAdd.gender === 'unknown') {
             messageDiv.textContent = "Le genre du conjoint sélectionné doit être défini (Homme/Femme) pour assigner un rôle parental."; messageDiv.style.color = 'orange';
             setTimeout(() => { messageDiv.textContent = ""; }, 4000);
             return;
        }
        
        let childToUpdate = JSON.parse(JSON.stringify(allPeople.find(p => p.id === childIdToAdd)));
        let newFid = childToUpdate.fid, newMid = childToUpdate.mid;

        if (currentUserProfile.gender === 'male') newFid = currentUserProfile.id;
        else if (currentUserProfile.gender === 'female') newMid = currentUserProfile.id;

        if (conjointForAdd) {
            if (conjointForAdd.gender === 'male') newFid = conjointForAdd.id;
            else if (conjointForAdd.gender === 'female') newMid = conjointForAdd.id;
        } else { 
            if (currentUserProfile.gender === 'male') newMid = null; 
            else if (currentUserProfile.gender === 'female') newFid = null; 
        }

        if (newFid && newMid && newFid === newMid) { 
            messageDiv.textContent = "Un enfant ne peut pas avoir la même personne comme père et mère."; messageDiv.style.color = 'red';
            setTimeout(() => { messageDiv.textContent = ""; }, 4000);
            return;
        }
        childToUpdate.fid = newFid;
        childToUpdate.mid = newMid;

        try {
            await familyDataService.updatePersonInFamilyData(childToUpdate);
            const refreshedData = await initializeProfilePage(messageDiv, false); 
            allPeople = refreshedData.allPeople;
            currentUserProfile = refreshedData.currentUserProfile || currentUserProfile;
            await refreshSpecificFamilyChildren(selectedConjointIdForAdd); 
            messageDiv.textContent = `${childToUpdate.name} ajouté(e) comme enfant.`; messageDiv.style.color = 'green';
        } catch (err) { 
            messageDiv.textContent = `Erreur ajout enfant: ${err.message || err}`; messageDiv.style.color = 'red';
        }
        setTimeout(() => { messageDiv.textContent = ""; }, 3000);
    };

    removeFamilyBtn.onclick = async () => {
        const conjointNameInvolved = currentConjointId ? (allPeople.find(p => p.id === currentConjointId)?.name || 'ce conjoint') : null;
        let confirmMsg = "Supprimer cette section famille ?";
        if (conjointNameInvolved) {
            confirmMsg += ` Le conjoint ${conjointNameInvolved} sera dissocié si vous sauvegardez le profil.`;
        }
        confirmMsg += " Les enfants listés ici ne seront pas automatiquement dissociés de leurs parents; cette action concerne la section UI et le lien de conjoint. Vous devrez sauvegarder le profil pour que les changements de conjoints soient effectifs.";

        if (!confirm(confirmMsg)) return;
        
        section.remove(); 
        
        messageDiv.textContent = "Section famille retirée de l'interface. Sauvegardez le profil pour appliquer les changements de conjoints."; messageDiv.style.color = 'orange';
        setTimeout(() => { messageDiv.textContent = ""; }, 5000);
    };
    
    if (removeConjointBtn) {
        removeConjointBtn.onclick = async () => {
            const selectedConjointValue = conjointSelect.value;
            if (!selectedConjointValue || selectedConjointValue.trim() === "") return;

            const conjointName = allPeople.find(p=>p.id === selectedConjointValue)?.name || 'ce conjoint';
            if (!confirm(`Retirer ${conjointName} de cette famille ? Les enfants ne seront plus listés sous cette union spécifique dans cette section. Vous devrez sauvegarder le profil pour que la dissociation du conjoint soit permanente.`)) return;
            
            conjointSelect.value = ""; 
            await refreshSpecificFamilyChildren(null); 
            
            messageDiv.textContent = "Conjoint retiré de cette section. Sauvegardez le profil global pour appliquer la modification des conjoints."; messageDiv.style.color = 'orange';
            setTimeout(() => { messageDiv.textContent = ""; }, 5000);
        }
    }
}

async function initializeProfilePage(messageDiv, populateMainFields = true) {
    let localCurrentUserProfile, localAllPeople; // Use local vars to avoid race conditions with outer scope vars
    if(populateMainFields) {
      messageDiv.textContent = "Chargement du profil...";
      messageDiv.style.color = '#4a5568';
    }
    try {
        localCurrentUserProfile = await authService.fetchUserProfileFromServer();
        if (!localCurrentUserProfile) throw new Error("Profil utilisateur non récupéré.");
        localAllPeople = await familyDataService.getAllFamilyData();

        if(populateMainFields) {
            document.getElementById('profile-name').value = localCurrentUserProfile.name || '';
            document.getElementById('profile-birthYear').value = localCurrentUserProfile.birthYear || '';
            document.getElementById('profile-deathYear').value = localCurrentUserProfile.deathYear || '';
            document.getElementById('profile-gmail').value = localCurrentUserProfile.gmail || '';
            document.getElementById('profile-gender').value = localCurrentUserProfile.gender || 'unknown';
            document.getElementById('profile-image-preview').src = localCurrentUserProfile.img || '/assets/avatars/default.svg';
            const imgUrlInput = document.getElementById('profile-imgUrl');
            if (imgUrlInput && localCurrentUserProfile.img && (localCurrentUserProfile.img.startsWith('http://') || localCurrentUserProfile.img.startsWith('https://'))) {
                imgUrlInput.value = localCurrentUserProfile.img;
            } else if (imgUrlInput) {
                imgUrlInput.value = ''; 
            }
            const profileNameHeader = document.getElementById('profile-header-name');
            if (profileNameHeader) profileNameHeader.textContent = localCurrentUserProfile.name || 'Votre nom';
        }

        const selfId = [localCurrentUserProfile.id];
        const parentCandidateFilter = (pGender) => (p) => {
            if (p.id === localCurrentUserProfile.id) return false; 
            if (p.gender !== pGender && p.gender !== 'unknown') return false; // Allow unknown gender as parent too
            if (p.id === (pGender === 'male' ? localCurrentUserProfile.mid : localCurrentUserProfile.fid)) return false; 
            if (localAllPeople.some(child => (child.fid === localCurrentUserProfile.id || child.mid === localCurrentUserProfile.id) && child.id === p.id)) return false;
            if (localCurrentUserProfile.pids && localCurrentUserProfile.pids.includes(p.id)) return false;
            return true;
        };

        await populateSelect('profile-fid', localAllPeople, localCurrentUserProfile.fid, selfId, parentCandidateFilter('male'));
        await populateSelect('profile-mid', localAllPeople, localCurrentUserProfile.mid, selfId, parentCandidateFilter('female'));


        await setupDynamicFamilySections(localAllPeople, localCurrentUserProfile, messageDiv);

        if(populateMainFields) messageDiv.textContent = ""; 
        return { currentUserProfile: localCurrentUserProfile, allPeople: localAllPeople };

    } catch (error) {
        console.error("Erreur critique au chargement du profil:", error);
        messageDiv.textContent = `Erreur critique: ${error.message}. Redirection...`;
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
          messageDiv.textContent = "Parent retiré (sera appliqué à la sauvegarde)."; messageDiv.style.color = 'orange';
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
        const url = event.target.value.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) { 
            imgPreview.src = url; 
            if (imgFileInput) imgFileInput.value = ''; 
        } else if (!url) { 
            if (imgFileInput && imgFileInput.files[0]) {
                // If file is selected, keep its preview. FileReader already did this.
            } else if (currentUserProfile) { 
                 imgPreview.src = currentUserProfile.img || '/assets/avatars/default.svg';
            }
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
    const pids = Array.from(conjointSelects)
                      .map(s => s.value)
                      .filter(v => v && v.trim() !== ""); 

    let imgData = currentUserProfile.img || '/assets/avatars/default.svg'; 
    const currentImgFile = imgFileInput ? imgFileInput.files[0] : null;
    const currentImgUrl = imgUrlInput ? imgUrlInput.value.trim() : '';

    if (currentImgFile && currentImgFile.size > 0) {
      imgData = await toBase64(currentImgFile);
    } else if (currentImgUrl && (currentImgUrl.startsWith('http://') || currentImgUrl.startsWith('https://'))) {
      imgData = currentImgUrl;
    } else if (!currentImgUrl && !currentImgFile) { 
        imgData = currentUserProfile.img || '/assets/avatars/default.svg';
    }


    if (fid && mid && fid === mid) {
        messageDiv.textContent = "Le père et la mère ne peuvent pas être la même personne.";
        messageDiv.style.color = 'red';
        setTimeout(() => { messageDiv.textContent = ""; }, 5000);
        return;
    }
    if (pids.includes(fid) && fid !== null) { 
        messageDiv.textContent = "Un conjoint ne peut pas être également le père.";
        messageDiv.style.color = 'red';
        setTimeout(() => { messageDiv.textContent = ""; }, 5000);
        return;
    }
    if (pids.includes(mid) && mid !== null) { 
        messageDiv.textContent = "Un conjoint ne peut pas être également la mère.";
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
            if (confirm("Confirmation finale : Supprimer définitivement le compte et toutes les données associées ?")) {
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