// =========================================================================
// FIREBASE BACKGROUND ENGINE & PREMIUM SERVICE WORKER
// =========================================================================

// 1. Import Firebase Scripts (Must match frontend version 10.12.0)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDFHfVutxbFR7kJoni9m4A-_t--mdXY3L8",
    authDomain: "testportal-9562c.firebaseapp.com",
    projectId: "testportal-9562c",
    storageBucket: "testportal-9562c.firebasestorage.app",
    messagingSenderId: "737523775575",
    appId: "1:737523775575:web:26db3649ede4845e688b12"
});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[Firebase SW] Background notification received: ', payload);
    
    const notificationTitle = payload.notification.title || 'APJAKJB Portal Update';
    // 🚀 PREMIUM FIX: Actionable Push Notifications
    const notificationOptions = {
        body: payload.notification.body,
        icon: './icon-192x192.png',
        badge: './icon-512x512.png', // Higher resolution badge
        image: payload.data?.imageUrl || '', // Support for Big Banner Images in Notification
        data: { url: payload.data?.url || './' },
        actions: [
            { action: 'start_test', title: '🚀 Attempt Now' },
            { action: 'view_dashboard', title: '📊 Open Dashboard' }
        ],
        vibrate: [200, 100, 200, 100, 200] // Premium triple vibration alert
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🚀 NAYA: Notification Button Click Listener Engine
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    let targetUrl = event.notification.data.url;
    
    // Check which button student clicked
    if (event.action === 'start_test') {
        targetUrl = './index.html?source=pwa#main-app-shell';
    } else if (event.action === 'view_dashboard') {
        targetUrl = './index.html?source=pwa#main-app-shell';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            // Agar app already open hai toh usko focus karo
            for (let client of windowClients) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Agar app band hai toh background se open karo
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// =========================================================================
// PWA CACHING LOGIC STARTS HERE (Tumhara purana code neeche rahega)
// =========================================================================
const CACHE_VERSION = 'premium-portal-v13';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;

// Core assets for instant 1-second offline load
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// =========================================================================
// 🚀 IN-APP UPDATE LISTENER (app.js se signal receive karega)
// =========================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') { 
        self.skipWaiting();
    }
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching Premium App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(err => console.error('[Service Worker] Pre-cache Failure:', err))
    );
});


self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== STATIC_CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
                        console.log('[Service Worker] Purging Obsolete Cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. FETCH EVENT: Advance Hybrid Interceptor Architecture
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    if (event.request.method === 'POST' || requestUrl.href.includes('script.google.com')) {
        return; 
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('./index.html');
            })
        );
        return;
    }

    if (requestUrl.origin === 'https://fonts.googleapis.com' || requestUrl.origin === 'https://fonts.gstatic.com') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(STATIC_CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    caches.open(STATIC_CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
            });
            return cachedResponse || fetchPromise;
        })
    );
});
