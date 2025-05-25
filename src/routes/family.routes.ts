// backend/src/routes/family.routes.ts
import express from 'express';
import { 
    getAllFamilyData, 
    getPersonById, 
    updatePerson, 
    getPersonalFamilyData,
    ensureUserInFamilyTree,
    getCurrentUserFamilyProfile
} from '../controllers/family.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Route pour s'assurer que l'utilisateur connecté est dans l'arbre, et pour le créer/mettre à jour
router.post('/ensure-profile', authenticateToken, ensureUserInFamilyTree); 
// Route pour obtenir le profil familial de l'utilisateur connecté
router.get('/me', authenticateToken, getCurrentUserFamilyProfile);


router.get('/', authenticateToken, getAllFamilyData);
router.get('/personal', authenticateToken, getPersonalFamilyData); // Vue personnelle
router.get('/:id', authenticateToken, getPersonById); // :id est un UUID
router.put('/:id', authenticateToken, updatePerson);   // :id est un UUID

export default router;