import express from 'express';
import { register, login, getCurrentUser, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

// Route pour obtenir l'utilisateur courant
router.get('/me', authenticateToken, getCurrentUser);

router.get('/test', (req, res) => {
    return res.status(200).json({ message: 'Route de test fonctionnelle' });
});

export default router;