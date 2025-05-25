// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { RegisterUserRequest, LoginRequest, User, JwtPayload } from '../types';

const dataDirectory = process.env.DATA_DIRECTORY || path.join(__dirname, '../../data');
const usersDirectory = path.join(dataDirectory, 'users');
fs.ensureDirSync(usersDirectory); // S'assurer que le dossier existe au démarrage

const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '24h' }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName }: RegisterUserRequest = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const users = await fs.readdir(usersDirectory);
    for (const userFile of users) {
      if (!userFile.endsWith('.json')) continue; // Ignorer les fichiers non-JSON
      try {
        const userData = await fs.readJSON(path.join(usersDirectory, userFile));
        if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
      } catch (e) {
        console.warn(`Could not read or parse user file ${userFile}: `, e)
      }
    }

    const userId = uuidv4(); // Utiliser l'UUID généré comme ID utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: userId, // ID d'authentification
      email,
      password: hashedPassword,
      firstName,
      lastName,
      families: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await fs.writeJSON(path.join(usersDirectory, `${userId}.json`), newUser, { spaces: 2 });
    const token = generateToken({ userId: newUser.id, email: newUser.email });
    const { password: _, ...userWithoutPassword } = newUser;

    // Le frontend se chargera d'appeler /api/family/ensure-user si nécessaire
    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const users = await fs.readdir(usersDirectory);
    let user: User | null = null;

    for (const userFile of users) {
      if (!userFile.endsWith('.json')) continue;
      try {
        const userData = await fs.readJSON(path.join(usersDirectory, userFile)) as User;
        if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
          user = userData;
          break;
        }
      } catch(e) {
        console.warn(`Could not read or parse user file ${userFile}: `, e)
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken({ userId: user.id, email: user.email });
    const { password: _, ...userWithoutPassword } = user;
    
    // Le frontend se chargera d'appeler /api/family/ensure-user pour synchroniser avec l'arbre
    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword // Contient id (UUID), email, firstName, lastName
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const userFilePath = path.join(usersDirectory, `${req.user.userId}.json`);
    if (!fs.existsSync(userFilePath)) {
      return res.status(404).json({ message: 'Fichier utilisateur non trouvé' });
    }

    const userData = await fs.readJSON(userFilePath) as User;
    const { password, ...userWithoutPassword } = userData;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// resetPassword reste inchangé pour l'instant
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, temporaryPassword, newPassword } = req.body;

    if (!email || !temporaryPassword || !newPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const users = await fs.readdir(usersDirectory);
    let userFile: string | null = null;
    let userData: User | null = null;

    for (const file of users) {
      if (!file.endsWith('.json')) continue;
      try {
        const user = await fs.readJSON(path.join(usersDirectory, file)) as User;
        if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
          userFile = file;
          userData = user;
          break;
        }
      } catch(e) {
         console.warn(`Could not read or parse user file ${file}: `, e)
      }
    }

    if (!userFile || !userData) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await bcrypt.compare(temporaryPassword, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe temporaire incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userData.password = hashedPassword;
    userData.updatedAt = new Date();

    await fs.writeJSON(path.join(usersDirectory, userFile), userData, { spaces: 2 });

    return res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};