// ==========================================
// API CONFIGURATION
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwT29x9mgP_ZAA6aViEGAoq0TT9EKfXnrmJmxkjOXlJTqkv_6j1EnLX4E3vJWtTkMaFlQ/exec";

// ========================================== 
// FIREBASE ENGINE & DATABASE 
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDFHfVutxbFR7kJoni9m4A-_t--mdXY3L8",
    authDomain: "testportal-9562c.firebaseapp.com",
    databaseURL: "https://testportal-9562c-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "testportal-9562c",
    storageBucket: "testportal-9562c.firebasestorage.app",
    messagingSenderId: "737523775575",
    appId: "1:737523775575:web:26db3649ede4845e688b12"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
const database = firebase.database();
const auth = firebase.auth(); 
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ==========================================
// DOM ELEMENTS & GLOBAL STATE
// ==========================================
const loaderOverlay = document.getElementById('wave-loader');
const loaderTextElement = document.getElementById('loader-text');
const popupOverlay = document.getElementById('custom-popup');

let loggedInUser = "";
let loggedInUserName = ""; 
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let activeTestName = "";
let testHistoryData = {}; 
let timerInterval;
let timeRemaining = 0;
let testEndTime = 0;
let isTestActive = false;
let totalTestSeconds = 0;
let serverTimeOffset = 0; // 🛡️ NAYA: Real Server Time Tracker

const optionPrefixes = ['(a) ', '(b) ', '(c) ', '(d) '];

// 🛡️ NAYA: Time Travel Hack Preventer Function
function getSecureTime() {
    return Date.now() + serverTimeOffset;
}

// ==========================================
// 1. APP SHELL UI MECHANICS (NATIVE FEEL)
// ==========================================

// Theme Engine (Dark/Light Mode)
function initTheme() {
    const savedTheme = localStorage.getItem('premium_portal_theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}
initTheme(); // Run immediately

function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('premium_portal_theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('premium_portal_theme', 'dark');
    }
}

// Side Drawer Navigation Logic
const drawer = document.getElementById('side-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');

function toggleDrawer() {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
        drawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        setTimeout(() => { drawerOverlay.style.display = 'none'; }, 250);
    } else {
        drawerOverlay.style.display = 'block';
        // Small delay to allow display:block to render before opacity transition
        setTimeout(() => {
            drawer.classList.add('open');
            drawerOverlay.classList.add('open');
        }, 10);
    }
}

document.getElementById('menu-toggle-btn').addEventListener('click', toggleDrawer);
drawerOverlay.addEventListener('click', toggleDrawer);


// Bottom Navigation Tab Routing (WITH SYSTEM BACK BUTTON SYNC)
function switchTab(tabId, headerTitle, pushToHistory = true) {
    document.querySelectorAll('.tab-view').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if(targetTab) {
        targetTab.style.display = 'flex';
        setTimeout(() => targetTab.classList.add('active'), 10);
    }

    const baseId = tabId.split('-')[0]; 
    const navBtn = document.getElementById(`tab-btn-${baseId}`);
    if(navBtn) navBtn.classList.add('active');

    const appBarTitle = document.getElementById('app-bar-title');
    if(appBarTitle) appBarTitle.innerText = headerTitle;

    // 🛡️ THE FIX: Tab switch hone par usko Browser/System History mein daal do
    if (pushToHistory) {
        history.pushState({ tab: tabId, title: headerTitle }, "", `#${tabId}`);
    }
}

// Attach Event Listeners to UI Elements
document.getElementById('tab-btn-home').addEventListener('click', () => switchTab('home-tab', 'Home'));
document.getElementById('tab-btn-results').addEventListener('click', () => switchTab('results-tab', 'Results'));
document.getElementById('tab-btn-profile').addEventListener('click', () => switchTab('profile-tab', 'Profile'));

// Map Drawer Links to Tabs
document.getElementById('menu-home-btn').addEventListener('click', () => {
    switchTab('home-tab', 'Home Dashboard');
    toggleDrawer();
});

// Highlight Active Drawer Item
document.querySelectorAll('.drawer-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if(e.currentTarget.id !== 'menu-dark-toggle' && e.currentTarget.id !== 'drawer-logout-btn') {
            document.querySelectorAll('.drawer-item').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
        }
    });
});

document.getElementById('menu-dark-toggle').addEventListener('click', () => { toggleDarkMode(); toggleDrawer(); });
document.getElementById('profile-dark-toggle-row').addEventListener('click', toggleDarkMode);


// Feature Grid Category Switcher (Home Tab)
const gridLive = document.getElementById('grid-action-live');
const gridPractice = document.getElementById('grid-action-practice');
const gridNotes = document.getElementById('grid-action-notes'); 


// 🎯 PREMIUM UI ENGINE: Card highlight aur section toggle logic
function handleGridSwitch(activeBtnId, sectionToShowId) {
    document.querySelectorAll('.grid-card').forEach(card => card.classList.remove('active-card'));
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) activeBtn.classList.add('active-card');

// Sabko pehle hide karo (Ab sirf 1 container bacha hai)
    const wrappers = ['practice-tests-910-wrapper'];
    wrappers.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    if (sectionToShowId) {
        const targetSection = document.getElementById(sectionToShowId);
        if (targetSection) {
            targetSection.style.display = 'block'; 
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}




// 🎯 SMART LISTENERS FOR ROUTING (IX-X & XI-XII)
document.getElementById('grid-action-live-910')?.addEventListener('click', () => {
    handleGridSwitch('grid-action-live-910', null); 
    switchTab('live-tests-tab-910', 'Live Tests (IX & X)');
});

// 🛡️ NAYA FIX: Missing Free Live Test Routing Engine for Class 11 & 12
document.getElementById('grid-action-live-1112')?.addEventListener('click', () => {
    handleGridSwitch('grid-action-live-1112', null); 
    switchTab('live-tests-tab-1112', 'Free Live Tests (XI & XII)');
});

// 🌟 FIXED: Premium Live Test ke click par ab NAYA Premium Tab khulega
document.getElementById('grid-action-premium-1112')?.addEventListener('click', () => {
    handleGridSwitch('grid-action-premium-1112', null); 
    switchTab('premium-tests-tab', 'Premium Test Series');
});

document.getElementById('grid-action-practice-910')?.addEventListener('click', () => handleGridSwitch('grid-action-practice-910', 'practice-tests-910-wrapper'));

// ==========================================
// 2. CORE SPA ROUTING (SINGLE SHELL ARCHITECTURE)
// ==========================================
function navigate(screenId, pushToHistory = true) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; 
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.style.display = 'flex';
        setTimeout(() => targetScreen.classList.add('active'), 10);
    }
    if (pushToHistory) {
        history.pushState({ screen: screenId }, "", `#${screenId}`);
    }
}

window.addEventListener('popstate', (e) => {
    // 1. Agar Live Test ke beech mein back dabaya toh block kardo
    if (isTestActive) {
        history.pushState({ tab: 'test-tab', title: 'Test Session' }, "", `#test-tab`);
        showCustomPopup("Blocked", "Back disabled in <strong style='color: var(--danger);'>LIVE</strong> tests. Please submit.", "danger");
        return;
    }

    const state = e.state;
    
    // 2. Agar user kisi Tab par back aaya hai
    if (state && state.tab) {
        switchTab(state.tab, state.title || 'Portal', false);
        
        // Agar ghoom ke wapas Home ya Results par aaya hai, toh data fresh karo
        if (state.tab === 'home-tab' || state.tab === 'results-tab') {
            loadDashboard(); 
        }
    } 
    // 3. Agar user Screen (Login ya Main Shell) par back aaya hai
    else if (state && state.screen) {
        navigate(state.screen, false);
    } 
    // 4. Default Fallback
    else {
        if (loggedInUser) {
            navigate('main-app-shell', false);
            switchTab('home-tab', 'Home Dashboard', false);
        } else {
            navigate('login-screen', false);
        }
    }
});

