// Consultation hors connexion du site.
// Les pages sont d'abord demandées à internet (pour avoir la dernière version), sinon on prend la copie gardée.
// Les images et les sons sont pris dans la copie gardée s'ils y sont, sinon sur internet.
const CACHE = 'site-hors-ligne';
const MEDIA = /\.(webp|jpe?g|png|gif|svg|ico|mp3|m4a|ogg|wav|mp4|webm|woff2?|ttf|otf)$/i;
const SCOPE = new URL(self.registration.scope);

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.add(new Request(SCOPE.href, {cache: 'reload'}))).catch(() => {}));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) {
    // polices Google et bibliothèques (cartes) : copie gardée, rafraîchie en arrière-plan
    if (/(^|\.)fonts\.(googleapis|gstatic)\.com$|(^|\.)unpkg\.com$/.test(u.hostname)) e.respondWith(gardeEtRafraichit(r));
    return;
  }
  if (!u.pathname.startsWith(SCOPE.pathname)) return;
  if (r.headers.has('range')) { e.respondWith(morceau(r)); return; }
  e.respondWith(MEDIA.test(u.pathname) ? copieDabord(r) : internetDabord(r));
});

async function chercher(c, url) {
  const u = new URL(url); u.hash = ''; u.search = '';
  let m = await c.match(u.href);
  if (!m && u.pathname.endsWith('/')) m = await c.match(u.href + 'index.html');
  if (!m && u.pathname.endsWith('/index.html')) m = await c.match(u.href.replace(/index\.html$/, ''));
  return m;
}
async function copieDabord(r) {
  const c = await caches.open(CACHE);
  const m = await chercher(c, r.url);
  if (m) return m;
  try { const n = await fetch(r); if (n.ok) c.put(r.url.split('#')[0].split('?')[0], n.clone()); return n; }
  catch (e) { return new Response('', {status: 504}); }
}
async function internetDabord(r) {
  const c = await caches.open(CACHE);
  try { const n = await fetch(r); if (n.ok) c.put(r.url.split('#')[0].split('?')[0], n.clone()); return n; }
  catch (e) {
    const m = await chercher(c, r.url);
    if (m) return m;
    if (r.mode === 'navigate') return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<body style="font:18px/1.5 system-ui,sans-serif;padding:24px;max-width:36em;margin:auto"><h1>Page non disponible hors connexion</h1>' +
      '<p>Cette page n’a pas encore été enregistrée sur cet appareil. Reconnectez-vous à internet, puis utilisez le bouton « Hors connexion » de la page d’accueil pour tout enregistrer.</p>' +
      '<p><a href="' + SCOPE.href + '">Revenir à l’accueil</a></p></body>',
      {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8'}});
    return new Response('', {status: 504});
  }
}
async function gardeEtRafraichit(r) {
  const c = await caches.open(CACHE);
  const m = await c.match(r);
  const n = fetch(r).then(x => { if (x.ok || x.type === 'opaque') c.put(r, x.clone()); return x; }).catch(() => m);
  return m || n;
}
// Les sons (mp3) sont lus par petits morceaux : on découpe la copie gardée.
async function morceau(r) {
  const c = await caches.open(CACHE);
  const m = await chercher(c, r.url);
  if (!m) { try { return await fetch(r); } catch (e) { return new Response('', {status: 504}); } }
  const b = await m.blob();
  const x = /bytes=(\d*)-(\d*)/.exec(r.headers.get('range') || '') || [];
  let debut = x[1] ? +x[1] : 0, fin = x[2] ? +x[2] : b.size - 1;
  if (!x[1] && x[2]) { debut = Math.max(0, b.size - +x[2]); fin = b.size - 1; }
  fin = Math.min(fin, b.size - 1);
  return new Response(b.slice(debut, fin + 1), {status: 206, headers: {
    'Content-Type': m.headers.get('Content-Type') || 'application/octet-stream',
    'Content-Range': `bytes ${debut}-${fin}/${b.size}`, 'Content-Length': String(fin - debut + 1), 'Accept-Ranges': 'bytes'}});
}
