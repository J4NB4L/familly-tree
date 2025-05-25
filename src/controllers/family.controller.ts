// backend/src/controllers/family.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { FamilyPerson, User } from '../types';

const dataDirectory = process.env.DATA_DIRECTORY || path.join(__dirname, '../../data');
const familyDataPath = path.join(dataDirectory, 'familydata.json');

// Helper pour lire les données familiales
const readFamilyData = async (): Promise<FamilyPerson[]> => {
  try {
    if (await fs.pathExists(familyDataPath)) {
      return await fs.readJSON(familyDataPath) as FamilyPerson[];
    }
    // Si le fichier n'existe pas, le créer avec un tableau vide
    await fs.writeJSON(familyDataPath, [], { spaces: 2 });
    return [];
  } catch (error) {
    console.error('Error reading/initializing family data:', error);
    return [];
  }
};

// Helper pour écrire les données familiales
const writeFamilyData = async (data: FamilyPerson[]): Promise<void> => {
  try {
    await fs.writeJSON(familyDataPath, data, { spaces: 2 });
  } catch (error) {
    console.error('Error writing family data:', error);
  }
};

export const getAllFamilyData = async (_req: Request, res: Response) => {
  const data = await readFamilyData();
  res.status(200).json(data);
};

export const getPersonById = async (req: Request, res: Response) => {
  const data = await readFamilyData();
  const personId = req.params.id; // UUID est une string
  const person = data.find(p => p.id === personId);
  if (person) {
    res.status(200).json(person);
  } else {
    res.status(404).json({ message: 'Personne non trouvée' });
  }
};

// Endpoint pour obtenir le profil familial de l'utilisateur connecté
export const getCurrentUserFamilyProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  const userId = req.user.userId; // Ceci est l'ID d'authentification (UUID)

  const familyData = await readFamilyData();
  // On suppose que l'ID de la personne dans l'arbre est le même que l'ID d'authentification
  const userProfileInFamily = familyData.find(p => p.id === userId);

  if (userProfileInFamily) {
    res.status(200).json(userProfileInFamily);
  } else {
    // L'utilisateur est authentifié mais n'a pas encore de profil dans l'arbre.
    // Cela peut arriver si 'ensureUserInFamilyTree' n'a pas encore été appelé.
    // On pourrait le créer ici, ou laisser le frontend gérer cet état.
    // Pour l'instant, on retourne 404, le frontend devra appeler 'ensure'
    res.status(404).json({ message: 'Profil familial de l\'utilisateur non trouvé. Veuillez compléter votre profil.' });
  }
};


export const updatePerson = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  const personIdToUpdate = req.params.id; // UUID
  const incomingData = req.body as Partial<FamilyPerson>; // Le frontend envoie les champs modifiés

  let family = await readFamilyData();
  const personIndex = family.findIndex(p => p.id === personIdToUpdate);

  if (personIndex === -1) {
    return res.status(404).json({ message: 'Personne non trouvée pour la mise à jour.' });
  }

  // Fusionner les données existantes avec les données entrantes
  const originalPerson = family[personIndex];
  const updatedPerson: FamilyPerson = {
    ...originalPerson,
    ...incomingData,
    id: originalPerson.id, // Assurer que l'ID ne change pas
  };
  
  family[personIndex] = updatedPerson;

  // Gérer la réciprocité des pids (conjoints)
  // 1. Pour chaque nouveau pid ajouté à updatedPerson, s'assurer que updatedPerson.id est dans les pids du partenaire.
  if (updatedPerson.pids) {
    updatedPerson.pids.forEach(pid => {
      const partnerIndex = family.findIndex(p => p.id === pid);
      if (partnerIndex > -1) {
        family[partnerIndex].pids = family[partnerIndex].pids || [];
        if (!family[partnerIndex].pids.includes(updatedPerson.id)) {
          family[partnerIndex].pids.push(updatedPerson.id);
        }
      }
    });
  }

  // 2. Pour chaque personne dans la famille, si elle avait updatedPerson comme pid,
  //    mais que updatedPerson ne l'a plus comme pid, la retirer.
  family.forEach((person, index) => {
    if (person.pids && person.pids.includes(updatedPerson.id)) {
      if (!updatedPerson.pids || !updatedPerson.pids.includes(person.id)) {
        // updatedPerson a retiré person de ses conjoints
        family[index].pids = family[index].pids.filter(id => id !== updatedPerson.id);
      }
    }
  });


  // Gérer la réciprocité des enfants (si fid/mid sont mis à jour sur l'enfant)
  // Si updatedPerson est un enfant dont on change fid/mid:
  //   - L'ancien parent (si existait) ne devrait plus le lister comme enfant (implicite, non stocké chez le parent)
  //   - Le nouveau parent (si existait) ... (implicite)
  // Si updatedPerson est un parent dont on change les enfants (via pids) -> Ceci n'est pas le modèle, on modifie fid/mid sur l'enfant.

  // Si le `fid` de `updatedPerson` a changé, et que `updatedPerson` est un enfant.
  // (Cette logique est plus complexe si on veut que le parent ait une liste `childrenIds`)
  // Pour l'instant, le modèle est que l'enfant a `fid` et `mid`.
  // Si on modifie fid/mid sur `updatedPerson`, il n'y a pas de réciprocité directe à gérer ici
  // autre que de s'assurer que les IDs existent.

  await writeFamilyData(family);
  res.status(200).json(family[personIndex]); // Renvoyer la personne mise à jour
};


