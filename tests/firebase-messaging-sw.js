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
let lastNotifTime = 0;
let lastNotifTitle = "";
let lastNotifTime = 0;
let lastNotifTitle = "";
// 🚀 100% NATIVE FIX: Direct OS-Level Push Interceptor (Bypasses Firebase Wrapper Delays)
self.addEventListener('push', function(event) {
    if (!event.data) return;
    try {
        const payload = event.data.json();
        const data = payload.data || payload.notification || {};
        if (!data.title) return;

        const notificationTitle = data.title;
        const notificationBody = data.body || 'Tap to check out latest mock tests and updates.';
        
        const now = Date.now();
        if (notificationTitle === lastNotifTitle && (now - lastNotifTime) < 5000) return;
        lastNotifTime = now;
        lastNotifTitle = notificationTitle;

        let rawUrl = data.url || './index.html?source=pwa#home-tab';
        // 🛡️ THE BLANK SCREEN HOTFIX: Prevent wrong URL from crashing UI
        if (rawUrl.includes('#main-app-shell')) {
            rawUrl = rawUrl.replace('#main-app-shell', '#home-tab');
        }

        const notificationOptions = {
            body: notificationBody,
            icon: './icon-192x192.png',
            badge: './icon-512x512.png', 
            image: data.imageUrl || '', 
            tag: 'portal-master-push', 
            renotify: true, 
            data: { url: rawUrl },
            actions: [
                { action: 'start_test', title: '🚀 Attempt Now' },
                { action: 'view_dashboard', title: '📊 Dashboard' }
            ],
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: false
        };

        // 🛡️ NATIVE DB ENGINE: Version 4 Forces upgrade, Closes connection to prevent deadlock
        const dbSyncPromise = new Promise((resolve) => {
            const request = indexedDB.open('PremiumPortalDB', 4);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('notifications')) {
                    db.createObjectStore('notifications', { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => {
                try {
                    const db = e.target.result;
                    if (db.objectStoreNames.contains('notifications')) {
                        const tx = db.transaction('notifications', 'readwrite');
                        
                        let timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                        if(!timeStr || timeStr === 'Invalid Date') { timeStr = new Date().getHours() + ':' + new Date().getMinutes(); }

                        tx.objectStore('notifications').put({
                            id: Date.now() + Math.floor(Math.random() * 1000), 
                            title: notificationTitle,
                            body: notificationBody,
                            time: timeStr
                        });
                        tx.oncomplete = () => { db.close(); resolve(); };
                        tx.onerror = () => { db.close(); resolve(); };
                    } else {
                        db.close(); resolve();
                    }
                } catch (err) { resolve(); } 
            };
            request.onerror = () => resolve();
        });

        event.waitUntil(
            Promise.all([
                self.registration.showNotification(notificationTitle, notificationOptions),
                dbSyncPromise
            ])
        );
    } catch (e) {
        console.error('[SW Native Push Error]:', e);
    }
});

// 🚀 100% NATIVE FIX: Play Store TWA Deep Linking Engine
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Native Notification Clicked.');
    event.notification.close(); 

    let rawUrl = event.notification.data && event.notification.data.url 
        ? event.notification.data.url 
        : './index.html?source=pwa#home-tab';
        
    // 🛡️ THE BLANK SCREEN HOTFIX: Prevent wrong URL from crashing UI
    if (rawUrl.includes('#main-app-shell')) {
        rawUrl = rawUrl.replace('#main-app-shell', '#home-tab');
    }

    const absoluteTargetUrl = new URL(rawUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    return client.focus().then(focusedClient => {
                        if (focusedClient) {
                            focusedClient.postMessage({ type: 'PUSH_ROUTING', url: absoluteTargetUrl });
                        }
                    });
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(absoluteTargetUrl);
            }
        })
    );
});







// =========================================================================
// 🛡️ BULLETPROOF PWA CACHING LOGIC (PLAY STORE READY)
// =========================================================================
const CACHE_VERSION = 'premium-portal-v113-INSTANT-OPEN'; // Version updated for Native Stale-While-Revalidate Engine
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;

// 🚀 CRITICAL FIX: Pre-caching external SDKs prevents Splash Screen freezing on weak networks!
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
    'https://checkout.razorpay.com/v1/checkout.js',
    'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
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



// 🛡️ THE NATIVE INSTANT-LOADER (Kills Chrome Horizontal Loading Bar)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html').then((cachedResponse) => {
                // 🚀 IIT EXPERT FIX: Agar file cache mein hai, toh INSTANTLY load karo (0 network delay).
                // Isse Chrome ka loading bar aane ka time hi nahi milega aur app 100% native feel dega!
                if (cachedResponse) {
                    // Background mein silent update karo taaki future updates aate rahein (No loopholes)
                    fetch(event.request).then((networkResponse) => {
                        caches.open(STATIC_CACHE_NAME).then((cache) => {
                            cache.put('./index.html', networkResponse);
                        });
                    }).catch(() => {}); // Offline hone par chup raho
                    
                    return cachedResponse;
                }
                
                // Agar pehli baar app khul raha hai aur cache nahi hai
                return fetch(event.request).catch(() => {
                    // 🛡️ THE DINOSAUR KILLER: Hardcoded offline HTML fallback
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
