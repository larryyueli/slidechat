const CACHE_PREFIX = 'SlideChat-client';
const CACHE_NAME = `${CACHE_PREFIX}-v2`;
const TEMP_CACHE_NAME = 'SlideChat-temp';
const self = this;

const baseURL = '/slidechat';
const cachePattern = /^(?!chrome-extension).*(?:\.css|\.js|\.ico|\.woff2|\.html)$/;
const tempCachePattern = /(?:\/api\/slideImg|\/api\/slideThumbnail)/;

self.addEventListener('install', (e) => {
	console.log('service worker installed');
	self.skipWaiting();
	e.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			cache.addAll([
				`${baseURL}/imgs/logo.png`,
				`${baseURL}/imgs/loading.png`,
				`${baseURL}/imgs/disconnected.png`,
				`${baseURL}/imgs/laser_pointer.png`,
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
	// cache first, need to change cache name to update cache
	let whichCache;
	if (cachePattern.test(e.request.url)) {
		whichCache = CACHE_NAME;
	} else if (tempCachePattern.test(e.request.url)) {
		whichCache = TEMP_CACHE_NAME;
	} else {
		e.respondWith(fetch(e.request));
		return;
	}
	e.respondWith(
		caches.open(whichCache).then((cache) => {
			return cache.match(e.request).then((cachedRes) => {
				if (cachedRes) return cachedRes;
				return fetch(e.request).then((networkRes) => {
					cache.put(e.request, networkRes.clone());
					return networkRes;
				});
			});
		})
	);
});
