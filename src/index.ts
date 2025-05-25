import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';

import authRoutes from './routes/auth.routes';
import familyRoutes from './routes/family.routes';

// Configuration
dotenv.config();
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Assurer que le répertoire de données existe
const dataDirectory = process.env.DATA_DIRECTORY || path.join(__dirname, '../data');
fs.ensureDirSync(dataDirectory);
fs.ensureDirSync(path.join(dataDirectory, 'users'));
fs.ensureDirSync(path.join(dataDirectory, 'uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);

// Route par défaut
app.get('/', (_req: Request, res: Response) => {
  res.send('API de l\'arbre généalogique fonctionne correctement !');
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;