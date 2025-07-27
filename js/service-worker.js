const CACHE_NAME = 'covel-pwa-v1';
const ASSETS = [
  '/',
  'index.html',
  'tracker.html',
  'add.html',
  'profile.html',
  'calendar.html',
  'social.html',
  'work.html',
  'css/style.css',
  'css/tracker.css',
  'css/add.css',
  'css/profile.css',
  'images/covel_logo.png',
  'images/Aaron.png',
  'images/lena.png',
  'images/natekainnn.png',
  'js/tracker.js',
  'js/add.js',
  'js/profile.js',
  'js/calendar.js',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
}); 