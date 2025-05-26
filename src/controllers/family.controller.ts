// backend/src/controllers/family.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { FamilyPerson, User, JwtPayload } from '../types';

const dataDirectory = process.env.DATA_DIRECTORY || path.join(__dirname, '../../data');
const familyDataPath = path.join(dataDirectory, 'familydata.json');
const usersDirectory = path.join(dataDirectory, 'users'); 

// Helper pour lire les données familiales
const readFamilyData = async (): Promise<FamilyPerson[]> => {
  try {
    if (await fs.pathExists(familyDataPath)) {
      const data = await fs.readJSON(familyDataPath);
      return Array.isArray(data) ? data : [];
    }
    // Si le fichier n'existe pas, le créer avec un tableau vide
    await fs.writeJSON(familyDataPath, [], { spaces: 2 });
    return [];
  } catch (error) {
    console.error('Error reading/initializing family data:', error);
    try {
        console.warn('Attempting to re-initialize corrupted familydata.json');
        await fs.writeJSON(familyDataPath, [], { spaces: 2 });
    } catch (initError) {
        console.error('Failed to re-initialize family data after read error:', initError);
    }
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

export const getAllFamilyData = async (req: Request, res: Response) => {
  if (!req.user) { 
      return res.status(401).json({ message: 'Authentification requise.' });
  }
  const data = await readFamilyData();
  res.status(200).json(data);
};

export const getPersonById = async (req: Request, res: Response) => {
  if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise.' });
  }
  const data = await readFamilyData();
  const personId = req.params.id; 
  const person = data.find(p => p.id === personId);
  if (person) {
    res.status(200).json(person);
  } else {
    res.status(404).json({ message: 'Personne non trouvée.' });
  }
};

export const updatePerson = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise pour mettre à jour.' });
  }
  const personIdToUpdate = req.params.id;
  
  const incomingData = req.body as Partial<FamilyPerson>;

  let family = await readFamilyData();
  const personIndex = family.findIndex(p => p.id === personIdToUpdate);

  if (personIndex === -1) {
    return res.status(404).json({ message: 'Personne non trouvée pour la mise à jour.' });
  }

  const originalPerson = family[personIndex];
  
  // Validations (les mêmes qu'avant, elles sont importantes)
  if (incomingData.fid && incomingData.fid === personIdToUpdate) {
    return res.status(400).json({ message: 'Une personne ne peut pas être son propre père.' });
  }
  if (incomingData.mid && incomingData.mid === personIdToUpdate) {
    return res.status(400).json({ message: 'Une personne ne peut pas être sa propre mère.' });
  }
  const futureFid = incomingData.fid !== undefined ? (incomingData.fid === "" || incomingData.fid === null ? null : incomingData.fid) : originalPerson.fid;
  const futureMid = incomingData.mid !== undefined ? (incomingData.mid === "" || incomingData.mid === null ? null : incomingData.mid) : originalPerson.mid;

  if (futureFid && futureMid && futureFid === futureMid) {
    return res.status(400).json({ message: 'Le père et la mère ne peuvent pas être la même personne.' });
  }
  if (incomingData.pids && incomingData.pids.includes(personIdToUpdate)) {
    return res.status(400).json({ message: 'Une personne ne peut pas être son propre conjoint.' });
  }
  if (incomingData.pids) {
    if (futureFid && incomingData.pids.includes(futureFid)) {
        return res.status(400).json({ message: 'Un conjoint ne peut pas être le père de la personne.'});
    }
    if (futureMid && incomingData.pids.includes(futureMid)) {
        return res.status(400).json({ message: 'Un conjoint ne peut pas être la mère de la personne.'});
    }
  }

  // Création de l'objet mis à jour
  const updatedPerson: FamilyPerson = {
    ...originalPerson,
    ...incomingData,
    id: originalPerson.id, 
    birthYear: incomingData.birthYear === null ? undefined : (incomingData.birthYear !== undefined ? incomingData.birthYear : originalPerson.birthYear),
    deathYear: incomingData.deathYear === null ? undefined : (incomingData.deathYear !== undefined ? incomingData.deathYear : originalPerson.deathYear),
    fid: incomingData.fid === "" || incomingData.fid === null ? null : (incomingData.fid !== undefined ? incomingData.fid : originalPerson.fid),
    mid: incomingData.mid === "" || incomingData.mid === null ? null : (incomingData.mid !== undefined ? incomingData.mid : originalPerson.mid),
    pids: Array.isArray(incomingData.pids) ? incomingData.pids.filter(pid => pid !== "" && pid !== null) : (originalPerson.pids || []),
  };
  
  // Gérer la réciprocité des pids (conjoints)
  const oldPidsSet = new Set(originalPerson.pids || []);
  const newPidsSet = new Set(updatedPerson.pids || []); 

  family.forEach((personInLoop, indexInLoop) => {
    if (personInLoop.id === updatedPerson.id) return; 

    if (oldPidsSet.has(personInLoop.id) && !newPidsSet.has(personInLoop.id)) {
      if (family[indexInLoop].pids) {
        family[indexInLoop].pids = family[indexInLoop].pids.filter(id => id !== updatedPerson.id);
      }
    }
    if (newPidsSet.has(personInLoop.id) && (!oldPidsSet.has(personInLoop.id) || !family[indexInLoop].pids || !family[indexInLoop].pids.includes(updatedPerson.id) )) {
      family[indexInLoop].pids = Array.from(new Set([...(family[indexInLoop].pids || []), updatedPerson.id]));
    }
  });
  
  family[personIndex] = updatedPerson;
  await writeFamilyData(family);
  res.status(200).json(updatedPerson);
};


