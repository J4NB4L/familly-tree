// main.ts
import './css/style.css';
import { initRouter } from './router';

// Charger les données dynamiquement
const familyData = JSON.parse(localStorage.getItem('familyData')) || [];
initRouter(familyData);
