// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { RegisterUserRequest, LoginRequest, User, JwtPayload, FamilyPerson } from '../types'; // Ajout de FamilyPerson

const dataDirectory = process.env.DATA_DIRECTORY || path.join(__dirname, '../../data');
const usersDirectory = path.join(dataDirectory, 'users');
const familyDataPath = path.join(dataDirectory, 'familydata.json'); // Pour la suppression de compte
fs.ensureDirSync(usersDirectory); 

const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '24h' } // Durée de validité du token
  );
};

// Helper pour lire familydata.json (dupliqué de family.controller pour éviter dépendance circulaire directe)
const readFamilyDataInternal = async (): Promise<FamilyPerson[]> => {
  try {
    if (await fs.pathExists(familyDataPath)) {
      const data = await fs.readJSON(familyDataPath);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Internal: Error reading family data:', error);
    return [];
  }
};

// Helper pour écrire familydata.json
const writeFamilyDataInternal = async (data: FamilyPerson[]): Promise<void> => {
  try {
    await fs.writeJSON(familyDataPath, data, { spaces: 2 });
  } catch (error) {
    console.error('Internal: Error writing family data:', error);
  }
};


export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName }: RegisterUserRequest = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const users = await fs.readdir(usersDirectory);
    for (const userFile of users) {
      if (!userFile.endsWith('.json')) continue;
      try {
        const userData = await fs.readJSON(path.join(usersDirectory, userFile));
        if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
      } catch (e) {
        console.warn(`Could not read or parse user file ${userFile} during registration check: `, e)
      }
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: userId,
      email: email.toLowerCase(), // Stocker en minuscules pour la cohérence
      password: hashedPassword,
      firstName,
      lastName,
      families: [], // Pour une future gestion multi-familles
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await fs.writeJSON(path.join(usersDirectory, `${userId}.json`), newUser, { spaces: 2 });
    const token = generateToken({ userId: newUser.id, email: newUser.email });
    const { password: _, ...userWithoutPassword } = newUser;

    // Le frontend appellera /family/ensure-profile pour créer l'entrée dans familydata.json
    return res.status(201).json({
      message: 'Utilisateur créé avec succès. Vous pouvez maintenant vous connecter.',
      token, // Le frontend pourrait stocker ce token et rediriger vers le login ou appeler ensure-profile
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
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
        console.warn(`Could not read or parse user file ${userFile} during login: `, e)
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken({ userId: user.id, email: user.email });
    const { password: _, ...userWithoutPassword } = user;
    
    // Le frontend appellera /family/ensure-profile pour synchroniser avec l'arbre si nécessaire
    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentification requise pour obtenir l\'utilisateur courant.' });
    }

    const userFilePath = path.join(usersDirectory, `${req.user.userId}.json`);
    if (!await fs.pathExists(userFilePath)) {
      console.warn(`Tentative d'accès à un fichier utilisateur inexistant: ${req.user.userId}.json`);
      return res.status(404).json({ message: 'Fichier utilisateur non trouvé. L\'utilisateur pourrait avoir été supprimé.' });
    }

    const userData = await fs.readJSON(userFilePath) as User;
    const { password, ...userWithoutPassword } = userData;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur courant:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur.' });
  }
};


export const deleteUserAccount = async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Authentification requise pour supprimer le compte.' });
    }
    const userIdToDelete = req.user.userId;

    try {
        // 1. Supprimer le fichier d'authentification de l'utilisateur
        const userAuthFilePath = path.join(usersDirectory, `${userIdToDelete}.json`);
        if (await fs.pathExists(userAuthFilePath)) {
            await fs.remove(userAuthFilePath);
        } else {
            console.warn(`Tentative de suppression d'un fichier utilisateur (auth) inexistant: ${userIdToDelete}.json`);
            // On continue pour nettoyer familydata.json au cas où
        }

        // 2. Nettoyer les références dans familydata.json
        let familyData = await readFamilyDataInternal();
        const userExistsInFamily = familyData.some(p => p.id === userIdToDelete);

        if (userExistsInFamily) {
            // Retirer la personne de la liste principale
            familyData = familyData.filter(p => p.id !== userIdToDelete);

            // Nettoyer les références à cette personne (comme parent ou conjoint)
            familyData = familyData.map(person => {
                const updatedPerson = { ...person };
                if (updatedPerson.fid === userIdToDelete) {
                    updatedPerson.fid = null;
                }
                if (updatedPerson.mid === userIdToDelete) {
                    updatedPerson.mid = null;
                }
                if (updatedPerson.pids && updatedPerson.pids.includes(userIdToDelete)) {
                    updatedPerson.pids = updatedPerson.pids.filter(pid => pid !== userIdToDelete);
                }
                return updatedPerson;
            });
            await writeFamilyDataInternal(familyData);
        }
        
        // Le token JWT sera invalidé côté client par la déconnexion.
        // Si on utilise des refresh tokens ou une liste de révocation côté serveur, il faudrait gérer cela ici.
        return res.status(200).json({ message: 'Compte utilisateur et données associées supprimés avec succès.' });

    } catch (error) {
        console.error(`Erreur lors de la suppression du compte ${userIdToDelete}:`, error);
        return res.status(500).json({ message: 'Erreur serveur lors de la suppression du compte.' });
    }
};


// resetPassword reste inchangé pour l'instant
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, temporaryPassword, newPassword } = req.body;

    if (!email || !temporaryPassword || !newPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis pour la réinitialisation.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
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
         console.warn(`Could not read or parse user file ${file} during password reset: `, e)
      }
    }

    if (!userFile || !userData) {
      return res.status(404).json({ message: 'Utilisateur non trouvé pour la réinitialisation du mot de passe.' });
    }

    // Ici, on supposerait que temporaryPassword est un code envoyé par email,
    // ou l'ancien mot de passe si c'est un changement de mot de passe normal.
    // Pour l'instant, on le compare au mot de passe actuel.
    const isPasswordValid = await bcrypt.compare(temporaryPassword, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe temporaire (ou actuel) incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userData.password = hashedPassword;
    userData.updatedAt = new Date();

    await fs.writeJSON(path.join(usersDirectory, userFile), userData, { spaces: 2 });

    return res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation du mot de passe.' });
  }
};