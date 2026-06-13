// moteur.js — Toutes les règles du Sôngo (traduit depuis action.php)

function obtenirCaseSuivante(pos) {
  if (pos === 0) return 7;
  if (pos === 7) return 8;
  if (pos === 13) return 6;
  if (pos === 6) return 5;
  if (pos >= 1 && pos <= 5) return pos - 1;
  if (pos >= 8 && pos <= 12) return pos + 1;
  return pos;
}

function grainesVersAdversaire(plateau, caseIndex, joueurActif) {
  let graines = plateau[caseIndex];
  let pos = caseIndex;
  let compteur = 0;
  while (graines > 0) {
    pos = obtenirCaseSuivante(pos);
    if (pos === caseIndex) pos = obtenirCaseSuivante(pos);
    const dansAdverse = joueurActif === 0 ? pos >= 7 : pos < 7;
    if (dansAdverse) compteur++;
    graines--;
  }
  return compteur;
}

function solidarite(plateau, joueurActif) {
  const debutAdverse = joueurActif === 0 ? 7 : 0;
  const finAdverse   = joueurActif === 0 ? 14 : 7;
  let vide = true;
  for (let i = debutAdverse; i < finAdverse; i++) {
    if (plateau[i] > 0) { vide = false; break; }
  }
  if (!vide) return null;

  const debutPropre = joueurActif === 0 ? 0 : 7;
  const finPropre   = joueurActif === 0 ? 7 : 14;
  let caseMax = -1, maxGraines = 0;

  for (let i = debutPropre; i < finPropre; i++) {
    if (plateau[i] === 0) continue;
    const g = grainesVersAdversaire(plateau, i, joueurActif);
    if (g >= 7) return i;
    if (g > maxGraines) { maxGraines = g; caseMax = i; }
  }
  return caseMax;
}

function calculerDistribution(plateau, caseIndex) {
  const distribution = new Array(14).fill(0);
  let graines = plateau[caseIndex];
  let pos = caseIndex;
  while (graines > 0) {
    pos = obtenirCaseSuivante(pos);
    if (pos === caseIndex) pos = obtenirCaseSuivante(pos);
    distribution[pos]++;
    graines--;
  }
  return distribution;
}

function nouvellePartie() {
  return {
    plateau: new Array(14).fill(5),
    scores: [0, 0],
    joueurActif: 0,
    findePartie: false,
    matchNul: false,
    caseSelectionnee: null,
    distribution: new Array(14).fill(0)
  };
}

function selectionCoup(etat, caseIndex) {
  const { plateau, joueurActif } = etat;
  const debut = joueurActif === 0 ? 0 : 7;
  const fin   = joueurActif === 0 ? 7 : 14;

  if (caseIndex < debut || caseIndex >= fin || plateau[caseIndex] === 0) {
    return { erreur: 'Coup invalide !' };
  }
  const nouvelEtat = { ...etat, plateau: [...plateau] };
  nouvelEtat.caseSelectionnee = caseIndex;
  nouvelEtat.distribution = calculerDistribution(plateau, caseIndex);
  return nouvelEtat;
}

function jouerCoup(etat, caseIndex) {
  let plateau       = [...etat.plateau];
  let scores        = [...etat.scores];
  let joueurActif   = etat.joueurActif;
  let findePartie   = etat.findePartie;
  let matchNul      = false;

  const debut = joueurActif === 0 ? 0 : 7;
  const fin   = joueurActif === 0 ? 7 : 14;
  const case7 = joueurActif === 0 ? 6 : 7;

  if (caseIndex < debut || caseIndex >= fin || plateau[caseIndex] === 0) {
    return { erreur: 'Coup invalide !' };
  }

  const caseForcee = solidarite(plateau, joueurActif);

  if (caseForcee === -1) {
    findePartie = true;
    for (let i = 0; i < 7; i++)  scores[0] += plateau[i];
    for (let i = 7; i < 14; i++) scores[1] += plateau[i];
    plateau = new Array(14).fill(0);
  } else if (caseForcee !== null && caseIndex !== caseForcee) {
    return { erreur: `Solidarité ! Vous devez jouer la case ${caseForcee}` };
  } else {
    // Interdit 1 — case limite
    if (caseIndex === case7) {
      const g = grainesVersAdversaire(plateau, caseIndex, joueurActif);
      if ((g === 1 || g === 2) && caseForcee === null) {
        return { erreur: `Interdit ! Cette case enverrait ${g} graine(s) chez l'adversaire.` };
      }
    }

    // Simulation pour la règle "ne pas affamer"
    const plateauTest = [...plateau];
    let grainesTest = plateauTest[caseIndex];
    let posTest = caseIndex;
    plateauTest[caseIndex] = 0;
    while (grainesTest > 0) {
      posTest = obtenirCaseSuivante(posTest);
      if (posTest === caseIndex) posTest = obtenirCaseSuivante(posTest);
      plateauTest[posTest]++;
      grainesTest--;
    }
    const debutAdverse = joueurActif === 0 ? 7 : 0;
    const finAdverse   = joueurActif === 0 ? 14 : 7;
    let campVide = true;
    for (let i = debutAdverse; i < finAdverse; i++) {
      if (plateauTest[i] > 0) { campVide = false; break; }
    }

    // Semis réel
    let graines = plateau[caseIndex];
    plateau[caseIndex] = 0;
    let pos = caseIndex;
    const tourComplet = graines > 13;
    let aTourneUnefois = false;

    while (graines > 0) {
      pos = obtenirCaseSuivante(pos);
      if (pos === caseIndex) { aTourneUnefois = true; pos = obtenirCaseSuivante(pos); }
      if (tourComplet && aTourneUnefois) {
        if (pos < debutAdverse || pos >= finAdverse) pos = debutAdverse;
      }
      plateau[pos]++;
      graines--;
    }

    // Captures
    if (!campVide) {
      const case1Adverse = joueurActif === 0 ? 7 : 0;
      if (pos >= debutAdverse && pos < finAdverse && pos !== case1Adverse) {
        while (pos >= debutAdverse && pos < finAdverse && plateau[pos] >= 2 && plateau[pos] <= 4) {
          if (pos === case1Adverse) { scores[joueurActif] += plateau[pos]; plateau[pos] = 0; break; }
          scores[joueurActif] += plateau[pos];
          plateau[pos] = 0;
          if (pos === 7) pos = 8;
          else if (pos >= 8 && pos <= 13) pos--;
          else if (pos === 0) break;
          else if (pos >= 1 && pos <= 6) pos++;
        }
      }
    }

    // Fin de partie
    if (scores[0] >= 40 || scores[1] >= 40) {
      findePartie = true;
      matchNul = false;
    } else {
      const grainesTotales = plateau.reduce((a, b) => a + b, 0);
      if (grainesTotales < 10 && scores[0] < 40 && scores[1] < 40) {
        findePartie = true;
        matchNul = true;
      } else if (grainesTotales < 10) {
        for (let i = 0; i < 7; i++)  scores[0] += plateau[i];
        for (let i = 7; i < 14; i++) scores[1] += plateau[i];
        plateau = new Array(14).fill(0);
        findePartie = true;
        matchNul = false;
      } else {
        joueurActif = joueurActif === 0 ? 1 : 0;
        matchNul = false;
      }
    }
  }

  return {
    plateau,
    scores,
    joueurActif,
    findePartie,
    matchNul,
    caseSelectionnee: null,
    distribution: new Array(14).fill(0)
  };
}

module.exports = { nouvellePartie, selectionCoup, jouerCoup, calculerDistribution };
