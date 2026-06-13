# Sôngo — Déploiement sur Render

## Structure
```
songo-render/
├── server.js       ← Backend Express (routes API)
├── moteur.js       ← Règles du jeu (traduction de action.php)
├── database.js     ← Persistance SQLite
├── package.json
├── .gitignore
└── public/
    ├── index.html  ← Écran de salon + plateau
    ├── songo.js    ← Logique client
    └── songo.css   ← Styles
```

## Déploiement sur Render (Web Service)

1. Poussez ce dossier sur un repo GitHub (public ou privé)
2. Sur render.com → "New +" → "Web Service"
3. Connectez votre repo GitHub
4. Paramètres :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Environment** : Node
5. Cliquez "Deploy"

> ⚠️ Sur le plan gratuit Render, le service s'endort après 15 min d'inactivité.
> Les parties survivent aux redémarrages grâce à SQLite (fichier `parties.db`).
> Utilisez un **Persistent Disk** Render si vous voulez vraiment persister entre redéploiements.

## Comment jouer

1. Le joueur 1 ouvre le site → "Créer une partie" → note le **code à 6 lettres**
2. Il choisit son camp (Sud ou Nord)
3. Le joueur 2 ouvre le même site → colle le code → "Rejoindre" → choisit l'autre camp
4. La partie commence !

## Règles du Sôngo respectées
- Tour horaire (sens du parcours fidèle à l'original)
- Règle de solidarité
- Interdit de la case limite
- Interdit d'affamer l'adversaire
- Captures (cases à 2, 3 ou 4 graines)
- Victoire à 40 graines capturées
- Match nul si < 10 graines restantes et personne à 40