// ==========================================
// 3. UTILITIES & POPUPS
// ==========================================
function showLoader(text = "Loading...") {
    loaderTextElement.innerText = text;
    loaderOverlay.style.display = 'flex';
}

function hideLoader() {
    loaderOverlay.style.display = 'none';
}

function showCustomPopup(title, message, type = 'info', confirmCallback = null, showCancel = false) {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerHTML = message; 
    
    const iconContainer = document.getElementById('popup-icon-container');
    const iconElement = document.getElementById('popup-icon');
    const confirmBtn = document.getElementById('popup-confirm-btn');
    const cancelBtn = document.getElementById('popup-cancel-btn');
    
    iconContainer.className = 'popup-icon-wrapper';
    
    if (type === 'success') {
        iconContainer.classList.add('success');
        iconElement.innerText = 'check_circle';
        confirmBtn.style.backgroundColor = 'var(--success)';
    } else if (type === 'danger') {
        iconContainer.classList.add('danger');
        iconElement.innerText = 'error';
        confirmBtn.style.backgroundColor = 'var(--danger)';
    } else if (type === 'warning') {
        iconContainer.classList.add('warning');
        iconElement.innerText = 'warning';
        confirmBtn.style.backgroundColor = 'var(--warning)';
    } else {
        iconElement.innerText = 'info';
        confirmBtn.style.backgroundColor = 'var(--primary)';
    }

    cancelBtn.style.display = showCancel ? 'block' : 'none';
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // 🛡️ NAYA: Har baar naya popup khulne par button ko waapas enable rakho
        newConfirmBtn.disabled = false;

        newConfirmBtn.addEventListener('click', () => {
            // 🛡️ ANTI-RACE CONDITION: Ek baar click hote hi button turant lock kar do!
            newConfirmBtn.disabled = true; 
            popupOverlay.style.display = 'none';
            if (confirmCallback) confirmCallback();
        });

        newCancelBtn.addEventListener('click', () => {
            popupOverlay.style.display = 'none';
        });

    popupOverlay.style.display = 'flex';
}


// Request Firebase Push Notification & Link User to RTDB Safely
function triggerSmartPushPrompt() {
    // Basic browser support check
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log("[Firebase] Push notifications not supported in this browser.");
        return;
    }

    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('[Firebase] Native Permission Granted! Waiting for Engine...');
            
            // ✅ BUG FIX 1: Wait for Service Worker to be 100% Ready
            navigator.serviceWorker.ready.then((registration) => {
                messaging.getToken({ 
                    vapidKey: "BG-J8WhZpg2eAMoLahgNbRJZhDTSvTLXO5B_Vr4kw8VUMF4OvynfMBe2nckINHoAhEa-6mMIDP_NOECRu6vKREc",
                    serviceWorkerRegistration: registration 
                })
                .then((currentToken) => {
                    if (currentToken) {
                        console.log('[Firebase] 🔥 Token Generated Successfully!');
                        
                        if (loggedInUser) {
                            // ✅ BUG FIX 2: Sanitize Username (Removes invalid DB chars like . # $ [ ])
                            const safeUsername = loggedInUser.replace(/[.#$[\]]/g, '_');
                            
                            database.ref('students_fcm/' + safeUsername).set({
                                token: currentToken,
                                lastLogin: new Date().toISOString()
                            }).then(() => {
                                console.log(`[Firebase RTDB] Token securely saved for user: ${safeUsername}`);
                            }).catch((error) => {
                                console.error("[Firebase RTDB] Database save failed! Check Firebase Rules.", error);
                            });
                        }
                    } else {
                        console.log('[Firebase] No registration token available.');
                    }
                }).catch((err) => {
                    console.error('[Firebase] Token Generation Blocked: ', err);
                });
            });
        } else {
            console.log('[Firebase] User blocked the notification prompt.');
        }
    });
}


// ==========================================
// 4. AUTHENTICATION
// ==========================================
function checkAuthSession() {
    const cachedUser = localStorage.getItem('student_username');
    const cachedName = localStorage.getItem('student_name');
    const cachedToken = localStorage.getItem('auth_token');
    if (cachedUser && cachedToken) {
        loggedInUser = cachedUser;
        loggedInUserName = cachedName || cachedUser.split('@')[0]; 
        updateProfileUI();
        history.replaceState({ screen: 'main-app-shell' }, "", "#main-app-shell");
        loadDashboard(); 
        triggerSmartPushPrompt();
    } else {
        history.replaceState({ screen: 'login-screen' }, "", "#login-screen");
        navigate('login-screen', false);
    }
}
document.addEventListener("DOMContentLoaded", checkAuthSession);
function updateProfileUI() {
    document.getElementById('welcome-text').innerText = `Hello Dear, ${loggedInUserName}`;
    document.getElementById('drawer-username').innerText = loggedInUserName;
    document.getElementById('profile-student-name').innerText = loggedInUserName;
    document.getElementById('profile-meta-username').innerText = loggedInUser;
}
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('error-message');
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    
    showLoader("Authenticating Session...");
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({ action: "login", username: usernameInput, password: passwordInput })
        });
        const result = JSON.parse(await response.text());

        if (result.success) {
            loggedInUser = usernameInput;
            loggedInUserName = usernameInput;
            localStorage.setItem('student_username', loggedInUser);
            localStorage.setItem('student_name', loggedInUserName);
            localStorage.setItem('auth_token', result.token); 
            
            updateProfileUI();
            document.getElementById('login-form').reset();
            errorMsg.innerText = "";
            loadDashboard();
            triggerSmartPushPrompt(); 
        } else {
            errorMsg.innerText = result.message;
        }
    } catch (error) {
        errorMsg.innerText = "Network connection failed. Please try again.";
    } finally {
        hideLoader();
    }
});




// ==========================================
// 🚀 NAYA: PREMIUM GOOGLE LOGIN ENGINE (SECURE SYNC)
// ==========================================
const googleLoginBtn = document.getElementById('google-login-btn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        showLoader("Connecting to Google Securely...");
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            const email = user.email;
            const name = user.displayName || email.split('@')[0];

            // 🛡️ THE FIX: Backend ko inform karo aur Secure Token fetch karo
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                redirect: "follow",
                body: JSON.stringify({ action: "googleLogin", email: email, name: name })
            });
            const backendResult = JSON.parse(await response.text());

            if (backendResult.success) {
                loggedInUser = email;
                loggedInUserName = name;
                
                // ✅ Ab LocalStorage mein proper authentication parameters save honge
                localStorage.setItem('student_username', loggedInUser);
                localStorage.setItem('student_name', loggedInUserName);
                localStorage.setItem('auth_token', backendResult.token); 

                updateProfileUI();
                document.getElementById('error-message').innerText = ""; 
                loadDashboard();
                triggerSmartPushPrompt(); 
            } else {
                showCustomPopup("Access Denied", backendResult.message, "danger");
                if(auth) auth.signOut(); // Invalid backend response par turant Firebase session destroy karo
            }
            
        } catch (error) {
            console.error("Google Login Error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                showCustomPopup("Login Failed", "Could not sign in with Google. Please try again.", "danger");
            }
        } finally {
            hideLoader();
        }
    });
}


function handleLogout() {
    showCustomPopup("Secure Logout", "Are you sure you want to end your session?", "warning", async () => {
        showLoader("Destroying Secure Session...");
        
        try {
            // 🔥 THE FIX: Backend ko signal bhejo ki Google Sheet se token uda de
            await fetch(API_URL, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "logout", username: loggedInUser })
            });
        } catch (e) {
            console.log("Server sync failed, but clearing local session.");
        }
        
        hideLoader();
        loggedInUser = "";
        localStorage.removeItem('student_username');
        localStorage.removeItem('student_name');
        localStorage.removeItem('auth_token'); 
        
        if(auth) auth.signOut();
        if(drawer.classList.contains('open')) toggleDrawer();
        navigate('login-screen');
    }, true);
}

