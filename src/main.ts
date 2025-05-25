// frontend/src/main.ts
import './css/style.css';
import { initRouter } from './router';
// familyDataService.getAllFamilyData(); // Plus besoin ici, le router et les services s'en chargent

async function main() {
  // La logique d'initialisation des données est maintenant gérée par les services
  // et les composants eux-mêmes lorsqu'ils en ont besoin.
  // Le router s'assurera que l'utilisateur est authentifié avant d'afficher les pages protégées.
  initRouter();
}

main();