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

// 🚀 IIT EXPERT FIX: OS Tagging & 5-Second Debounce Lock
let lastNotifTime = 0;
let lastNotifTitle = "";

messaging.onBackgroundMessage((payload) => {
    console.log('[Firebase SW] Background Data Received: ', payload);
    
    const data = payload.data || {};
    const notificationTitle = data.title || '🚀 APJAKJB Portal Update';
    const notificationBody = data.body || 'Tap to check out latest mock tests and updates.';
    
    // 🛡️ ANTI-SPAM GUARD: Agar 5 second ke andar exact same title ka push wapas aaye toh block kardo
    const now = Date.now();
    if (notificationTitle === lastNotifTitle && (now - lastNotifTime) < 5000) {
        console.log('[Firebase SW] Duplicate background push suppressed.');
        return;
    }
    lastNotifTime = now;
    lastNotifTitle = notificationTitle;

    const notificationOptions = {
        body: notificationBody,
        icon: './icon-192x192.png',
        badge: './icon-512x512.png', 
        image: data.imageUrl || '', 
        tag: 'portal-master-push', // 🚀 THE MAGIC: OS merges duplicate popups into exactly 1 notification!
        renotify: true, // Vibrate even if merging
        data: { url: data.url || './index.html?source=pwa#main-app-shell' },
        actions: [
            { action: 'start_test', title: '🚀 Attempt Now' },
            { action: 'view_dashboard', title: '📊 Dashboard' }
        ],
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: false
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification Button Click Listener Engine
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    let targetUrl = event.notification.data.url;
    
    if (event.action === 'start_test') {
        targetUrl = './index.html?source=pwa#main-app-shell';
    } else if (event.action === 'view_dashboard') {
        targetUrl = './index.html?source=pwa#main-app-shell';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
}); 

// =========================================================================
// 🛡️ BULLETPROOF PWA CACHING LOGIC (PLAY STORE READY)
// =========================================================================
const CACHE_VERSION = 'premium-portal-v120'; // Version updated
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;

// Core assets for instant offline shell load
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

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') { 
        self.skipWaiting();
    }
});

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force instant installation
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

// 🚀 FETCH EVENT: The Ultimate Interceptor
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Bypass API and POST calls
    if (event.request.method === 'POST' || requestUrl.href.includes('script.google.com')) {
        return; 
    }

    // 🛡️ THE DINOSAUR KILLER (Guarantees Play Store Approval)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('./index.html').then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // IIT EXPERT LEVEL: Hardcoded offline HTML. PWA Builder bots will NEVER see a crash!
                    return new Response(
                        `<!DOCTYPE html>
                        <html lang="en" style="background:#0F172A; color:white; font-family:sans-serif; height:100%; display:flex; justify-content:center; align-items:center; text-align:center;">
                        <body>
                            <div>
                                <h1 style="color:#EF4444; font-size:48px; margin:0;">📡</h1>
                                <h2 style="margin-top:10px;">You are offline</h2>
                                <p style="color:#94A3B8;">Please connect to the internet to access the Test Portal.</p>
                            </div>
                        </body>
                        </html>`,
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                });
            })
        );
        return;
    }

    // Font Caching Strategy
    if (requestUrl.origin === 'https://fonts.googleapis.com' || requestUrl.origin === 'https://fonts.gstatic.com') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request).then((networkResponse) => {
                    return caches.open(STATIC_CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // 🛡️ FIXED DYNAMIC CACHING (Prevents Cache Bloat)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    // CORRECTED: Put dynamic files in DYNAMIC_CACHE_NAME, not Static!
                    caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fails silently for images/css if offline, keeping app alive
            });
        })
    );
});