document.getElementById('drawer-logout-btn').addEventListener('click', handleLogout);
document.getElementById('profile-logout-btn').addEventListener('click', handleLogout);

// ==========================================
// 5. DASHBOARD, DATA & LIVE ENGINE
// ==========================================
let dashboardTimerInterval;


async function loadDashboard() {
    navigate('main-app-shell');
    switchTab('home-tab', 'Home Dashboard');
    
const practiceList910 = document.getElementById('practice-list-910');
    const practiceList1112 = document.getElementById('practice-list-1112');
    const pastResultsContainer = document.getElementById('past-results-list');
    
    const upcoming910 = document.getElementById('upcoming-live-list-910');
    const expired910 = document.getElementById('expired-live-list-910');
    const upcoming1112 = document.getElementById('upcoming-live-list-1112');
    const expired1112 = document.getElementById('expired-live-list-1112');
    
    // 💎 NAYA: Premium Test List Container
    const premiumTestList = document.getElementById('premium-test-list');

    showLoader("Syncing Live Portal...");
    clearInterval(dashboardTimerInterval); 


    try {
        const authToken = localStorage.getItem('auth_token');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getDashboard", username: loggedInUser, token: authToken })
        });

        const result = JSON.parse(await response.text());

        if (result.success) {
            // 🛡️ SYNC DEVICE TIME WITH SERVER TIME
            if (result.serverTime) {
                serverTimeOffset = result.serverTime - Date.now();
            }

            [practiceList910, practiceList1112, pastResultsContainer, upcoming910, expired910, upcoming1112, expired1112].forEach(el => {
                if(el) el.innerHTML = "";
            });
            
            testHistoryData = result.history || {}; 

            let practiceCount910 = 0, practiceCount1112 = 0, completedCount = 0;
            let upCount910 = 0, expCount910 = 0, upCount1112 = 0, expCount1112 = 0;
            const nowMs = getSecureTime(); // 🛡️ SECURE TIME USED HERE

            const formatOnlyDate = (isoString) => {
                if(!isoString) return 'TBA';
                return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            };

            const formatShortDate = (isoString) => {
                if (!isoString) return 'TBA';
                return new Date(isoString).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            };

            // 🎯 Class Filter Engine (Sirf 11, 12 aur XI, XII ko filter karega)
            const isSeniorClass = (classStr) => {
                const str = String(classStr).toUpperCase();
                return str.includes('11') || str.includes('12') || str.includes('XI');
            };

            // --- RENDER PRACTICE TESTS ---
            (result.practiceTests || []).forEach(test => {
                if (test.status === "completed") {
                    completedCount++; renderCompletedCard(test, pastResultsContainer);
                } else {
                    const isSenior = isSeniorClass(test.classLvl);
                    if (isSenior) practiceCount1112++; else practiceCount910++;

                    const cardHTML = `
                        <div class="premium-test-card" data-test="${test.testId}" data-duration="${test.duration}" data-type="practice">
                            <div class="ptc-header">
                                <span class="ptc-subject">${test.subject}</span>
                                <span class="ptc-class">Class ${test.classLvl}</span>
                            </div>
                            <h4 class="ptc-title">${test.title} <span class="new-badge" style="background:var(--primary); color:white;">NEW</span></h4>
                            <div class="ptc-details">
                                <p><span class="material-icons">event</span> <strong>Published:</strong> ${formatOnlyDate(test.publishedDate)}</p>
                                <p><span class="material-icons">menu_book</span> <strong>Syllabus:</strong> ${test.syllabus}</p>
                                <p><span class="material-icons">schedule</span> <strong>Duration:</strong> ${test.duration} Mins</p>
                            </div>
                            <div class="ptc-footer">
                                <button class="btn-primary test-action-btn">Attempt Practice Test</button>
                            </div>
                        </div>
                    `;
                    
                    if(isSenior && practiceList1112) practiceList1112.insertAdjacentHTML('beforeend', cardHTML);
                    else if (!isSenior && practiceList910) practiceList910.insertAdjacentHTML('beforeend', cardHTML);
                }
            });


            // 💎 PREMIUM CONTAINER LINK (Agar HTML mein hai toh)
            const premiumTestList = document.getElementById('premium-test-list');



            // 🟢 --- 1. RENDER FREE LIVE TESTS ---
            (result.liveTests || []).forEach(test => {
                if (test.status === "completed") {
                    completedCount++; renderCompletedCard(test, pastResultsContainer);
                } else {
                    const endTimeMs = new Date(test.endTime).getTime();
                    const isExpired = nowMs > endTimeMs; 
                    const isSenior = isSeniorClass(test.classLvl);

                    const cardHTML = `
                        <div class="premium-test-card live-test-card" 
                             data-test="${test.testId}" 
                             data-duration="${test.duration}" 
                             data-start="${test.startTime}" 
                             data-end="${test.endTime}" 
                             data-type="live">
                            <div class="ptc-header">
                                <span class="ptc-subject live-subject">${test.subject}</span>
                                <span class="ptc-class">Class ${test.classLvl}</span>
                            </div>
                            <h4 class="ptc-title">${test.title} <span class="live-status-badge"></span></h4>
                            <div class="ptc-details">
                                <p><span class="material-icons">menu_book</span> <strong>Syllabus:</strong> ${test.syllabus}</p>
                                <p><span class="material-icons">schedule</span> <strong>Duration:</strong> ${test.duration} Mins</p>
                                <div class="ptc-timings">
                                    <div class="time-block">
                                        <span class="material-icons" style="color:var(--success)">event_available</span>
                                        <div><small>Starts</small><br><b>${formatShortDate(test.startTime)}</b></div>
                                    </div>
                                    <div class="time-block">
                                        <span class="material-icons" style="color:var(--danger)">event_busy</span>
                                        <div><small>Ends</small><br><b>${formatShortDate(test.endTime)}</b></div>
                                    </div>
                                </div>
                            </div>
                            <div class="ptc-footer" style="flex-direction: column; gap: 8px;">
                                <p class="live-timing-text" style="font-size: 13px; text-align:center; width:100%;"></p>
                                <button class="btn-primary test-action-btn" disabled>Wait...</button>
                            </div>
                        </div>
                    `;

                    if (isSenior) {
                        if (isExpired) { expCount1112++; if(expired1112) expired1112.insertAdjacentHTML('beforeend', cardHTML); }
                        else { upCount1112++; if(upcoming1112) upcoming1112.insertAdjacentHTML('beforeend', cardHTML); }
                    } else {
                        if (isExpired) { expCount910++; if(expired910) expired910.insertAdjacentHTML('beforeend', cardHTML); }
                        else { upCount910++; if(upcoming910) upcoming910.insertAdjacentHTML('beforeend', cardHTML); }
                    }
                }
            });


            // 💎 --- 2. RENDER PREMIUM BUNDLES (Test Series) ---
            (result.premiumBundles || []).forEach(bundle => {
                const premiumCardHTML = `
                    <div class="bundle-premium-card premium-glow-card" data-bundle="${bundle.bundleId}">
                        <h3 class="bpc-title">${bundle.title}</h3>
                        <div class="bpc-header">
                            <div class="bpc-tags">
                                <span class="bpc-subject">${bundle.subject}</span>
                                <span class="bpc-class">Class ${bundle.classLvl}</span>
                            </div>
                            ${bundle.offerBadge ? `<div class="bpc-offer-badge"><span class="material-icons star-icon">auto_awesome</span> ${bundle.offerBadge}</div>` : ''}
                        </div>
                        <div class="bpc-stats-grid">
                            <div class="bpc-stat">
                                <span class="material-icons primary-icon">menu_book</span>
                                <div>
                                    <small>Syllabus</small>
                                    <p>${bundle.syllabus}</p>
                                </div>
                            </div>
                            <div class="bpc-stat">
                                <span class="material-icons success-icon">format_list_numbered</span>
                                <div>
                                    <small>Total Number of Test</small>
                                    <p>${bundle.totalMocks}</p>
                                </div>
                            </div>
                        </div>

                        <div class="bpc-price-row">
                            <div class="bpc-price-info">
                                <span class="bpc-old-price">₹${bundle.originalPrice || 999}</span>
                                <span class="bpc-new-price">₹${bundle.offerPrice || 199}</span>
                            </div>
                            <div class="bpc-discount-tag">Save Big!</div>
                        </div>

                        <div class="bpc-actions">
                            <button class="btn-secondary bpc-about-btn" data-about="${bundle.bundleId}">
                                Explore Demo
                            </button>
                            
                            ${!bundle.isBought ? 
                                `<button class="btn-primary bpc-buy-btn premium-buy-btn" data-testid="${bundle.bundleId}" data-amount="${bundle.offerPrice}">
                                    <span class="material-icons" style="font-size:16px;">shopping_cart_checkout</span> Buy Now
                                </button>` 
                                : 
                                `<button class="btn-primary bpc-open-btn premium-open-series-btn" data-series="${bundle.bundleId}" data-title="${bundle.title}">
                                    Purchased | Open Now
                                </button>`
                            }
                        </div>
                    </div>
                `;
                if (premiumTestList) premiumTestList.insertAdjacentHTML('beforeend', premiumCardHTML);
            });

            // 🎨 NEW EMPTY STATES
            const emptyMsg = (msg) => `<div style="text-align:center; color:var(--text-muted); padding: 30px;">${msg}</div>`;
            if (upCount910 === 0 && upcoming910) upcoming910.innerHTML = emptyMsg("No upcoming live tests for IX & X.");
            if (expCount910 === 0 && expired910) expired910.innerHTML = emptyMsg("No expired tests for IX & X.");
            if (upCount1112 === 0 && upcoming1112) upcoming1112.innerHTML = emptyMsg("No upcoming live tests for XI & XII.");
            if (expCount1112 === 0 && expired1112) expired1112.innerHTML = emptyMsg("No expired tests for XI & XII.");
            if (practiceCount910 === 0 && practiceList910) practiceList910.innerHTML = emptyMsg("No practice tests for IX & X.");
            if (practiceCount1112 === 0 && practiceList1112) practiceList1112.innerHTML = emptyMsg("No practice tests for XI & XII.");
            if (completedCount === 0 && pastResultsContainer) pastResultsContainer.innerHTML = emptyMsg("You haven't attempted any tests yet.");

            attachTestCardListeners();
            startDashboardLiveEngine(); 
        } else {
            showCustomPopup("Error", result.message, "danger");
        }
    } catch (e) {
        showCustomPopup("Network Error", "Failed to sync dashboard. Check internet.", "danger");
    } finally {
        hideLoader();
    }
}


