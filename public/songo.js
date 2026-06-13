// songo.js — Client Sôngo multi-parties (Render)

let codePartie = null;
let plateau = [];
let scores = [0, 0];
let joueurActif = 0;
let findePartie = false;
let matchNul = false;
let caseSelectionnee = null;
let distributionProchaine = [];
let selectionAnimee = null;
let monRole = null;
let enTrainDAnimer = false;
let pollingInterval = null;

// ===================== AUDIO =====================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function jouerSonGraine() {
  try {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(1.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}

// ===================== SALON =====================
function msgSalon(txt, erreur = false) {
  const el = document.getElementById('msg-salon');
  el.textContent = txt;
  el.style.color = erreur ? '#ff9966' : '#88ffcc';
}

async function creerPartie() {
  msgSalon('Création en cours…');
  try {
    const res = await fetch('/api/creer', { method: 'POST' });
    const data = await res.json();
    if (data.erreur) return msgSalon(data.erreur, true);
    codePartie = data.code;
    appliquerEtat(data);
    document.getElementById('code-affiche').textContent = codePartie;
    document.getElementById('bloc-code-partage').style.display = 'flex';
    msgSalon('Partie créée ! Partagez le code à votre adversaire.');
  } catch (e) {
    msgSalon('Erreur réseau.', true);
  }
}

async function rejoindrePartie() {
  const code = document.getElementById('input-code').value.trim().toUpperCase();
  if (code.length < 4) return msgSalon('Entrez un code valide.', true);
  msgSalon('Connexion…');
  try {
    const res = await fetch(`/api/${code}/etat`);
    if (res.status === 404) return msgSalon('Partie introuvable. Vérifiez le code.', true);
    const data = await res.json();
    if (data.erreur) return msgSalon(data.erreur, true);
    codePartie = code;
    appliquerEtat(data);
    document.getElementById('code-affiche').textContent = codePartie;
    document.getElementById('bloc-code-partage').style.display = 'flex';
    msgSalon('Connecté ! Choisissez votre camp.');
  } catch (e) {
    msgSalon('Erreur réseau.', true);
  }
}

function choisirRole(role) {
  monRole = role;
  document.getElementById('ecran-salon').style.display = 'none';
  document.getElementById('badge-code').style.display = 'block';
  document.getElementById('badge-code-val').textContent = codePartie;
  afficher();
  demarrerPolling();
}

// ===================== RÉSEAU =====================
function demarrerPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(verifierMiseAJour, 250);
}

async function verifierMiseAJour() {
  if (findePartie || enTrainDAnimer || !codePartie) return;
  try {
    const res = await fetch(`/api/${codePartie}/etat`);
    const data = await res.json();
    if (data.erreur) return;

    const nouvelleSelection = data.caseSelectionnee ?? null;

    // L'adversaire vient de sélectionner une case → on anime côté spectateur
    if (nouvelleSelection !== null && nouvelleSelection !== selectionAnimee && !enTrainDAnimer) {
      appliquerEtat(data);
      selectionAnimee = nouvelleSelection;
      animerSemaillesPrediction(nouvelleSelection, () => {
        caseSelectionnee = null;
        distributionProchaine = [];
        afficher();
      });
      return;
    }

    // Mise à jour normale (changement de plateau, de tour, etc.)
    if (
      JSON.stringify(plateau) !== JSON.stringify(data.plateau) ||
      joueurActif !== data.joueurActif ||
      caseSelectionnee !== nouvelleSelection ||
      JSON.stringify(distributionProchaine) !== JSON.stringify(data.distribution || [])
    ) {
      appliquerEtat(data);
      afficher();
    }
  } catch (e) {}
}

function appliquerEtat(data) {
  plateau              = data.plateau;
  scores               = data.scores;
  joueurActif          = data.joueurActif;
  findePartie          = data.findePartie;
  matchNul             = data.matchNul || false;
  caseSelectionnee     = data.caseSelectionnee ?? null;
  distributionProchaine = data.distribution || [];
}

// ===================== ANIMATIONS =====================
function obtenirCaseSuivante(pos) {
  if (pos === 0) return 7;
  if (pos === 7) return 8;
  if (pos === 13) return 6;
  if (pos === 6) return 5;
  if (pos >= 1 && pos <= 5) return pos - 1;
  if (pos >= 8 && pos <= 12) return pos + 1;
  return pos;
}

function illuminerCibles(indexDepart, nbGraines) {
  const cibles = [];
  let tmpCase = indexDepart;
  for (let g = 0; g < nbGraines; g++) {
    tmpCase = obtenirCaseSuivante(tmpCase);
    if (tmpCase === indexDepart) tmpCase = obtenirCaseSuivante(tmpCase);
    cibles.push(tmpCase);
  }
  cibles.forEach(c => document.getElementById('case' + c)?.classList.add('cible-lumineuse'));
  return cibles;
}

