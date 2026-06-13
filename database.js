const parties = new Map();

setInterval(() => {
  const limite = Date.now() - 24 * 60 * 60 * 1000;
  for (const [code, entry] of parties.entries()) {
    if (entry.ts < limite) parties.delete(code);
  }
}, 60 * 60 * 1000);

function charger(code) {
  const entry = parties.get(code);
  return entry ? entry.etat : null;
}

function sauvegarder(code, etat) {
  parties.set(code, { etat, ts: Date.now() });
}

function supprimer(code) {
  parties.delete(code);
}

module.exports = { charger, sauvegarder, supprimer };