function renderCompletedCard(test, container) {
    const pastData = testHistoryData[test.testId];
    const safeScore = pastData ? pastData.score : test.score;
    const safeTotal = pastData ? pastData.total : test.total;
    container.insertAdjacentHTML('beforeend', `
        <div class="test-card" data-test="${test.testId}" data-completed="true">
            <div class="test-info">
                <h4>${test.title}</h4>
                <p>Scored: <strong style="color:var(--success)">${safeScore}</strong> / ${safeTotal} Marks</p>
            </div>
            <button class="btn-secondary test-action-btn">View Analysis</button>
        </div>
    `);
}

// --- NATIVE LIVE ENGINE (REAL-TIME UI) ---
function startDashboardLiveEngine() {
function updateLiveCards() {
        const now = getSecureTime(); // 🛡️ SECURE TIME USED HERE
        document.querySelectorAll('.live-test-card').forEach(card => {
            const startTime = new Date(card.getAttribute('data-start')).getTime();
            const endTime = new Date(card.getAttribute('data-end')).getTime();
            
            const badge = card.querySelector('.live-status-badge');
            const timeText = card.querySelector('.live-timing-text');
            const btn = card.querySelector('.test-action-btn');
            const isPremium = card.getAttribute('data-premium') === "true";
            const isBought = card.getAttribute('data-bought') === "true";
            const offerPrice = card.getAttribute('data-newprice');

            // Agar Test Expire Ho Gaya Hai
            if (now > endTime) {
                badge.innerHTML = `<span style="color:var(--danger); font-size:11px; font-weight:bold;">🔴 CLOSED</span>`;
                timeText.innerText = `Missed: ${new Date(endTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}`;
                btn.innerText = "Expired";
                btn.disabled = true;
                btn.style.opacity = "0.3";
                btn.style.backgroundColor = "transparent";
                btn.style.color = "var(--text-muted)";
            } 
            else { // Test Upcoming hai ya Live Now hai
                if (now < startTime) {
                    badge.innerHTML = `<span style="color:var(--warning); font-size:11px; font-weight:bold;">⏳ UPCOMING</span>`;
                    timeText.innerHTML = `Starts: <strong>${new Date(startTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</strong>`;
                } else {
                    badge.innerHTML = `<span style="color:var(--success); font-size:11px; font-weight:bold;">🛑 LIVE NOW</span>`;
                    const diffMs = endTime - now;
                    const hrs = Math.floor(diffMs / 3600000);
                    const mins = Math.floor((diffMs % 3600000) / 60000);
                    timeText.innerHTML = `<span style="color:var(--danger); font-weight:600;">Closes in: ${hrs}h ${mins}m</span>`;
                }
                
                // 💎 SMART BUTTON TEXT LOGIC
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.padding = "12px 24px";
                
                if (isPremium && !isBought) {
                    // Paid hai aur kharida nahi hai -> "Buy Test" dikhao
                    btn.innerHTML = `Buy Test - ₹${offerPrice} <span class="material-icons" style="font-size:16px;">shopping_cart</span>`;
                    btn.style.backgroundColor = "#F59E0B"; // Gold color for buying
                    btn.style.color = "white";
                } else {
                    // Free hai ya phir Kharid liya hai -> "Open Test" logic
                    if (now < startTime) {
                        btn.innerText = isPremium && isBought ? "Purchased (Wait to start)" : "🔒 Inactive";
                        btn.disabled = true;
                        btn.style.opacity = "0.5";
                        btn.style.backgroundColor = "var(--primary)";
                    } else {
                        btn.innerText = isPremium && isBought ? "Open Premium Test" : "Start Live Test";
                        btn.style.backgroundColor = "var(--danger)"; // Striking Red for Live
                        btn.style.color = "white";
                    }
                }
            }
        });
    }
    
    updateLiveCards(); 
    dashboardTimerInterval = setInterval(updateLiveCards, 30000); // UI Updates every 30 seconds
}



