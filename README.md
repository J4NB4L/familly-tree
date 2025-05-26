# 👨‍👩‍👧‍👦 Family Tree Frontend

Frontend de l'application **Family Tree**, construite avec **Vite**, **TypeScript** et plusieurs bibliothèques de visualisation pour afficher et gérer un arbre généalogique interactif.

---

## ✨ Fonctionnalités

- 🔐 **Authentification utilisateur** : Inscription et connexion sécurisées.
- 👤 **Gestion du profil** : Mise à jour des données personnelles, gestion des relations familiales (parents, conjoints, enfants).
- 🌳 **Vue Arbre Généalogique** : Visualisation interactive avec [`@balkangraph/familytree.js`](https://balkangraph.com/FamilyTreeJS/).
- 🧩 **Vue Graphe Relationnel** : Visualisation des relations avec [`cytoscape.js`](https://js.cytoscape.org/).
- 🧠 **Algorithmes de Graphe** :
  - Plus court chemin : Dijkstra, Bellman-Ford.
  - Arbre couvrant minimal : Prim, Kruskal.
- 👪 **Portée des Données** : Vue complète ou famille proche.
- 📱 **Responsive Design** : Adaptation de base aux différentes tailles d’écran.
- ⚡ **UI Dynamique** : Mise à jour automatique des zones en fonction des actions et algorithmes.

---

## 🛠️ Stack Technique

- **Framework / Build Tool** : [Vite](https://vitejs.dev/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Styles** : CSS avec layout modernes
- **Client HTTP** : [Axios](https://axios-http.com/)
- **Arbre Généalogique** : [`@balkangraph/familytree.js`](https://balkangraph.com/FamilyTreeJS/)
- **Graphe Relationnel** : [Cytoscape.js](https://js.cytoscape.org/)
- **Routing SPA** : Router personnalisé (fichier `router.js`)

---

## ✅ Prérequis

- [Node.js](https://nodejs.org/) (v18.x ou plus)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), ou [pnpm](https://pnpm.io/)

---

## 🚀 Mise en route

1. **Cloner le dépôt** :
   ```bash
   git clone <repository-url>
   cd <repository-url>/frontend
````

2. **Installer les dépendances** :

   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configurer les variables d’environnement** :
   Créer un fichier `.env` à la racine du dossier `frontend` :

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Démarrer le backend** :
   Le frontend dépend d’une API backend. Suivre les instructions dans le `README` du backend pour l’exécuter.

---

## 🧪 Lancer le projet

```bash
npm run dev
```

Cela lance le serveur de développement sur `http://localhost:5173` (ou un autre port si 5173 est pris).

---

## 📜 Scripts disponibles

| Script            | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Démarre le serveur de développement Vite      |
| `npm run build`   | Compile TypeScript et génère le build de prod |
| `npm run preview` | Sert le build de production localement        |

---

## 📁 Structure du projet (simplifiée)

```
frontend/
├── public/              # Fichiers statiques (ex : dummydata.json)
├── src/
│   ├── assets/          # Images (avatars, etc.)
│   ├── components/      # Composants réutilisables (navbar, profil, etc.)
│   ├── css/             # Fichiers CSS
│   ├── js/
│   │   ├── algorithms/  # Algorithmes (Dijkstra, Prim, etc.)
│   │   ├── family-tree/ # Logique des vues arbre et graphe
│   │   └── utils/       # Fonctions utilitaires
│   ├── services/        # Appels API, auth, état UI
│   ├── main.ts          # Point d’entrée principal
│   └── router.js        # Router SPA
├── .env                 # Variables d’environnement (VITE_API_URL)
├── index.html           # Fichier HTML principal
├── package.json
├── tsconfig.json
└── vite.config.ts       # Configuration Vite
```

---

## ⚠️ Remarques importantes

* 🧩 **Dépendance Backend** : L’API backend doit être disponible à l’adresse définie dans `VITE_API_URL`.
* 📊 **Visualisation des Données** : Les performances peuvent diminuer avec des arbres très volumineux.
* 🧱 **Gestion d’erreurs** : Le traitement des erreurs est basique pour le moment, améliorable pour la production.

---
