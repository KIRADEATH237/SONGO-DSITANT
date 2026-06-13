// database.js — Gestion SQLite des parties
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'parties.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS parties (
    code TEXT PRIMARY KEY,
    etat TEXT NOT NULL,
    cree_le INTEGER NOT NULL,
    mis_a_jour INTEGER NOT NULL
  )
`);

// Nettoyage automatique des parties vieilles de plus de 24h
setInterval(() => {
  const limite = Date.now() - 24 * 60 * 60 * 1000;
  db.prepare('DELETE FROM parties WHERE mis_a_jour < ?').run(limite);
}, 60 * 60 * 1000);

function charger(code) {
  const row = db.prepare('SELECT etat FROM parties WHERE code = ?').get(code);
  if (!row) return null;
  return JSON.parse(row.etat);
}

function sauvegarder(code, etat) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO parties (code, etat, cree_le, mis_a_jour)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET etat = excluded.etat, mis_a_jour = excluded.mis_a_jour
  `).run(code, JSON.stringify(etat), now, now);
}

function supprimer(code) {
  db.prepare('DELETE FROM parties WHERE code = ?').run(code);
}

module.exports = { charger, sauvegarder, supprimer };
