// TeamHub 앱 설치용 서비스 워커
// - 화면 파일(같은 주소의 html·아이콘)만 다룸. 팀 데이터(Apps Script)·외부 CDN 요청은 건드리지 않음
// - 항상 인터넷에서 먼저 받고(최신 화면), 인터넷이 끊겼을 때만 마지막으로 받은 화면을 보여 줌
const CACHE = 'teamhub-shell-v1';
const SHELL = ['./Index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 데이터·CDN은 브라우저가 그대로 처리
  if (!/(\.html|\.png|\.svg|\.webmanifest|\/)$/i.test(url.pathname)) return; // 화면 파일만 (목 서버의 /api 등 제외)
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./Index.html')))
  );
});
