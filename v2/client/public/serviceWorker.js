const CACHE_PREFIX = 'slidechat-client';
const CACHE_NAME = `${CACHE_PREFIX}-v2`;
const self = this;

const baseURL = '/slidechat';
const cachePattern = /^(?!chrome-extension).*(?:\.css|\.js|\.ico|\.woff2|\.html)$/;

self.addEventListener('install', (e) => {
	console.log('service worker installed');
	self.skipWaiting();
	e.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			cache.addAll([
				`${baseURL}/imgs/logo.png`,
				`${baseURL}/imgs/loading.png`,
				`${baseURL}/imgs/disconnected.png`,
			]);
		})
	);
});

self.addEventListener('activate', (e) => {
	console.log('service worker activated');
	e.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME && cacheName.includes(CACHE_PREFIX)) {
						console.log(`service worker removing old cache: ${cacheName}`);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

self.addEventListener('fetch', (e) => {
	// console.log(`service worker fetch: ${e.request.url}`);
	// cache first, need to change cache name to update cache
	e.respondWith(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.match(e.request).then((cachedRes) => {
				if (cachedRes) return cachedRes;
				if (cachePattern.test(e.request.url)) {
					return fetch(e.request).then((networkRes) => {
						cache.put(e.request, networkRes.clone());
						return networkRes;
					});
				} else {
					return fetch(e.request);
				}
			});
		})
	);
});
