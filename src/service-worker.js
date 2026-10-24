/// <reference lib="webworker" />

const offlineCacheName = 'offline-fallback-v1';

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(offlineCacheName)
			.then((cache) => cache.add('/offline.html'))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (request.mode !== 'navigate' || url.pathname.startsWith('/api/')) {
		return;
	}

	event.respondWith(
		fetch(request).catch(async (error) => {
			const fallback = await caches.match('/offline.html');

			if (fallback) {
				return fallback;
			}

			throw error;
		})
	);
});
