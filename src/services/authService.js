// src/services/authService.js
const USER_PROFILE_KEY = 'userProfile';

export const authService = {
  login: async (name, birthYear, gmail, gender, img) => {
    // Simulating ID generation as in original login.js
    const userData = {
      id: Date.now(), 
      name,
      fid: null, // Use fid/mid consistently
      mid: null,
      pids: [],
      gender,
      birthYear,
      img,
      gmail
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userData));
    return userData; // Return the created user profile
  },

  logout: () => {
    localStorage.removeItem(USER_PROFILE_KEY);
    // Optionally clear other session-related data if needed
    // localStorage.removeItem('familyData'); // Or handle this in familyDataService
  },

  getCurrentUserProfile: () => {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  updateCurrentUserProfile: (profileData) => {
    const currentUser = authService.getCurrentUserProfile();
    if (!currentUser) {
        console.error("No user profile found to update.");
        // Potentially create a new one if that's desired behavior, or throw error
        // For now, let's assume an ID must exist or be assigned from profileData
    }
    
    const updatedProfile = {
        ...currentUser, // Spread existing data first
        ...profileData, // Then overwrite with new data
        id: profileData.id || (currentUser ? currentUser.id : Date.now()) // Ensure ID is preserved or assigned
    };

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
    return updatedProfile;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(USER_PROFILE_KEY);
  }
};