function attachTestCardListeners() {
    document.querySelectorAll('.test-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const testCard = e.target.closest('.test-card, .premium-test-card');
            
            if (!testCard) return; // Fallback safety
            
            const isCompleted = testCard.getAttribute('data-completed') === "true";
            const testType = testCard.getAttribute('data-type');
            activeTestName = testCard.getAttribute('data-test');
            
            if (isCompleted) {
                const pastData = testHistoryData[activeTestName];
                if (pastData && !pastData.error) {
                    displayDeepAnalysis(pastData.score, pastData.total, pastData.percentage, pastData.details, true);
                } else {
                    showCustomPopup("Unavailable", "Analysis data is corrupted or unavailable for this test.", "danger");
                }

                } else {
                const duration = parseInt(testCard.getAttribute('data-duration'));
                
                // 💎 NAYA: Premium Checks (Data Attributes se read karna)
                const isPremium = testCard.getAttribute('data-premium') === "true";
                const isBought = testCard.getAttribute('data-bought') === "true";




                // 🌟 SCENARIO 1: Agar Premium hai aur BOUGHT NAHI HAI -> Detail Screen kholo
                if (isPremium && !isBought) {
                    document.getElementById('pkg-detail-title').innerText = testCard.getAttribute('data-title');
                    document.getElementById('pkg-old-price').innerText = `₹${testCard.getAttribute('data-oldprice')}`;
                    document.getElementById('pkg-new-price').innerText = `₹${testCard.getAttribute('data-newprice')}`;
                    document.getElementById('pkg-offer-text').innerText = testCard.getAttribute('data-badge');
                    document.getElementById('pkg-detail-syllabus').innerText = testCard.getAttribute('data-syllabus');
                    document.getElementById('pkg-detail-duration').innerText = `${duration} Mins`;
                    
                    // 🎯 THE FIX: Buy Button ko exactly batao ki kya kharidna hai
                    const buyBtn = document.getElementById('pkg-buy-btn');
                    buyBtn.setAttribute('data-testid', testCard.getAttribute('data-test'));
                    buyBtn.setAttribute('data-amount', testCard.getAttribute('data-newprice'));
                    
                    // About Test popup set karna
                    document.getElementById('pkg-about-btn').onclick = () => {
                        showCustomPopup("About This Test", testCard.getAttribute('data-about'), "info");
                    };
                    
                    switchTab('premium-package-tab', 'Package Details'); // 🛡️ NATIVE UI FIX
                    return; // Yahin ruk jao, aage live test start nahi hoga
                }





                // 🌟 SCENARIO 2: Free test hai, ya phir Kharida hua Premium test hai (Normal flow)
                if (testType === 'live') {
                    const start = new Date(testCard.getAttribute('data-start')).getTime();
                    const end = new Date(testCard.getAttribute('data-end')).getTime();
                    const now = getSecureTime(); // 🛡️ SECURE TIME USED HERE
                    
                    if (now < start) {
                        showCustomPopup("Locked Securely", "This test hasn't started yet. Please wait.", "warning");
                        return;
                    }
                    if (now > end) {
                        showCustomPopup("Expired", "This test window has been permanently closed.", "danger");
                        return;
                    }
                }

                showCustomPopup(
                    testType === 'live' ? "Start LIVE Exam" : "Start Test", 
                    `This test is strictly timed for <strong>${duration} minutes</strong>. You cannot pause it, switch tabs, or go back.<br><br>Are you ready?`, 
                    "info", 
                    () => { startLiveTest(activeTestName, duration); }, 
                    true
                );
            }
        });
    });
}

// ==========================================
// 6. LIVE TEST ENGINE (NO CHANGES NEEDED HERE)
// ==========================================

// Strict Anti-Cheat: Tab Switch / Minimize Detection
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isTestActive) {
        // Zero-tolerance: Immediately submit test and show warning
        showCustomPopup(
            "Test Terminated!", 
            "You switched tabs or minimized the app. As per strict anti-cheat policies, your test has been automatically submitted.", 
            "danger",
            () => {
                // Ensure popup doesn't block submission flow
            }
        );
        processSubmission(); // Force submit immediately
    }
});


async function startLiveTest(testId, durationMins) {
    showLoader("Initializing Secure Environment...");
    try {
        const authToken = localStorage.getItem('auth_token');   
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({ action: "fetchTest", username: loggedInUser, token: authToken, testName: testId })
        });

        const result = JSON.parse(await response.text());

        if (result.success && result.questions.length > 0) {
            currentQuestions = result.questions;
            currentQuestionIndex = 0;
            userAnswers = {}; 
            document.getElementById('test-title').innerText = testId.replace(/_/g, ' ');
            
            isTestActive = true; 
            renderQuestion();
            totalTestSeconds = durationMins * 60;
            startTimer(durationMins * 60); 
            switchTab('test-tab', 'Test Session'); // 🛡️ NATIVE UI FIX
        } else {
            showCustomPopup("Coming Soon", "Questions for this test are not uploaded yet.", "danger");
        }
    } catch (error) {
        showCustomPopup("Connection Error", "Failed to load test. Check connection.", "danger");
    } finally {
        hideLoader();
    }
}

function startTimer(seconds) {
    clearInterval(timerInterval);
    timeRemaining = seconds; // 🛡️ SYSTEM TIME BYPASS: Direct seconds variable set karo
    
    function checkTime() {
        timeRemaining--; // 🛡️ STRICT ENGINE: Har second exactly 1 minus karo. Device time change karne se ispe koi farq nahi padega.
        
        if (timeRemaining <= 0) {
            timeRemaining = 0;
        }
        
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            showCustomPopup("Time's Up!", "Auto-submitting your test.", "warning", processSubmission, false);
        }
    }
    
    updateTimerDisplay(); // Start hote hi UI par time dikhao
    timerInterval = setInterval(checkTime, 1000); // Har 1 second mein tick karo
}

function updateTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    document.getElementById('timer').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}