export const ensureUserInFamilyTree = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise pour ensure-profile.' });
  }
  
  const authUser = req.user as JwtPayload; 
  const userDetailsFromRequest = req.body as Partial<FamilyPerson>;

  let family = await readFamilyData();
  let personInFamily = family.find(p => p.id === authUser.userId);

  const userAuthDataPath = path.join(usersDirectory, `${authUser.userId}.json`);
  let nameFromAuth = "Utilisateur"; 
  let emailFromAuth = authUser.email;

  if (await fs.pathExists(userAuthDataPath)) {
      try {
        const userAuthData = await fs.readJSON(userAuthDataPath) as User;
        nameFromAuth = `${userAuthData.firstName} ${userAuthData.lastName}`;
        emailFromAuth = userAuthData.email;
      } catch(e) {
          console.error(`Erreur de lecture du fichier utilisateur ${authUser.userId}.json pour ensure:`, e);
      }
  } else {
       console.warn(`Fichier d'authentification ${authUser.userId}.json non trouvé pendant ensure, certaines infos pourraient manquer.`);
  }

  if (!personInFamily) {
    personInFamily = {
      id: authUser.userId,
      name: userDetailsFromRequest.name || nameFromAuth,
      mid: userDetailsFromRequest.mid || null,
      fid: userDetailsFromRequest.fid || null,
      pids: (userDetailsFromRequest.pids || []).filter(pid => pid !== "" && pid !== null),
      gender: userDetailsFromRequest.gender || 'unknown',
      birthYear: userDetailsFromRequest.birthYear, 
      deathYear: userDetailsFromRequest.deathYear,
      img: userDetailsFromRequest.img || '/assets/avatars/default.svg',
      gmail: userDetailsFromRequest.gmail || emailFromAuth, 
      ...userDetailsFromRequest 
    };
    family.push(personInFamily);
    await writeFamilyData(family);
    return res.status(201).json(personInFamily);
  } else {
    // Fusionner avec priorité pour les champs de la requête, puis existants, puis auth (pour nom/email)
    const updatedPersonData: FamilyPerson = { 
        ...personInFamily, 
        ...userDetailsFromRequest, 
        id: personInFamily.id, 
        name: userDetailsFromRequest.name || personInFamily.name || nameFromAuth, 
        gmail: userDetailsFromRequest.gmail || personInFamily.gmail || emailFromAuth,
        birthYear: userDetailsFromRequest.birthYear === null ? undefined : (userDetailsFromRequest.birthYear !== undefined ? userDetailsFromRequest.birthYear : personInFamily.birthYear),
        deathYear: userDetailsFromRequest.deathYear === null ? undefined : (userDetailsFromRequest.deathYear !== undefined ? userDetailsFromRequest.deathYear : personInFamily.deathYear),
        fid: userDetailsFromRequest.fid === "" || userDetailsFromRequest.fid === null ? null : (userDetailsFromRequest.fid !== undefined ? userDetailsFromRequest.fid : personInFamily.fid),
        mid: userDetailsFromRequest.mid === "" || userDetailsFromRequest.mid === null ? null : (userDetailsFromRequest.mid !== undefined ? userDetailsFromRequest.mid : personInFamily.mid),
        pids: Array.isArray(userDetailsFromRequest.pids) 
              ? userDetailsFromRequest.pids.filter(pid=> pid !== "" && pid !== null) 
              : (personInFamily.pids || []),
        gender: userDetailsFromRequest.gender || personInFamily.gender || 'unknown',
        img: userDetailsFromRequest.img || personInFamily.img || '/assets/avatars/default.svg',
    };
    const personIndex = family.findIndex(p => p.id === authUser.userId);
    family[personIndex] = updatedPersonData;
    await writeFamilyData(family);
    return res.status(200).json(updatedPersonData);
  }
};

