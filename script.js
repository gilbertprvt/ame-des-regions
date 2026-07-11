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
