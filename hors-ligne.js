/* Bouton « Hors connexion » : enregistre tout le site sur l'appareil pour le consulter sans internet.
   La liste des fichiers est demandée à GitHub à chaque fois : rien à mettre à jour quand le site grandit.
   Mise à jour automatique : à l'ouverture avec internet (au plus toutes les 30 minutes), seuls les fichiers
   nouveaux ou modifiés sont téléchargés, sur les appareils où le site a déjà été enregistré en entier. */
(function () {
  var script = document.currentScript, BASE = new URL('.', script.src), CACHE = 'site-hors-ligne';
  var IDX = new URL('__liste-hors-ligne.json', BASE).href, ATTENTE = 30 * 60 * 1000;
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register(new URL('sw.js', BASE).href).catch(function () {});
  if (!('caches' in window) || !window.fetch || !window.Promise) return;

  var st = document.createElement('style');
  st.textContent =
    '.hl-btn{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9999;display:flex;align-items:center;gap:8px;' +
    'font:600 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;background:rgba(20,32,43,.88);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:11px 16px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)}' +
    '.hl-btn svg{width:18px;height:18px}.hl-btn:focus-visible,.hl-p button:focus-visible{outline:3px solid #FAC775;outline-offset:2px}' +
    '.hl-p{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(66px + env(safe-area-inset-bottom,0px));z-index:9999;width:min(380px,calc(100vw - 28px));' +
    'font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a1a;background:#fff;border-radius:14px;padding:18px;box-shadow:0 10px 30px rgba(0,0,0,.35)}' +
    '.hl-p h2{font-size:18px;margin:0 0 6px}.hl-p p{margin:0 0 10px}.hl-p .hl-s{color:#555;font-size:14px}' +
    '.hl-p .hl-go{font:600 16px system-ui,sans-serif;background:#2C4A7C;color:#fff;border:0;border-radius:10px;padding:12px 16px;cursor:pointer;width:100%}' +
    '.hl-p .hl-go[disabled]{opacity:.6;cursor:default}.hl-p .hl-x{position:absolute;top:8px;right:8px;background:none;border:0;font-size:22px;line-height:1;padding:6px 10px;cursor:pointer;color:#555}' +
    '.hl-bar{height:10px;background:#E0DACE;border-radius:5px;overflow:hidden;margin:10px 0 6px}.hl-bar i{display:block;height:100%;width:0;background:#3B6D11;transition:width .2s}' +
    '.hl-p [hidden],.hl-btn[hidden]{display:none!important}';
  document.head.appendChild(st);

  var ICONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'hl-btn'; btn.setAttribute('aria-expanded', 'false');
  function etiquette(t) { btn.innerHTML = ICONE + t; }
  etiquette('Hors connexion');
  var p = document.createElement('div');
  p.className = 'hl-p'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Consulter sans internet');
  p.innerHTML = '<button class="hl-x" type="button" aria-label="Fermer">×</button><h2>Consulter sans internet</h2>' +
    '<p>Enregistrez tout le site sur cet appareil pour le consulter n’importe où, même sans connexion. À faire de préférence en Wi-Fi. Ensuite, les nouveautés s’ajoutent toutes seules à chaque ouverture avec internet.</p>' +
    '<p class="hl-s" id="hl-etat"></p><div class="hl-bar" hidden><i></i></div><p class="hl-s" id="hl-prog" hidden></p>' +
    '<button class="hl-go" type="button">Tout enregistrer sur cet appareil</button>';
  document.body.appendChild(p); document.body.appendChild(btn);
  var go = p.querySelector('.hl-go'), etat = p.querySelector('#hl-etat'), bar = p.querySelector('.hl-bar'), barI = bar.querySelector('i'), prog = p.querySelector('#hl-prog');
  var enCours = false;
  // Le bouton n'est affiché que tant que le site n'est pas enregistré sur l'appareil (ou pendant une mise à jour).
  // Pour le faire réapparaître : ajouter #hors-connexion à la fin de l'adresse.
  function visibilite() { btn.hidden = !!lire('hl-date') && p.hidden && !enCours; }

  function mo(n) { return (n / 1048576).toLocaleString('fr-FR', {maximumFractionDigits: n < 10485760 ? 1 : 0}) + ' Mo'; }
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function urlDe(chemin) { return new URL(chemin.replace(/%/g, '%25').replace(/#/g, '%23').replace(/\?/g, '%3F'), BASE).href; }
  function dateFr(t) { return new Date(+t).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}); }
  function montrerEtat() {
    var d = lire('hl-date');
    etat.textContent = d ? 'Copie enregistrée sur cet appareil, mise à jour le ' + dateFr(d) + '.' : 'Le site n’est pas encore enregistré en entier sur cet appareil.';
    if (!enCours) go.textContent = d ? 'Vérifier les nouveautés maintenant' : 'Tout enregistrer sur cet appareil';
  }
  btn.addEventListener('click', function () { p.hidden = !p.hidden; btn.setAttribute('aria-expanded', String(!p.hidden)); if (!p.hidden) montrerEtat(); });
  p.querySelector('.hl-x').addEventListener('click', function () { p.hidden = true; btn.setAttribute('aria-expanded', 'false'); visibilite(); if (!btn.hidden) btn.focus(); });

  // Synchronisation : compare la liste GitHub avec ce qui est déjà enregistré, ne télécharge que la différence.
  function synchro(auto, suivi) {
    var owner = location.hostname.split('.')[0], repo = location.pathname.split('/')[1];
    return fetch('https://api.github.com/repos/' + owner + '/' + repo + '/git/trees/HEAD?recursive=1', {cache: 'no-store'})
      .then(function (r) { if (!r.ok) throw new Error('liste'); return r.json(); })
      .then(function (j) {
        var fichiers = j.tree.filter(function (f) { return f.type === 'blob' && !/(^|\/)\./.test(f.path) && !/\.(txt|md)$/i.test(f.path); });
        return caches.open(CACHE).then(function (c) {
          return c.match(IDX).then(function (r) { return r ? r.json() : null; }).catch(function () { return null; }).then(function (idx) {
            var sansIndex = !idx; idx = idx || {racine: null, f: {}};
            if (auto && idx.racine === j.sha) return {ok: 0, ko: 0, octets: 0, total: 0, rien: true};
            var aFaire = [], garde = {};
            return Promise.all(fichiers.map(function (f) {
              garde[f.path] = 1;
              if (idx.f[f.path] === f.sha || sansIndex) {
                return c.match(urlDe(f.path)).then(function (m) { if (m) idx.f[f.path] = f.sha; else aFaire.push(f); });
              }
              aFaire.push(f);
            })).then(function () {
              var anciens = Object.keys(idx.f).filter(function (k) { return !garde[k]; });
              return Promise.all(anciens.map(function (k) { delete idx.f[k]; return c.delete(urlDe(k)); }));
            }).then(function () {
              var total = aFaire.reduce(function (s, f) { return s + (f.size || 0); }, 0);
              if (!aFaire.length) return {ok: 0, ko: 0, octets: 0, total: 0};
              var verif = navigator.storage && navigator.storage.estimate ? navigator.storage.estimate() : Promise.resolve(null);
              if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
              return verif.then(function (e) {
                if (e && e.quota && e.quota - e.usage < total * 1.1) throw new Error('place');
                return telecharger(c, aFaire, total, idx, suivi);
              });
            }).then(function (res) {
              if (!res.ko) idx.racine = j.sha;
              return c.put(IDX, new Response(JSON.stringify(idx), {headers: {'Content-Type': 'application/json'}})).then(function () {
                return fetch(BASE.href, {cache: 'no-cache'}).then(function (r) { if (r.ok) return c.put(BASE.href, r); }).catch(function () {});
              }).then(function () { return res; });
            });
          });
        });
      });
  }
  function telecharger(c, liste, total, idx, suivi) {
    var i = 0, ok = 0, ko = 0, octets = 0, faits = 0;
    function suivant() {
      if (i >= liste.length) return Promise.resolve();
      var f = liste[i++], url = urlDe(f.path);
      return fetch(url, {cache: 'no-cache'}).then(function (r) {
        if (!r.ok) throw 0;
        return c.put(url, r).then(function () { ok++; octets += f.size || 0; idx.f[f.path] = f.sha; });
      }).catch(function () { ko++; }).then(function () {
        faits += f.size || 0;
        if (suivi) suivi(faits, total);
        return suivant();
      });
    }
    var fils = []; for (var k = 0; k < 6; k++) fils.push(suivant());
    return Promise.all(fils).then(function () { return {ok: ok, ko: ko, octets: octets, total: total}; });
  }

  // Bouton : enregistrement complet (première fois) ou vérification des nouveautés
  go.addEventListener('click', function () {
    if (enCours) return;
    if (!navigator.onLine) { etat.textContent = 'Pas de connexion internet pour le moment. Réessayez une fois connecté.'; return; }
    enCours = true; go.disabled = true; go.textContent = 'Préparation…'; prog.hidden = false; prog.textContent = 'Comparaison avec la version en ligne…';
    bar.hidden = false; barI.style.width = '0%';
    synchro(false, function (fait, total) {
      barI.style.width = (total ? fait / total * 100 : 100).toFixed(1) + '%';
      prog.textContent = 'Enregistrement : ' + mo(fait) + ' sur ' + mo(total) + '…'; go.textContent = 'Enregistrement en cours…';
    }).then(function (r) {
      barI.style.width = '100%';
      ecrire('hl-date', String(Date.now())); ecrire('hl-verif', String(Date.now()));
      prog.textContent = !r.ok && !r.ko ? 'Tout est déjà à jour sur cet appareil.'
        : 'Terminé : ' + r.ok + ' fichier' + (r.ok > 1 ? 's' : '') + ' enregistré' + (r.ok > 1 ? 's' : '') + ' (' + mo(r.octets) + ').' + (r.ko ? ' ' + r.ko + ' fichier(s) n’ont pas pu être récupérés : relancez plus tard pour les compléter.' : ' Le site est consultable sans internet.');
    }).catch(function (e) {
      prog.textContent = e.message === 'place' ? 'Pas assez de place libre sur cet appareil pour tout enregistrer.'
        : e.message === 'liste' ? 'GitHub n’a pas répondu. Réessayez dans quelques minutes.' : 'L’enregistrement a été interrompu. Relancez-le : ce qui est déjà fait est gardé.';
    }).then(function () { enCours = false; go.disabled = false; montrerEtat(); visibilite(); });
  });

  // Mise à jour automatique, discrète, à l'ouverture
  function auto() {
    var cx = navigator.connection || {};
    if (!lire('hl-date') || !navigator.onLine || cx.saveData || cx.type === 'cellular') return;
    var der = +lire('hl-verif') || 0;
    if (Date.now() - der < ATTENTE) return;
    ecrire('hl-verif', String(Date.now()));
    enCours = true;
    synchro(true, function () { etiquette('Mise à jour…'); btn.hidden = false; }).then(function (r) {
      if (r.ok) { ecrire('hl-date', String(Date.now())); etiquette('Site à jour'); return new Promise(function (ok) { setTimeout(ok, 4000); }); }
    }).catch(function () {}).then(function () { enCours = false; etiquette('Hors connexion'); visibilite(); });
  }
  if (location.hash === '#hors-connexion') { p.hidden = false; btn.setAttribute('aria-expanded', 'true'); montrerEtat(); }
  visibilite();
  window.addEventListener('hashchange', function () { if (location.hash === '#hors-connexion') { p.hidden = false; montrerEtat(); visibilite(); } });
  if (document.readyState === 'complete') setTimeout(auto, 1500); else window.addEventListener('load', function () { setTimeout(auto, 1500); });
})();