// ✅ NAYA: Question Render Engine with Palette Sync
function renderQuestion() {
    const qData = currentQuestions[currentQuestionIndex];
    document.getElementById('question-counter').innerText = `${currentQuestionIndex + 1}/${currentQuestions.length}`;
    document.getElementById('question-text').innerText = qData.questionText;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${optionPrefixes[index] || ''}${opt}`;
        if (userAnswers[qData.id] === opt) btn.classList.add('selected');

        btn.addEventListener('click', () => {
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            userAnswers[qData.id] = opt;
            
            // ✅ Answer click karte hi bubble automatically Green ho jayega
            renderQuestionPalette(); 
        });
        container.appendChild(btn);
    });

    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    const nextBtn = document.getElementById('next-btn');
    
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.innerHTML = `Submit Final <span class="material-icons btn-inline-icon">check_circle</span>`;
        nextBtn.style.backgroundColor = "var(--success)";
    } else {
        nextBtn.innerHTML = `Next <span class="material-icons btn-inline-icon">arrow_forward</span>`;
        nextBtn.style.backgroundColor = "var(--primary)";
    }

    // ✅ Question Load hote hi palette update aur scroll karega
    renderQuestionPalette();
}

// ✅ NAYA LOGIC: Quick Jump System Engine
function renderQuestionPalette() {
    const palette = document.getElementById('question-palette');
    if (!palette) return;
    
    palette.innerHTML = '';
    
    currentQuestions.forEach((q, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'q-bubble';
        bubble.innerText = index + 1; // 1, 2, 3...
        
        // Agar student pehle answer de chuka hai toh Green color
        if (userAnswers[q.id]) {
            bubble.classList.add('answered');
        }
        
        // Agar yeh question abhi screen par active hai
        if (index === currentQuestionIndex) {
            bubble.classList.add('active');
            // Auto-scroll logic: Active bubble hamesha center mein move hoga
            setTimeout(() => {
                bubble.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }, 50);
        }
        
        // Click karte hi seedha uss question par jump
        bubble.addEventListener('click', () => {
            currentQuestionIndex = index;
            renderQuestion();
        });
        
        palette.appendChild(bubble);
    });
}





document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(); }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++; renderQuestion();
    } else {
        const answeredCount = Object.keys(userAnswers).length;
        if (answeredCount < currentQuestions.length) {
            showCustomPopup("Incomplete", `You answered ${answeredCount} of ${currentQuestions.length} questions. Submit?`, "warning", processSubmission, true);
        } else {
            showCustomPopup("Submit Test", "Submit your final answers?", "info", processSubmission, true);
        }
    }
});


// ==========================================
// 7. ANALYSIS & RESULTS SCREEN (WITH OFFLINE RETRY)
// ==========================================
async function processSubmission() {
    if (!isTestActive) return; 
    isTestActive = false; // Double-click ko rokne ke liye turant lock karo

    clearInterval(timerInterval);

    // 🛡️ ANTI-CHEAT FIX: Screen ko turant freeze kar do taaki offline mode mein answers change na kar sakein
    const optionsContainer = document.getElementById('options-container');
    if(optionsContainer) optionsContainer.style.pointerEvents = 'none';
    const questionPalette = document.getElementById('question-palette');
    if(questionPalette) questionPalette.style.pointerEvents = 'none';
    document.getElementById('prev-btn').disabled = true;
    document.getElementById('next-btn').disabled = true;

    // 🛡️ OFFLINE CHECK 1: Pata karo internet hai ya nahi
    if (!navigator.onLine) {
        isTestActive = true; // Wapas true karo taaki baccha retry kar sake (lekin UI ab locked rahega)
        showCustomPopup(
            "No Internet! 📡", 
            "Your answers are securely locked. Please turn on your internet and tap Retry to submit.", 
            "warning", 
            () => { processSubmission(); }, 
            false
        );
        return;
    }

    showLoader("Grading your test & Calculating Rank...");
    const timeTaken = totalTestSeconds - timeRemaining;

    try {
        const authToken = localStorage.getItem('auth_token');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({ action: "submitTest", username: loggedInUser, token: authToken, testName: activeTestName, answers: userAnswers, timeTaken: timeTaken })
        });
        const result = JSON.parse(await response.text());

        if (result.success) {
            history.replaceState({ tab: 'analysis-tab', title: 'Performance Insights' }, "", "#analysis-tab"); // 🛡️ NATIVE UI FIX
            hideLoader();
            showCustomPopup("Submitted! 🎉", "Results processed successfully.", "success", () => {
                displayDeepAnalysis(result.score, result.total, result.percentage, result.analysis, false);
            });
        } else {
            throw new Error("Grading failed: " + result.message);
        }
    } catch (e) {
        hideLoader();
        isTestActive = true; // 🛡️ OFFLINE CHECK 2: Agar submit hote waqt net gaya, toh bhi retry enable karo
        
        showCustomPopup(
            "Network Drop Detected! ⚠️", 
            "We couldn't connect to the server. Don't worry, your test is safe. Reconnect internet and tap Retry.", 
            "danger", 
            () => { processSubmission(); } // Retry ka button (Ab dashboard pe nahi fekega!)
        );
    }
}



function displayDeepAnalysis(score, total, percentage, detailsArray, pushToHistory = true) {
    let cleanPercentage = parseFloat(percentage);
    if (isNaN(cleanPercentage)) cleanPercentage = total > 0 ? ((score / total) * 100) : 0;
    
    const badgeColor = cleanPercentage >= 70 ? "var(--success)" : cleanPercentage >= 40 ? "var(--warning)" : "var(--danger)";

    document.getElementById('score-text').innerHTML = `Final Score<br><span class="highlight-score" style="color: ${badgeColor}">${score} <span style="font-size:24px; color:var(--text-muted)">/ ${total}</span></span>`;
    document.getElementById('percentage-text').innerText = `${cleanPercentage.toFixed(0)}% Accuracy`;
    document.getElementById('percentage-text').style.backgroundColor = badgeColor;

    const breakdownList = document.getElementById('breakdown-list');
    breakdownList.innerHTML = "";

    (detailsArray || []).forEach((item, index) => {
        const isCorrect = item.isCorrect;
        const color = isCorrect ? "var(--success)" : "var(--danger)";
        const icon = isCorrect ? "check_circle" : "cancel";

        breakdownList.innerHTML += `
            <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                <h5><span class="material-icons" style="font-size:16px; color:${color}">${icon}</span> Q${index + 1}: ${item.questionText}</h5>
                <p style="color:${color}">Your Answer: <span class="user-ans">${item.studentAnswer}</span></p>
                ${!isCorrect ? `<p class="correct-ans">Correct Answer: ${item.correctAnswer}</p>` : ''}
            </div>
        `;

    });

    switchTab('analysis-tab', 'Performance Insights', pushToHistory); // 🛡️ NATIVE UI FIX
}



// ==========================================
// 8. ADVANCED FIREBASE SERVICE WORKER (PWA)
// ==========================================

let newWorker;
let swRegistration = null; // ✅ NAYA: SW ko global banaya taaki button click par check kar sakein

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./firebase-messaging-sw.js', { updateViaCache: 'none' })
            .then((registration) => {
                console.log('[PWA Engine] Firebase SW registered beautifully.');
                swRegistration = registration;
                messaging.useServiceWorker(registration); 

                registration.update(); // Auto check on load

                if (registration.waiting) {
                    newWorker = registration.waiting;
                    showUpdatePopup();
                }

                registration.addEventListener('updatefound', () => {
                    newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            hideLoader(); // Loader hatao agar manual check chal raha tha
                            showUpdatePopup();
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('[PWA Engine] Firebase SW registration failed: ', error);
            });

        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload(); // Turant naya version reload hoga
        });
    });
}

function showUpdatePopup() {
    showCustomPopup(
        "🚀 Update Available", 
        "A new premium version of the portal is ready. Click update to get the latest features!", 
        "success", 
        () => {
            showLoader("Installing & Restarting...");
            if (newWorker) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
        }, 
        false
    );
}

// ✅ NAYA: MANUAL "CHECK FOR UPDATES" ENGINE
const menuUpdateBtn = document.getElementById('menu-update-btn');
if (menuUpdateBtn) {
    menuUpdateBtn.addEventListener('click', async () => {
        toggleDrawer(); // Side menu band karo
        
        if (!swRegistration) {
            showCustomPopup("Hold On", "Update engine is initializing. Try again in a few seconds.", "warning");
            return;
        }

        showLoader("Checking server for updates..."); // Sundar loader dikhega

        try {
            // Force server scan
            await swRegistration.update();
            
            // 1.5 second ka delay taaki server response scan ho sake
            setTimeout(() => {
                hideLoader();
                // Agar koi naya code nahi aaya:
                if (!swRegistration.installing && !swRegistration.waiting) {
                    showCustomPopup("Up to Date! 🎉", "You are already using the latest premium version of the portal.", "success");
                } 
                // Agar update waiting mein fasa hua hai:
                else if (swRegistration.waiting) {
                    newWorker = swRegistration.waiting;
                    showUpdatePopup();
                }
                // (Agar naya update mil gaya, toh upar wala 'updatefound' event automatic popup dikha dega)
            }, 1500); 

        } catch (err) {
            hideLoader();
            showCustomPopup("Network Error", "Could not check for updates. Please check your internet connection.", "danger");
        }
    });
}

// Foreground In-App Notification Handler
messaging.onMessage((payload) => {
    console.log('[Firebase] Foreground Message Received: ', payload);
    showCustomPopup(
        payload.notification.title, 
        payload.notification.body, 
        "info"
    );
}); 

// ==========================================
// 9. PREMIUM LEADERBOARD ENGINE
// ==========================================
document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    fetchAndRenderLeaderboard(activeTestName);
});

async function fetchAndRenderLeaderboard(testId) {
    const listContainer = document.getElementById('leaderboard-list');
    
    // 🛡️ NATIVE UI FIX: Tab switch use karo
    switchTab('leaderboard-tab', 'Live Rankings');
    
    document.getElementById('leaderboard-test-name').innerText = testId.replace(/_/g, ' ').toUpperCase();
    
    // Premium loading animation
    listContainer.innerHTML = `<div style="text-align:center; padding: 40px;"><span class="material-icons" style="font-size:40px; color:var(--primary); animation: waveMotion 1.5s infinite;">emoji_events</span><p style="margin-top:10px; font-weight:600;">Fetching All India Ranks...</p></div>`;

        try {
        const authToken = localStorage.getItem('auth_token');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getLeaderboard", username: loggedInUser, token: authToken, testName: testId })
        });

        const result = JSON.parse(await response.text());

        if (result.success && result.leaderboard.length > 0) {
            listContainer.innerHTML = "";
            
            result.leaderboard.forEach(student => {
                let rankDisplay = `<span class="normal-rank">#${student.rank}</span>`;
                let cardClass = "lb-card-normal";
                let trophy = "";
                
                if (student.rank === 1) { rankDisplay = `🥇`; cardClass = "lb-card-gold"; trophy = `<span class="material-icons star-icon">star</span>`; }
                else if (student.rank === 2) { rankDisplay = `🥈`; cardClass = "lb-card-silver"; }
                else if (student.rank === 3) { rankDisplay = `🥉`; cardClass = "lb-card-bronze"; }
                let displayRankName = student.username;
                if(displayRankName.includes('@')) {
                    displayRankName = displayRankName.split('@')[0];
                }

                let mins = Math.floor(student.timeTaken / 60);

                let secs = student.timeTaken % 60;
                let timeStr = `${mins}m ${secs}s`;

                listContainer.insertAdjacentHTML('beforeend', `
                    <div class="lb-card ${cardClass}">
                        <div class="lb-rank">${rankDisplay}</div>
                        <div class="lb-details">
                            <h4>${displayRankName} ${trophy}</h4>
                            <p><span class="material-icons">timer</span> ${timeStr}</p>
                        </div>
                        <div class="lb-score">
                            <h2>${student.score}<span>/${student.total}</span></h2>
                            <p>Marks</p>
                        </div>
                    </div>
                `);
            });
        } else {
            listContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:30px;">No ranks generated yet. Be the first!</p>`;
        }
    } catch (err) {
        listContainer.innerHTML = `<p class="error" style="text-align:center; padding:30px;">Failed to connect to ranking server.</p>`;
    }
}

