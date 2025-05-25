// main.ts
import './css/style.css';
import { initRouter } from './router';
import { familyDataService } from './services/familyDataService'; // Import service

async function main() {
  // Ensure family data is initialized once when the app loads, if necessary.
  // This can be called by any component/service that needs it first.
  // Or explicitly here.
  await familyDataService.getAllFamilyData(); // This will trigger initialization if needed.
  initRouter();
}

main();