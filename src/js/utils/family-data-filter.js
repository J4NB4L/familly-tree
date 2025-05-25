// src/js/utils/family-data-filter.js
export function filterDataForPersonalView(fullFamilyData, userProfile) { 
    console.log("--- Inside filterDataForPersonalView (util) ---");
    console.log("Argument 'fullFamilyData':", fullFamilyData); // Should be an array
    console.log("Argument 'userProfile':", userProfile);       // Should be a single 
    // Initial guard clauses
    if (!userProfile || typeof userProfile.id === 'undefined' || userProfile.id === null) {
      console.error("filterDataForPersonalView (util): Called with invalid userProfile (or its ID is missing).", userProfile);
      return [];
    }
    if (!fullFamilyData || !Array.isArray(fullFamilyData)) { // Check if fullFamilyData is actually an array
      console.error("filterDataForPersonalView (util): fullFamilyData is not a valid array.", fullFamilyData);
      // If we have a valid user profile but no family data, we should still return the user.
      return [{
        id: userProfile.id,
        name: userProfile.name,
        mid: userProfile.mid,
        fid: userProfile.fid,
        pids: [],
        gender: userProfile.gender,
        birthYear: userProfile.birthYear,
        deathYear: userProfile.deathYear,
        img: userProfile.img,
        gmail: userProfile.gmail
      }];
    }
    if (fullFamilyData.length === 0) {
        console.warn("filterDataForPersonalView (util): fullFamilyData is empty. Returning only the user profile.");
        return [{
          id: userProfile.id,
          name: userProfile.name,
          mid: userProfile.mid,
          fid: userProfile.fid,
          pids: userProfile.pids || [],
          gender: userProfile.gender,
          birthYear: userProfile.birthYear,
          deathYear: userProfile.deathYear,
          img: userProfile.img,
          gmail: userProfile.gmail
        }];
      }
    console.log("filterDataForPersonalView (util) - Received fullFamilyData (length):", fullFamilyData.length, "Received userProfile:", userProfile.name, userProfile.id);
  
    const personalDataMap = new Map();
    const userId = userProfile.id; // userId is from the (hopefully) single userProfile object
  
    function addPersonToMapById(personId) {
      if (personId === null || typeof personId === 'undefined') return;
      if (personalDataMap.has(personId)) return;
  
      const person = fullFamilyData.find(p => p.id === personId);
      if (person) {
        personalDataMap.set(person.id, { ...person });
      } else {
        console.warn(`filterDataForPersonalView (util): Person with ID ${personId} not found in fullFamilyData.`);
      }
    }
  
    // 1. Add the user themselves
    let userInSourceArray = fullFamilyData.find(p => p.id === userId);
    if (userInSourceArray) {
      console.log(`filterDataForPersonalView (util): Found user ${userId} in fullFamilyData. Adding to map.`);
      personalDataMap.set(userInSourceArray.id, { ...userInSourceArray });
    } else {
        console.warn(`User ID ${userId} not found in fullFamilyData. Using userProfile object directly.`);
        personalDataMap.set(userProfile.id, { 
          id: userProfile.id,
          name: userProfile.name,
          mid: userProfile.mid,
          fid: userProfile.fid,
          pids: userProfile.pids || [],
          gender: userProfile.gender,
          birthYear: userProfile.birthYear,
          deathYear: userProfile.deathYear,
          img: userProfile.img,
          gmail: userProfile.gmail
        });
      }
  
    if (!personalDataMap.has(userId)) {
      console.error("filterDataForPersonalView (util): User could not be added to the map. This should not happen if userProfile was valid.");
      return [];
    }
    const currentUser = personalDataMap.get(userId);
    console.log("Current user from map:", currentUser);

    // 2. Ajouter le père de l'utilisateur
    if (currentUser.fid) {
      console.log(`Looking for father with ID: ${currentUser.fid}`);
      addPersonToMapById(currentUser.fid);
    } else {
      console.log("User has no father ID (fid)");
    }

    // 3. Ajouter la mère de l'utilisateur
    if (currentUser.mid) {
      console.log(`Looking for mother with ID: ${currentUser.mid}`);
      addPersonToMapById(currentUser.mid);
    } else {
      console.log("User has no mother ID (mid)");
    }
  
    // 4. Ajouter les enfants de l'utilisateur
    console.log("Looking for children of user...");
    let childrenFound = 0;
    fullFamilyData.forEach(personInFullData => {
      // Vérifier si cette personne est un enfant de l'utilisateur
      if (personInFullData.fid === userId || personInFullData.mid === userId) {
        console.log(`Found child: ${personInFullData.name} (ID: ${personInFullData.id})`);
        if (!personalDataMap.has(personInFullData.id)) {
          personalDataMap.set(personInFullData.id, { ...personInFullData });
          childrenFound++;
        }
      }
    });
    console.log(`Total children found: ${childrenFound}`);
  
    // 5. Nettoyer les pids pour ne garder que ceux qui sont dans notre map
    const finalPersonalData = Array.from(personalDataMap.values()).map(personInMap => {
        const updatedPids = (personInMap.pids || []).filter(pid => personalDataMap.has(pid));
        return { ...personInMap, pids: updatedPids };
      });
  
      if (finalPersonalData.length === 0) {
        console.error("finalPersonalData is unexpectedly empty.");
        return [];
      }
  
      console.log("filterDataForPersonalView (util): Filtered data for personal view:");
      finalPersonalData.forEach(person => {
        console.log(`- ${person.name} (ID: ${person.id})`);
      });
      
      return finalPersonalData;
  }