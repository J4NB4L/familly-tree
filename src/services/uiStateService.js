// src/services/uiStateService.js
const ALGORITHM_STEPS_KEY = 'algorithmSteps';

export const uiStateService = {
  clearAlgorithmSteps: () => {
    localStorage.setItem(ALGORITHM_STEPS_KEY, JSON.stringify([]));
  },

  addAlgorithmStep: (stepMessage) => {
    const steps = uiStateService.getAlgorithmSteps();
    steps.push(stepMessage);
    localStorage.setItem(ALGORITHM_STEPS_KEY, JSON.stringify(steps));
  },

  getAlgorithmSteps: () => {
    const stored = localStorage.getItem(ALGORITHM_STEPS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
};