// ==========================================
// 10. DUAL LIVE TESTS TABS ENGINE (IX-X & XI-XII)
// ==========================================
function setupLiveTabs(target) {
    const tabUp = document.getElementById(`tab-upcoming-${target}`);
    const tabExp = document.getElementById(`tab-expired-${target}`);
    const listUp = document.getElementById(`upcoming-live-list-${target}`);
    const listExp = document.getElementById(`expired-live-list-${target}`);

    if (tabUp && tabExp && listUp && listExp) {
        tabUp.addEventListener('click', () => {
            tabUp.classList.add('active'); tabExp.classList.remove('active');
            tabUp.style.color = 'var(--primary)'; tabUp.style.borderBottom = '3px solid var(--primary)';
            tabExp.style.color = 'var(--text-muted)'; tabExp.style.borderBottom = '3px solid transparent';
            listUp.style.display = 'block'; listExp.style.display = 'none';
        });

        tabExp.addEventListener('click', () => {
            tabExp.classList.add('active'); tabUp.classList.remove('active');
            tabExp.style.color = 'var(--primary)'; tabExp.style.borderBottom = '3px solid var(--primary)';
            tabUp.style.color = 'var(--text-muted)'; tabUp.style.borderBottom = '3px solid transparent';
            listExp.style.display = 'block'; listUp.style.display = 'none';
        });
    }
}
setupLiveTabs('910');
setupLiveTabs('1112');
setupLiveTabs('series');

// =========================================
// 11. WHATSAPP SUPPORT ENGINE
// ==========================================
const contactBtn = document.getElementById('menu-contact-btn');

if (contactBtn) {
    contactBtn.addEventListener('click', () => {
        toggleDrawer(); // Click karte hi pehle side menu smoothly band hoga
        
        // Tumhara Contact Number aur pre-filled automatic message
        const phoneNumber = "918822778233"; 
        const message = "Hello Sir, I need some help regarding the Premium Test Portal.";
        
        // Makkhan ki tarah naye tab mein WhatsApp open karega
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
}



// ==========================================
// 🌟 PREMIUM AUTO IMAGE SLIDER ENGINE
// ==========================================
function initPremiumSlider() {
    const track = document.getElementById('slider-track');
    const dotsContainer = document.getElementById('slider-dots');
    
    // Agar screen par slider nahi hai, toh kuch mat karo
    if (!track || !dotsContainer) return;

    const slides = track.querySelectorAll('.slide-img');
    if (slides.length === 0) return;

    let currentIndex = 0;
    const slideCount = slides.length;

    // 1. Automatically dots create karo jitni images hain
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.dot');

    // 2. Slide change karne ka main function
    function goToSlide(index) {
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
        currentIndex = index;
    }

    // 3. Har 3.5 seconds mein automatic agle slide par jao
    setInterval(() => {
        let nextIndex = (currentIndex + 1) % slideCount;
        goToSlide(nextIndex);
    }, 3500);
}

// App khulte hi slider engine ko start kar do
document.addEventListener('DOMContentLoaded', initPremiumSlider);

// ==========================================
// 💎 PREMIUM SCREEN ENGINE & PHASE 4 SETUP
// ==========================================
const closePremiumBtn = document.getElementById('close-premium-pkg-btn');
if (closePremiumBtn) {
    closePremiumBtn.addEventListener('click', () => {
        navigate('main-app-shell', false);
    });
}



// ==========================================
// 💳 PREMIUM RAZORPAY PAYMENT ENGINE (100% SECURE FOR BUNDLES)
// ==========================================
document.addEventListener('click', async (e) => {
    const buyBtn = e.target.closest('.premium-buy-btn');
    if (buyBtn) {
        // 🛡️ ANTI-SPAM LOCK: Agar pehle se processing chal rahi hai toh click ignore karo
        if (buyBtn.disabled) return;
        
        const bundleId = buyBtn.getAttribute('data-testid');

        if (!bundleId) {
            showCustomPopup("Error", "Invalid Bundle ID.", "danger");
            return;
        }

        // 🛡️ BUTTON LOCK: Click hote hi button ko disable karo aur text change karo
        buyBtn.disabled = true;
        const originalBtnHTML = buyBtn.innerHTML;
        buyBtn.innerHTML = `<span class="material-icons" style="font-size:16px; animation: spinGlow 1s linear infinite;">autorenew</span> Processing...`;
        buyBtn.style.opacity = "0.7";

        // 🛡️ SECURITY CHECK: Ensure Razorpay is loaded properly
        if (typeof Razorpay === 'undefined') {
            buyBtn.disabled = false; buyBtn.innerHTML = originalBtnHTML; buyBtn.style.opacity = "1"; // Unlock
            showCustomPopup("Connection Error", "Payment gateway is loading. Please check internet.", "warning");
            return;
        }

        showLoader("Generating Secure Bank Order...");
        try {
            const authToken = localStorage.getItem('auth_token');
            const orderRes = await fetch(API_URL, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "createOrder", username: loggedInUser, token: authToken, testId: bundleId }) 
            });

            const orderResult = JSON.parse(await orderRes.text());
            hideLoader();

            if (!orderResult.success) {
                buyBtn.disabled = false; buyBtn.innerHTML = originalBtnHTML; buyBtn.style.opacity = "1"; // Unlock
                showCustomPopup("Bank Error", orderResult.message || "Failed to connect with bank gateway.", "danger");
                return;
            }

            var options = {
                "key": "rzp_live_T4XNIDMRFQbzpL", 
                "amount": orderResult.amount * 100, 
                "currency": "INR",
                "name": "Test Portal",
                "description": "Purchase Test Bundle",
                "image": "./icon-512x512.png", 
                "order_id": orderResult.orderId,
                "handler": async function (response) {
                    showLoader("Verifying Payment & Unlocking Bundle...");
                    try {
                        const verifyRes = await fetch(API_URL, {
                            method: 'POST',
                            headers: { "Content-Type": "text/plain;charset=utf-8" },
                            body: JSON.stringify({ 
                                action: "savePayment", 
                                username: loggedInUser, 
                                token: authToken,
                                testId: bundleId,
                                paymentId: response.razorpay_payment_id,
                                amount: orderResult.amount 
                            })
                        });

                        const verifyResult = JSON.parse(await verifyRes.text());
                        hideLoader();
                        if (verifyResult.success) {
                            showCustomPopup("Payment Successful! 🎉", "Premium Test Bundle unlocked.", "success", () => {
                                loadDashboard(); 
                            });
                        } else {
                            buyBtn.disabled = false; buyBtn.innerHTML = originalBtnHTML; buyBtn.style.opacity = "1"; // Unlock
                            showCustomPopup("Verification Error", "Payment received but failed to unlock bundle.", "warning");
                        }
                    } catch (e) {
                        hideLoader();
                        buyBtn.disabled = false; buyBtn.innerHTML = originalBtnHTML; buyBtn.style.opacity = "1"; // Unlock
                        showCustomPopup("Network Error", "Verification timed out. Contact support.", "danger");
                    }
                },
                "prefill": { "email": loggedInUser },
                "theme": { "color": "#F59E0B" },
                "modal": {
                    "ondismiss": function() {
                        // 🛡️ MAGIC UNLOCK: Agar user payment cancel karke popup band kare toh button waapas zinda ho jaye
                        buyBtn.disabled = false; 
                        buyBtn.innerHTML = originalBtnHTML; 
                        buyBtn.style.opacity = "1";
                    }
                }
            };

            var rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response){
                buyBtn.disabled = false; buyBtn.innerHTML = originalBtnHTML; buyBtn.style.opacity = "1"; // Unlock
                showCustomPopup("Payment Failed ❌", `Transaction declined: ${response.error.description}`, "danger");
            });
            rzp1.open();

        } catch (error) {
            hideLoader();
            buyBtn.disabled = false; buyBtn.innerHTML = originalBtnHTML; buyBtn.style.opacity = "1"; // Unlock
            showCustomPopup("Network Error", "Could not connect to secure payment server.", "danger");
        }
    }
});

