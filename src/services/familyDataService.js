// src/services/familyDataService.js
import { getPersonalFamilyData as filterPersonalFamilyData } from '../js/utils/family-data-filter'; // Keep utility separate

const FAMILY_DATA_KEY = 'familyData';

// Private helper to ensure data is initialized
async function ensureFamilyDataInitialized() {
  if (!localStorage.getItem(FAMILY_DATA_KEY)) {
    try {
      const response = await fetch('/data/dummydata.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const initialFamilyData = await response.json();
      localStorage.setItem(FAMILY_DATA_KEY, JSON.stringify(initialFamilyData));
      console.log("Family data initialized from dummydata.json");
      return initialFamilyData;
    } catch (error) {
      console.error("Failed to fetch or initialize family data:", error);
      localStorage.setItem(FAMILY_DATA_KEY, JSON.stringify([])); // Initialize with empty on error
      return [];
    }
  }
  return JSON.parse(localStorage.getItem(FAMILY_DATA_KEY));
}


export const familyDataService = {
  getAllFamilyData: async () => {
    return await ensureFamilyDataInitialized();
  },

  getRawFamilyDataSync: () => { // For cases where async is problematic and data is known to be there
    const data = localStorage.getItem(FAMILY_DATA_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveAllFamilyData: (data) => {
    localStorage.setItem(FAMILY_DATA_KEY, JSON.stringify(data));
  },

  // Gets the user's representation *within* the familyData array,
  // ensuring it exists and is up-to-date with the profile.
  // This is crucial for consistency.
  _ensureUserInFamilyData: (userProfile, currentFamilyData) => {
    let familyData = [...currentFamilyData]; // Work on a copy
    let userInFamily = familyData.find(p => p.id === userProfile.id);
    
    const profileToSync = {
        id: userProfile.id,
        name: userProfile.name,
        mid: userProfile.mid,
        fid: userProfile.fid,
        pids: userProfile.pids || [],
        gender: userProfile.gender,
        birthYear: userProfile.birthYear,
        deathYear: userProfile.deathYear, // Ensure all relevant fields are synced
        img: userProfile.img,
        gmail: userProfile.gmail
    };

    if (!userInFamily) {
      userInFamily = { ...profileToSync }; // Create new from profile
      familyData.push(userInFamily);
    } else {
      // User exists, update it with properties from userProfileSource
      Object.assign(userInFamily, profileToSync);
    }
    familyDataService.saveAllFamilyData(familyData); // Persist change
    return { updatedFamilyData: familyData, userNodeInFamilyData: userInFamily };
  },

  getPersonById: async (id) => {
    const data = await familyDataService.getAllFamilyData();
    return data.find(p => p.id === id);
  },

  updatePersonInFamilyData: async (personToUpdate) => {
    let data = await familyDataService.getAllFamilyData();
    const personIndex = data.findIndex(p => p.id === personToUpdate.id);
    if (personIndex > -1) {
      data[personIndex] = { ...data[personIndex], ...personToUpdate };
    } else {
      // If person doesn't exist, decide whether to add them or throw an error
      // For now, let's assume update means they should exist or it's an error.
      // Or, if it's the current user, it's fine to add.
      console.warn(`Person with ID ${personToUpdate.id} not found in familyData for update. Adding them.`);
      data.push({...personToUpdate}); // Add if not found - useful for new user from profile
    }
    familyDataService.saveAllFamilyData(data);
    return personToUpdate;
  },

  addSpouse: async (userProfile, spouseId) => {
    let allData = await familyDataService.getAllFamilyData();
    const { updatedFamilyData, userNodeInFamilyData } = familyDataService._ensureUserInFamilyData(userProfile, allData);
    allData = updatedFamilyData; // Use the potentially updated array

    const spouseNode = allData.find(p => p.id === spouseId);

    if (userNodeInFamilyData && spouseNode) {
      userNodeInFamilyData.pids = userNodeInFamilyData.pids || [];
      if (!userNodeInFamilyData.pids.includes(spouseId)) {
        userNodeInFamilyData.pids.push(spouseId);
      }
      spouseNode.pids = spouseNode.pids || [];
      if (!spouseNode.pids.includes(userNodeInFamilyData.id)) {
        spouseNode.pids.push(userNodeInFamilyData.id);
      }
      familyDataService.saveAllFamilyData(allData);
      // The userProfile itself might also need to reflect this change for consistency
      // So, return the updated userNode which should be used to update userProfile in localStorage
      return userNodeInFamilyData; 
    }
    return null; // Or throw error
  },

  setFather: async (userProfile, fatherId) => {
    let allData = await familyDataService.getAllFamilyData();
    const { updatedFamilyData, userNodeInFamilyData } = familyDataService._ensureUserInFamilyData(userProfile, allData);
    allData = updatedFamilyData;

    const fatherNode = allData.find(p => p.id === fatherId);
    if (userNodeInFamilyData && fatherNode && fatherNode.gender === 'male') {
      userNodeInFamilyData.fid = fatherId;
      if (userNodeInFamilyData.mid === fatherId) userNodeInFamilyData.mid = null;
      familyDataService.saveAllFamilyData(allData);
      return userNodeInFamilyData;
    }
    return null;
  },

  setMother: async (userProfile, motherId) => {
    let allData = await familyDataService.getAllFamilyData();
    const { updatedFamilyData, userNodeInFamilyData } = familyDataService._ensureUserInFamilyData(userProfile, allData);
    allData = updatedFamilyData;

    const motherNode = allData.find(p => p.id === motherId);
    if (userNodeInFamilyData && motherNode && motherNode.gender === 'female') {
      userNodeInFamilyData.mid = motherId;
      if (userNodeInFamilyData.fid === motherId) userNodeInFamilyData.fid = null;
      familyDataService.saveAllFamilyData(allData);
      return userNodeInFamilyData;
    }
    return null;
  },

  addChild: async (userProfile, childId) => {
    let allData = await familyDataService.getAllFamilyData();
    // Ensure parent (userProfile) is synced in familyData
    const { updatedFamilyData, userNodeInFamilyData: parentNode } = familyDataService._ensureUserInFamilyData(userProfile, allData);
    allData = updatedFamilyData;

    const childNode = allData.find(p => p.id === childId);

    if (parentNode && childNode) {
      if (parentNode.gender === 'male') {
        childNode.fid = parentNode.id;
        if (childNode.mid === parentNode.id) childNode.mid = null;
      } else if (parentNode.gender === 'female') {
        childNode.mid = parentNode.id;
        if (childNode.fid === parentNode.id) childNode.fid = null;
      }
      familyDataService.saveAllFamilyData(allData);
      // Parent profile (userNodeInFamilyData) itself isn't changed when adding children,
      // but the child in allData is.
      return parentNode; // Return parent for consistency, though it's not modified here
    }
    return null;
  },
  
  getPersonalFamilyData: async (userProfile) => {
    if (!userProfile) return [];
    const fullFamilyData = await familyDataService.getAllFamilyData();
    return filterPersonalFamilyData(fullFamilyData, userProfile);
  }
};