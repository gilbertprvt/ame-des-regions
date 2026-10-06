/* =========================================
   L'ÂME DES RÉGIONS — script.js
   Comportements interactifs communs
   ========================================= */

/* ----- Pilules thématiques ----- */
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', function () {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
  });
});

/* ----- Onglets fiche région ----- */
document.querySelectorAll('.fiche-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.fiche-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    // TODO : afficher/masquer les blocs de contenu correspondants
  });
});

/* ----- Menu mobile (burger) ----- */
const toggle = document.querySelector('.nav-toggle');
const nav    = document.querySelector('.main-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  });
}

document.addEventListener('DOMContentLoaded', function(){
  // crée la fenêtre automatiquement
if (!document.querySelector('.info')) return;

  var popup = document.createElement('div');
  popup.className = 'popup';
  popup.setAttribute('role', 'dialog');
  popup.innerHTML = '<div class="popup-titre"></div><div class="popup-texte"></div>'
                  + '<button type="button" class="popup-fermer">Fermer</button>';
  document.body.appendChild(popup);

  var titre = popup.querySelector('.popup-titre');
  var texte = popup.querySelector('.popup-texte');

  function ouvrir(bouton){
    titre.textContent = bouton.dataset.titre || '';
    texte.textContent = bouton.dataset.texte || '';
    popup.classList.add('visible');
    var r = bouton.getBoundingClientRect();
    var maxGauche = window.scrollX + document.documentElement.clientWidth - popup.offsetWidth - 10;
    popup.style.left = Math.max(10, Math.min(r.left + window.scrollX, maxGauche)) + 'px';
    popup.style.top  = (r.bottom + window.scrollY + 6) + 'px';
  }
  function fermer(){ popup.classList.remove('visible'); }

  document.querySelectorAll('.info').forEach(function(b){
    b.addEventListener('click', function(e){ e.stopPropagation(); ouvrir(b); });
  });
  popup.querySelector('.popup-fermer').addEventListener('click', fermer);
  popup.addEventListener('click', function(e){ e.stopPropagation(); });
  document.addEventListener('click', fermer);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') fermer(); });
});

