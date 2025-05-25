import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import path from 'path';
import fs from 'fs-extra';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      familyRole?: string;
    }
  }
}

// Middleware pour vérifier le token JWT
export const authenticateToken = (req: Request, res: Response, next: NextFunction): Response => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JwtPayload;
    req.user = decoded;
    next();
    return res;
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

// Middleware pour vérifier les permissions sur une famille
export const checkFamilyPermission = (requiredRole: 'owner' | 'editor' | 'viewer') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | undefined> => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const { familyId } = req.params;
    if (!familyId) {
      return res.status(400).json({ message: 'ID de famille requis' });
    }

    try {
      // Lire le fichier de l'utilisateur
      const userFilePath = path.join(
        process.env.DATA_DIRECTORY || path.join(__dirname, '../../data'),
        'users',
        `${req.user.userId}.json`
      );

      if (!fs.existsSync(userFilePath)) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const userData = await fs.readJSON(userFilePath);
      const family = userData.families.find((f: any) => f.familyId === familyId);

      if (!family) {
        return res.status(403).json({ message: 'Vous n\'avez pas accès à cette famille' });
      }

      // Vérifier le rôle requis
      const roles = {
        owner: ['owner'],
        editor: ['owner', 'editor'],
        viewer: ['owner', 'editor', 'viewer']
      };

      if (!roles[requiredRole].includes(family.role)) {
        return res.status(403).json({
          message: `Permission insuffisante. Rôle ${requiredRole} requis.`
        });
      }

      // Stocker le rôle pour une utilisation ultérieure
      req.familyRole = family.role;
      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };
};