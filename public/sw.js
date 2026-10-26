/* 每日 Dash Service Worker
   壳缓存：HTML/CSS/JS 离线可用；
   数据策略：网络优先 + 缓存兜底（断网/接口失败时展示上一次成功的数据）。 */
const CACHE = "dailydash-v3";
const SHELL = [
  "./", "./index.html", "./style.css", "./app.js?v=3",
  "./manifest.json", "./icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // API 请求：网络优先，失败回退缓存（断网也能看昨天的新闻/热榜/天气）
  if (url.host.includes("tcloudbase.com") && url.pathname.startsWith("/v2/") ||
      url.host.includes("open-meteo") || url.host.includes("hitokoto")) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then((m) => m || Response.error()))
    );
    return;
  }
  // 壳资源：缓存优先（更新由 activate 时的版本切换处理）
  if (e.request.method === "GET") {
    e.respondWith(
      caches.match(e.request).then((m) => m || fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      }))
    );
  }
});