function animerSemaillesPrediction(indexDepart, onTermine) {
  enTrainDAnimer = true;
  let graines = plateau[indexDepart];
  const cibles = illuminerCibles(indexDepart, graines);

  plateau[indexDepart] = 0;
  afficher();
  jouerSonGraine();

  let caseActuelle = indexDepart;
  const chrono = setInterval(() => {
    if (graines > 0) {
      caseActuelle = obtenirCaseSuivante(caseActuelle);
      if (caseActuelle === indexDepart) caseActuelle = obtenirCaseSuivante(caseActuelle);
      plateau[caseActuelle]++;
      graines--;
      afficher();
      jouerSonGraine();
    } else {
      clearInterval(chrono);
      cibles.forEach(c => document.getElementById('case' + c)?.classList.remove('cible-lumineuse'));
      enTrainDAnimer = false;
      if (typeof onTermine === 'function') onTermine();
    }
  }, 1000);
}

// ===================== JEUX =====================
async function jouer(caseIndex) {
  initAudio();
  if (enTrainDAnimer || findePartie || joueurActif !== monRole || !codePartie) return;

  const debut = monRole === 0 ? 0 : 7;
  const fin   = monRole === 0 ? 7 : 14;
  if (caseIndex < debut || caseIndex >= fin || plateau[caseIndex] <= 0) return;

  enTrainDAnimer = true;
  caseSelectionnee = caseIndex;
  afficher();

  try {
    // 1. Signaler la sélection au serveur (pour que l'adversaire voie l'animation)
    const resSel = await fetch(`/api/${codePartie}/selection?case=${caseIndex}`);
    const dataSel = await resSel.json();
    if (dataSel.erreur) {
      alert(dataSel.erreur);
      enTrainDAnimer = false;
      caseSelectionnee = null;
      afficher();
      return;
    }
    appliquerEtat(dataSel);
    selectionAnimee = caseIndex;
    afficher();

    // 2. Animer localement la prédiction
    animerSemaillesPrediction(caseIndex, async () => {
      // 3. Jouer le coup réel
      try {
        const resJeu = await fetch(`/api/${codePartie}/jouer?case=${caseIndex}`);
        const dataJeu = await resJeu.json();
        if (dataJeu.erreur) {
          alert(dataJeu.erreur);
        } else {
          appliquerEtat(dataJeu);
        }
        selectionAnimee = null;
        afficher();
      } catch (e) {
        console.error(e);
      }
    });
  } catch (e) {
    console.error(e);
    enTrainDAnimer = false;
  }
}

async function réinitialiserPartie() {
  if (enTrainDAnimer || !codePartie) return;
  const res = await fetch(`/api/${codePartie}/initialiser`, { method: 'POST' });
  const data = await res.json();
  if (!data.erreur) { appliquerEtat(data); afficher(); }
}

// ===================== AFFICHAGE =====================
function afficher() {
  for (let i = 0; i < 14; i++) {
    const el = document.getElementById('case' + i);
    if (!el) continue;
    el.innerHTML = '';
    el.classList.remove('clickable', 'case-selectionnee', 'distribution');

    const nbGraines = plateau[i] || 0;
    for (let g = 0; g < nbGraines; g++) {
      const pion = document.createElement('div');
      pion.className = 'pion';
      el.appendChild(pion);
    }

    if (caseSelectionnee === i) el.classList.add('case-selectionnee');
    if (distributionProchaine[i] > 0) el.classList.add('distribution');

    if (!findePartie && joueurActif === monRole && !enTrainDAnimer) {
      const debut = monRole === 0 ? 0 : 7;
      const fin   = monRole === 0 ? 7 : 14;
      if (i >= debut && i < fin && plateau[i] > 0) el.classList.add('clickable');
    }
  }

  // Message central
  if (findePartie) {
    if (matchNul || scores[0] === scores[1]) {
      document.getElementById('message').textContent = 'Match nul, aucun gagnant !';
    } else {
      const gagnant = scores[0] > scores[1] ? 'Sud' : 'Nord';
      document.getElementById('message').textContent = `Joueur ${gagnant} remporte la partie !`;
    }
  } else {
    const textTour = joueurActif === monRole ? 'À vous de jouer !' : "Attente de l'adversaire…";
    document.getElementById('message').textContent = `Tour : ${joueurActif === 0 ? 'Sud' : 'Nord'} (${textTour})`;
  }

  document.getElementById('score0').textContent = scores[0];
  document.getElementById('score1').textContent = scores[1];

  let restantSUD = 0, restantNORD = 0;
  for (let i = 0; i < 7;  i++) restantSUD  += plateau[i] || 0;
  for (let i = 7; i < 14; i++) restantNORD += plateau[i] || 0;
  document.getElementById('restantSUD').textContent  = restantSUD;
  document.getElementById('restantNORD').textContent = restantNORD;
}
