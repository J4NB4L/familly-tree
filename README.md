# Application d'Arbre Généalogique (Full Stack)

## Contexte du Projet

Ce projet vise à développer une application web complète pour la gestion et la visualisation d'arbres généalogiques. L'objectif est de permettre aux utilisateurs de créer leur profil, de définir leurs relations familiales (parents, conjoints, enfants) et de naviguer au sein de leur généalogie de manière intuitive.

L'application se compose de deux parties distinctes :

1.  **Un frontend interactif** : Permettant aux utilisateurs de s'inscrire, se connecter, gérer leur profil, visualiser l'arbre sous forme hiérarchique et sous forme de graphe relationnel. Il intègre également des outils d'analyse basés sur des algorithmes de graphes (plus courts chemins, arbres couvrants minimaux).
2.  **Un backend robuste** : Servant d'API pour gérer l'authentification des utilisateurs, la persistance des données familiales (stockées en JSON), et la logique métier associée.

## Structure du Projet : Développement en Branches

Ce projet est organisé de manière à ce que le code source du frontend et du backend résident sur des branches Git distinctes au sein de ce dépôt :

*   **Branche `frontend`** : Contient tout le code côté client (interface utilisateur). Il s'agit d'une application Vite + TypeScript.
*   **Branche `backend`** : Contient tout le code côté serveur (API). Il s'agit d'une API Node.js + Express + TypeScript.

Pour travailler sur une partie spécifique de l'application (frontend ou backend), vous devez vous assurer d'avoir cloné le dépôt et d'être positionné sur la branche correspondante (`git checkout frontend` ou `git checkout backend`). Les instructions ci-dessous supposent que vous êtes sur la branche appropriée pour la section concernée.

## Prérequis Généraux

Avant de commencer, assurez-vous d'avoir installé les éléments suivants :

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/) (version 18.x ou ultérieure recommandée)
*   [npm](https://www.npmjs.com/) (généralement fourni avec Node.js), ou [yarn](https://yarnpkg.com/), ou [pnpm](https://pnpm.io/)

---

## 🚀 Lancement du Frontend

**(Assurez-vous d'être sur la branche `frontend` pour ces étapes)**

L'application frontend affiche l'arbre généalogique, le graphe des relations, les profils utilisateurs et gère toutes les interactions avec l'utilisateur.

1.  **Accédez au répertoire du projet (racine de la branche `frontend`) :**
    Après avoir basculé sur la branche `frontend`, les fichiers du projet frontend sont à la racine de votre copie de travail.

2.  **Installez les dépendances :**
    ```bash
    npm install
    # ou
    # yarn install
    # ou
    # pnpm install
    ```

3.  **Configurez les variables d'environnement :**
    Créez un fichier `.env` à la racine du projet frontend avec le contenu suivant :
    ```
    VITE_API_URL=http://localhost:5000/api
    ```
    Assurez-vous que `VITE_API_URL` pointe vers votre API backend en cours d'exécution. La valeur par défaut est `http://localhost:5000/api` si le backend est lancé sur le port 5000.

4.  **Lancez le serveur de développement :**
    ```bash
    npm run dev
    ```
    Le frontend sera typiquement accessible à l'adresse `http://localhost:5173`.

**Pour des informations plus détaillées sur le frontend, veuillez consulter le fichier `README.md` spécifique présent au sein de la branche `frontend`.**

---

## ⚙️ Lancement du Backend

**(Assurez-vous d'être sur la branche `backend` pour ces étapes)**

L'API backend gère le stockage des données, l'authentification et sert les données au frontend.

1.  **Accédez au répertoire du projet (racine de la branche `backend`) :**
    Après avoir basculé sur la branche `backend`, les fichiers du projet backend sont à la racine de votre copie de travail.

2.  **Installez les dépendances :**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Configurez les variables d'environnement :**
    Créez un fichier `.env` à la racine du projet backend avec le contenu suivant :
    ```
    PORT=5000
    JWT_SECRET=votresecretjwtfortetuniqueici
    FRONTEND_URL=http://localhost:5173
    ```
    *   `PORT` : Le port sur lequel le serveur backend sera lancé.
    *   `JWT_SECRET` : Une chaîne de caractères aléatoire et forte pour signer les JWTs. **Changez cette valeur pour un environnement de production.**
    *   `FRONTEND_URL` : L'URL de votre application frontend en cours d'exécution (pour la configuration CORS).

4.  **Lancez le serveur de développement :**
    ```bash
    npm run dev
    ```
    L'API backend sera typiquement accessible à l'adresse `http://localhost:5000`.

**Pour des informations plus détaillées sur le backend, veuillez consulter le fichier `README.md` spécifique présent au sein de la branche `backend`.**

---

## Notes Importantes

*   **Fonctionnement simultané** : Pour que l'application fonctionne correctement, **les serveurs frontend et backend doivent être lancés simultanément** (chacun depuis sa propre branche et son propre terminal).
*   **Communication API** : Le frontend communique avec le backend via des requêtes HTTP vers les points d'API définis dans le backend.
*   **Stockage des données (Backend)** : Le backend utilise des fichiers JSON locaux pour la persistance des données. Assurez-vous que le répertoire `data` (et ses sous-répertoires `users`, `uploads`) peut être créé ou existe dans la structure du projet backend.