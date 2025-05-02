//main.ts
import './css/style.css';
import { initRouter } from './router';

// Charger les données dynamiquement
fetch('/data/dummydata.json')
  .then(res => res.json())
  .then(rawFamilyData => {
    initRouter(rawFamilyData);
  })
  .catch(err => {
    console.error('Erreur lors du chargement des données JSON :', err);
  });
