// server.js — Backend Node.js pour Sôngo sur Render
const express = require('express');
const path = require('path');
const { charger, sauvegarder } = require('./database');
const { nouvellePartie, selectionCoup, jouerCoup } = require('./moteur');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Génère un code de salon à 6 lettres majuscules
function genererCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /api/creer — Crée une nouvelle partie et retourne le code
app.post('/api/creer', (req, res) => {
  let code;
  do { code = genererCode(); } while (charger(code));
  const etat = nouvellePartie();
  sauvegarder(code, etat);
  res.json({ code, ...etat });
});

// GET /api/:code/etat — Récupère l'état courant d'une partie
app.get('/api/:code/etat', (req, res) => {
  const etat = charger(req.params.code.toUpperCase());
  if (!etat) return res.status(404).json({ erreur: 'Partie introuvable. Vérifiez le code.' });
  res.json(etat);
});

// POST /api/:code/initialiser — Remet la partie à zéro
app.post('/api/:code/initialiser', (req, res) => {
  const code = req.params.code.toUpperCase();
  const existante = charger(code);
  if (!existante) return res.status(404).json({ erreur: 'Partie introuvable.' });
  const etat = nouvellePartie();
  sauvegarder(code, etat);
  res.json(etat);
});

// GET /api/:code/selection?case=N — Prévisualise un coup (sans l'appliquer)
app.get('/api/:code/selection', (req, res) => {
  const code = req.params.code.toUpperCase();
  const etat = charger(code);
  if (!etat) return res.status(404).json({ erreur: 'Partie introuvable.' });
  if (etat.findePartie) return res.status(400).json({ erreur: 'Partie terminée.' });

  const caseIndex = parseInt(req.query.case, 10);
  const resultat = selectionCoup(etat, caseIndex);
  if (resultat.erreur) return res.status(400).json(resultat);
  sauvegarder(code, resultat);
  res.json(resultat);
});

// GET /api/:code/jouer?case=N — Joue le coup et retourne le nouvel état
app.get('/api/:code/jouer', (req, res) => {
  const code = req.params.code.toUpperCase();
  const etat = charger(code);
  if (!etat) return res.status(404).json({ erreur: 'Partie introuvable.' });
  if (etat.findePartie) return res.status(400).json({ erreur: 'Partie terminée.' });

  const caseIndex = parseInt(req.query.case, 10);
  const resultat = jouerCoup(etat, caseIndex);
  if (resultat.erreur) return res.status(400).json(resultat);
  sauvegarder(code, resultat);
  res.json(resultat);
});

app.listen(PORT, () => console.log(`Sôngo en ligne sur le port ${PORT}`));
