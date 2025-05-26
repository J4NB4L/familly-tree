// backend/src/routes/auth.routes.ts
import express from 'express';
import { register, login, getCurrentUser, resetPassword, deleteUserAccount } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword); // Potentiellement à protéger ou à revoir la logique de temp password

// Routes protégées
router.get('/me', authenticateToken, getCurrentUser);
router.delete('/delete-account', authenticateToken, deleteUserAccount); // Nouvelle route

router.get('/test-auth-ping', authenticateToken, (req, res) => {
    return res.status(200).json({ message: 'Route de test authentifiée fonctionnelle', user: req.user });
});

export default router;