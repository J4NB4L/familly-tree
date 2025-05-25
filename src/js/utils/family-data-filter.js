//---> PATH: src/js/utils/family-data-filter.js
export function getPersonalFamilyData(fullFamilyData, userProfile) {
    if (!userProfile || !fullFamilyData || fullFamilyData.length === 0) {
      return [];
    }
  
    const personalDataMap = new Map();
    const userId = userProfile.id;
  
    // 1. Add the user
    const user = fullFamilyData.find(p => p.id === userId);
    if (user) {
      personalDataMap.set(userId, { ...user }); // Store a copy
    } else {
      // If user is not in familyData (e.g., new user not yet fully integrated)
      // Add the profile directly. Ensure it has the necessary fields.
      personalDataMap.set(userId, { 
          id: userProfile.id,
          name: userProfile.name,
          mid: userProfile.mid,
          fid: userProfile.fid,
          pids: userProfile.pids || [],
          gender: userProfile.gender,
          birthYear: userProfile.birthYear,
          img: userProfile.img,
          gmail: userProfile.gmail
       });
    }
  
    const currentUserInMap = personalDataMap.get(userId);
  
    // 2. Add parents
    if (currentUserInMap && currentUserInMap.fid) {
      const father = fullFamilyData.find(p => p.id === currentUserInMap.fid);
      if (father) personalDataMap.set(father.id, { ...father });
    }
    if (currentUserInMap && currentUserInMap.mid) {
      const mother = fullFamilyData.find(p => p.id === currentUserInMap.mid);
      if (mother) personalDataMap.set(mother.id, { ...mother });
    }
  
    // 3. Add spouses (pids)
    if (currentUserInMap && currentUserInMap.pids && currentUserInMap.pids.length > 0) {
      currentUserInMap.pids.forEach(partnerId => {
        const spouse = fullFamilyData.find(p => p.id === partnerId);
        if (spouse) personalDataMap.set(spouse.id, { ...spouse });
      });
    }
  
    // 4. Add children (where user is fid or mid)
    fullFamilyData.forEach(person => {
      if (person.fid === userId || person.mid === userId) {
        personalDataMap.set(person.id, { ...person });
      }
    });
  
    return Array.from(personalDataMap.values());
  }
  // END OF FILE: src/js/utils/family-data-filter.js