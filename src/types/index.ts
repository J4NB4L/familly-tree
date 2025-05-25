// backend/src/types/index.ts
export interface User { // Utilisateur pour l'authentification
  id: string; // UUID
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  families: UserFamily[]; // Pourrait être utilisé plus tard pour des arbres multiples
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFamily {
  familyId: string; // L'ID de l'arbre/famille auquel l'utilisateur est lié (si arbres multiples)
  role: 'owner' | 'editor' | 'viewer';
}

// Personne dans l'arbre généalogique
export interface FamilyPerson {
  id: string; // UUID, sera le même que User.id si la personne est un utilisateur enregistré
  name: string;
  mid: string | null; // UUID de la mère
  fid: string | null; // UUID du père
  pids: string[];     // Array d'UUIDs des conjoints
  gender: 'male' | 'female' | 'unknown';
  birthYear?: number;
  deathYear?: number;
  img?: string;
  gmail?: string; // Peut être utilisé pour lier à un User authentifié
  // Autres champs spécifiques à l'arbre
  [key: string]: any; // Pour permettre d'autres champs dynamiques si besoin
}


// Types pour les requêtes
export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Types pour l'authentification
export interface JwtPayload {
  userId: string; // UUID de l'utilisateur (User.id)
  email: string;
}