// S'assure qu'un utilisateur (identifié par son token JWT) a une entrée dans familydata.json
// Si l'utilisateur n'existe pas dans familydata.json, il est créé.
// L'ID de la personne dans familydata.json sera l'ID de l'utilisateur (User.id).
export const ensureUserInFamilyTree = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  
  const authUser = req.user as JwtPayload; // Contient userId (UUID) et email
  const userDetailsFromRequest = req.body as Partial<FamilyPerson>; // Peut contenir name, gender, birthYear, img, etc.

  let family = await readFamilyData();
  let personInFamily = family.find(p => p.id === authUser.userId);

  if (!personInFamily) {
    // L'utilisateur n'est pas dans l'arbre, créons-le
    // Il nous faut les infos de base. Le frontend devrait les envoyer après la connexion/inscription.
    // Ces infos (nom, prénom) sont dans la table User du backend, mais pas directement dans JwtPayload.
    // Le frontend doit envoyer ces infos.
    const usersDir = path.join(dataDirectory, 'users');
    const userAuthDataPath = path.join(usersDir, `${authUser.userId}.json`);
    
    let nameFromAuth = "Utilisateur Inconnu";
    if (await fs.pathExists(userAuthDataPath)) {
        const userAuthData = await fs.readJSON(userAuthDataPath) as User;
        nameFromAuth = `${userAuthData.firstName} ${userAuthData.lastName}`;
    }

    personInFamily = {
      id: authUser.userId, // L'ID de la personne est l'ID d'authentification
      name: userDetailsFromRequest.name || nameFromAuth,
      mid: userDetailsFromRequest.mid || null,
      fid: userDetailsFromRequest.fid || null,
      pids: userDetailsFromRequest.pids || [],
      gender: userDetailsFromRequest.gender || 'unknown',
      birthYear: userDetailsFromRequest.birthYear,
      img: userDetailsFromRequest.img || '/assets/avatars/default.svg',
      gmail: userDetailsFromRequest.gmail || authUser.email,
      ...userDetailsFromRequest // Appliquer d'autres champs fournis
    };
    family.push(personInFamily);
    await writeFamilyData(family);
    res.status(201).json(personInFamily);
  } else {
    // L'utilisateur existe, mettons à jour ses informations si fournies
    const updatedPerson = { ...personInFamily, ...userDetailsFromRequest, id: personInFamily.id, gmail: personInFamily.gmail || authUser.email };
    const personIndex = family.findIndex(p => p.id === authUser.userId);
    family[personIndex] = updatedPerson;
    await writeFamilyData(family);
    res.status(200).json(updatedPerson);
  }
};

// Ce endpoint est pour la vue "personnelle", il filtre les données.
export const getPersonalFamilyData = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  const authUserId = req.user.userId;

  const allData = await readFamilyData();
  const currentUserProfileInFamilyData = allData.find(p => p.id === authUserId);

  if (!currentUserProfileInFamilyData) {
    return res.status(404).json({ message: "Profil utilisateur non trouvé dans les données familiales pour la vue personnelle." });
  }

  const personalDataMap = new Map<string, FamilyPerson>();

  const addPersonToMapById = (personId: string | null | undefined) => {
    if (!personId) return;
    if (personalDataMap.has(personId)) return;
    const person = allData.find(p => p.id === personId);
    if (person) personalDataMap.set(person.id, { ...person });
  };

  addPersonToMapById(authUserId);
  const currentUserFromMap = personalDataMap.get(authUserId);

  if (currentUserFromMap) {
    if (currentUserFromMap.fid) addPersonToMapById(currentUserFromMap.fid);
    if (currentUserFromMap.mid) addPersonToMapById(currentUserFromMap.mid);
    if (currentUserFromMap.pids) currentUserFromMap.pids.forEach(pid => addPersonToMapById(pid));

    allData.forEach(person => {
      if (person.fid === authUserId || person.mid === authUserId) {
        addPersonToMapById(person.id);
      }
    });
  }

  const finalPersonalData = Array.from(personalDataMap.values()).map(personInMap => {
    const updatedPids = (personInMap.pids || []).filter(pid => personalDataMap.has(pid));
    return { ...personInMap, pids: updatedPids };
  });

  res.status(200).json(finalPersonalData);
};