// ==========================================
// 📂 PREMIUM SERIES FOLDER ENGINE (DYNAMIC FETCH)
// ==========================================
document.addEventListener('click', async (e) => {
    const openBtn = e.target.closest('.premium-open-series-btn');
    if (openBtn) {
        const seriesTitle = openBtn.getAttribute('data-title');
        const bundleId = openBtn.getAttribute('data-series'); 
        
        // 🛡️ NAYA FIX: Native UI Tab switch (Title aur nav bar maintain rahega)
        const upList = document.getElementById('upcoming-live-list-series');
        const expList = document.getElementById('expired-live-list-series');
        
        upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--primary);"><span class="material-icons" style="font-size: 30px; animation: spinGlow 1s linear infinite;">autorenew</span><br><b style="display:block; margin-top:10px;">Fetching Mock Tests...</b></div>`;
        expList.innerHTML = "";

        switchTab('series-inside-tab', seriesTitle); // Yeh app ka title bar automatically update kar dega

        try {
            const authToken = localStorage.getItem('auth_token');
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "getBundleTests", username: loggedInUser, token: authToken, bundleId: bundleId })
            });

            const data = JSON.parse(await res.text());

            if (data.success && data.bundleTests.length > 0) {
                upList.innerHTML = ""; // Clear loader
                expList.innerHTML = "";
                
                let upCount = 0, expCount = 0;

                const formatShortDate = (isoString) => {
                    if (!isoString) return 'TBA';
                    return new Date(isoString).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                };

                data.bundleTests.forEach(test => {
                    const isCompleted = test.status === "completed";
                    const testDuration = parseInt(test.duration) || 60;
                    
                    const now = getSecureTime(); 
                    const startTime = test.startTime ? new Date(test.startTime).getTime() : 0;
                    const endTime = test.endTime ? new Date(test.endTime).getTime() : Infinity;
                    const isExpired = now > endTime;
                    
                    let statusBadge = "";
                    let actionBtn = "";
                    
                    // Button Logic & Tagging
                    if (isCompleted) {
                        statusBadge = `<span style="color:var(--success); font-size:11px; font-weight:bold;">✅ ATTEMPTED</span>`;
                        actionBtn = `<button class="btn-secondary test-action-btn" data-test="${test.testId}" data-completed="true" style="width:100%;">View Analysis</button>`;
                        testHistoryData[test.testId] = { score: test.score, total: test.total }; 
                    } else if (now < startTime) {
                        statusBadge = `<span style="color:var(--warning); font-size:11px; font-weight:bold;">⏳ UPCOMING</span>`;
                        actionBtn = `<button class="btn-primary" disabled style="width:100%; opacity:0.5; background:var(--primary);">Starts ${new Date(startTime).toLocaleDateString()}</button>`;
                    } else if (isExpired) {
                        statusBadge = `<span style="color:var(--danger); font-size:11px; font-weight:bold;">🔴 MISSED</span>`;
                        actionBtn = `<button class="btn-secondary" disabled style="width:100%; opacity:0.5;">Expired</button>`;
                    } else {
                        statusBadge = `<span style="color:var(--success); font-size:11px; font-weight:bold;">🟢 LIVE NOW</span>`;
                        actionBtn = `<button class="btn-primary test-action-btn" data-test="${test.testId}" data-duration="${testDuration}" data-type="live" style="width:100%; background:var(--danger); color:white; border:none; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);">Start Premium Test</button>`;
                    }

                    const cardHTML = `
                        <div class="premium-test-card live-test-card" style="border: 1.5px solid #FCD34D; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);">
                            <div class="ptc-header" style="flex-wrap: wrap; gap: 8px;">
                                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                                    <span class="ptc-subject" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; border: none; box-shadow: 0 2px 6px rgba(245,158,11,0.3);">
                                        <span class="material-icons" style="font-size: 12px; vertical-align: middle; margin-right: 2px;">workspace_premium</span>PREMIUM
                                    </span>
                                    <span class="ptc-subject" style="background: rgba(245, 158, 11, 0.1); color: #D97706; border: 1px solid rgba(245,158,11,0.2);">${test.subject}</span>
                                    <span class="ptc-class">Class ${test.classLvl}</span>
                                </div>
                                ${statusBadge}
                            </div>
                            <h4 class="ptc-title">${test.title}</h4>
                            <div class="ptc-details">
                                <p><span class="material-icons">menu_book</span> <strong>Syllabus:</strong> ${test.syllabus}</p>
                                <p><span class="material-icons">schedule</span> <strong>Duration:</strong> ${testDuration} Mins</p>
                                <div class="ptc-timings">
                                    <div class="time-block">
                                        <span class="material-icons" style="color:var(--success)">event_available</span>
                                        <div><small>Starts</small><br><b>${formatShortDate(test.startTime)}</b></div>
                                    </div>
                                    <div class="time-block">
                                        <span class="material-icons" style="color:var(--danger)">event_busy</span>
                                        <div><small>Ends</small><br><b>${formatShortDate(test.endTime)}</b></div>
                                    </div>
                                </div>
                            </div>
                            <div class="ptc-footer">
                                ${actionBtn}
                            </div>
                        </div>
                    `;

                    // Sort logic: Expired tests go to the expired list, everything else stays in upcoming
                    if (isExpired && !isCompleted) {
                        expList.insertAdjacentHTML('beforeend', cardHTML);
                        expCount++;
                    } else {
                        upList.insertAdjacentHTML('beforeend', cardHTML);
                        upCount++;
                    }
                });

                if (upCount === 0) upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">No upcoming or active tests here.</div>`;
                if (expCount === 0) expList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">No expired tests in this series.</div>`;

            } else {
                upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">No mock tests have been uploaded in this series yet.</div>`;
            }
        } catch (err) {
            upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--danger);">Failed to connect to server.</div>`;
        }
    }
});