export const getPersonalFamilyData = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise pour la vue personnelle.' });
  }
  const authUserId = req.user.userId;

  const allData = await readFamilyData();
  const currentUserProfile = allData.find(p => p.id === authUserId);

  if (!currentUserProfile) {
    return res.status(404).json({ message: "Profil utilisateur non trouvé dans les données familiales." });
  }

  const personalScopeIds = new Set<string>();
  personalScopeIds.add(authUserId); // L'utilisateur

  // Ajout des parents
  if (currentUserProfile.fid) personalScopeIds.add(currentUserProfile.fid);
  if (currentUserProfile.mid) personalScopeIds.add(currentUserProfile.mid);

  // Ajout des conjoints
  if (currentUserProfile.pids) {
    currentUserProfile.pids.forEach(pid => {
      if (pid) personalScopeIds.add(pid);
    });
  }

  // Ajout des enfants directs de l'utilisateur
  allData.forEach(person => {
    if (person.id && (person.fid === authUserId || person.mid === authUserId)) {
      personalScopeIds.add(person.id);
    }
  });
  
  const personalData = allData.filter(person => person.id && personalScopeIds.has(person.id));
  
  // S'assurer que les pids, fid, mid de chaque personne dans personalData ne pointent que vers d'autres personnes dans personalData
  // Et que les enfants des autres personnes (non-utilisateur) ne sont pas inclus s'ils ne sont pas déjà dans personalScopeIds
  const finalPersonalData = personalData.map(personInScope => {
    const filteredFid = personInScope.fid && personalScopeIds.has(personInScope.fid) ? personInScope.fid : null;
    const filteredMid = personInScope.mid && personalScopeIds.has(personInScope.mid) ? personInScope.mid : null;
    const filteredPids = (personInScope.pids || []).filter(pid => pid && personalScopeIds.has(pid));
    
    return { 
        ...personInScope, 
        fid: filteredFid,
        mid: filteredMid,
        pids: filteredPids
    };
  });
  
  res.status(200).json(finalPersonalData);
};


export const getCurrentUserFamilyProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise pour obtenir le profil familial.' });
  }
  const userId = req.user.userId; 

  const familyData = await readFamilyData();
  const userProfileInFamily = familyData.find(p => p.id === userId);

  if (userProfileInFamily) {
    res.status(200).json(userProfileInFamily);
  } else {
    res.status(404).json({ message: 'Profil familial de l\'utilisateur non trouvé. Veuillez compléter votre profil ou rafraîchir.' });
  }
};