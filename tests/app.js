// ==========================================
// API CONFIGURATION
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbzKok_fpRnnp7Z99LkYKoyOE3yt3KLow3tiA9MQeDL5y_TY3eLfiOnNp7APmU58dxY43g/exec";

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

const optionPrefixes = ['(a) ', '(b) ', '(c) ', '(d) '];

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

// Bottom Navigation Tab Routing
function switchTab(tabId, headerTitle) {
    // Hide all tabs
    document.querySelectorAll('.tab-view').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    // Remove active state from all nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show target tab
    const targetTab = document.getElementById(tabId);
    targetTab.style.display = 'flex';
    // Small delay to trigger CSS animations if any
    setTimeout(() => targetTab.classList.add('active'), 10);

    // Update Bottom Nav UI
    const baseId = tabId.split('-')[0]; // "home", "results", "profile"
    document.getElementById(`tab-btn-${baseId}`).classList.add('active');

    // Update Header
    document.getElementById('app-bar-title').innerText = headerTitle;
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

document.getElementById('menu-notes-btn').addEventListener('click', () => {
    switchTab('home-tab', 'Home Dashboard'); 
    const notesBtn = document.getElementById('grid-action-notes');
    if(notesBtn) notesBtn.click(); // Safe query to prevent initialization errors
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

    // Sabko pehle hide karo (Naye 4 containers)
    const wrappers = ['practice-tests-910-wrapper', 'pdf-notes-910-wrapper', 'practice-tests-1112-wrapper', 'pdf-notes-1112-wrapper'];
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
document.getElementById('grid-action-live-1112')?.addEventListener('click', () => {
    handleGridSwitch('grid-action-live-1112', null); 
    switchTab('live-tests-tab-1112', 'Live Tests (XI & XII)');
});

document.getElementById('grid-action-practice-910')?.addEventListener('click', () => handleGridSwitch('grid-action-practice-910', 'practice-tests-910-wrapper'));
document.getElementById('grid-action-practice-1112')?.addEventListener('click', () => handleGridSwitch('grid-action-practice-1112', 'practice-tests-1112-wrapper'));

document.getElementById('grid-action-notes-910')?.addEventListener('click', () => handleGridSwitch('grid-action-notes-910', 'pdf-notes-910-wrapper'));
document.getElementById('grid-action-notes-1112')?.addEventListener('click', () => handleGridSwitch('grid-action-notes-1112', 'pdf-notes-1112-wrapper'));

// ==========================================
// 2. CORE SPA ROUTING (FULL SCREENS)
// ==========================================
function navigate(screenId, pushToHistory = true) {
    // 1. Hide all screens completely
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; 
    });
    
    // 2. Safely un-hide ONLY the target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.style.display = 'flex'; // FIX: Ye line ensure karegi ki target screen hamesha visible ho!
        setTimeout(() => targetScreen.classList.add('active'), 10);
    }

    // 3. Update Browser History
    if (pushToHistory) {
        history.pushState({ screen: screenId }, "", `#${screenId}`);
    }
}

window.addEventListener('popstate', (e) => {
    const activeScreen = document.querySelector('.screen.active');
    
    // 1. Agar Live Test ke beech mein back dabaya
    if (activeScreen && activeScreen.id === 'test-screen' && isTestActive) {
        history.pushState({ screen: 'test-screen' }, "", `#test-screen`);
        showCustomPopup("Blocked", "Back disabled in <strong style='color: var(--danger);'>LIVE</strong> tests. Please submit.", "danger");
        return;
    }

    // 2. Identify the target screen (kahan jaa raha hai)
    let targetScreen = e.state && e.state.screen ? e.state.screen : (loggedInUser ? 'main-app-shell' : 'login-screen');

    // 3. ✅ THE FIX: Agar piche aakar wapas Dashboard par jaa raha hai, toh data refresh karo
    if (targetScreen === 'main-app-shell' && loggedInUser) {
        navigate('main-app-shell', false);
        loadDashboard(); // 🔥 Server se naya result sync karega aur buttons lock kar dega
        return;
    }

    // 4. Test khatam hone ke baad wala normal case
    if (targetScreen === 'test-screen' && !isTestActive) {
        history.replaceState({ screen: 'main-app-shell' }, "", "#main-app-shell");
        navigate('main-app-shell', false);
        loadDashboard(); 
        return;
    }

    // Default Fallback
    navigate(targetScreen, false);
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

    newConfirmBtn.addEventListener('click', () => {
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
    if (cachedUser) {
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
            loggedInUserName = "Admin";
            localStorage.setItem('student_username', loggedInUser);
            localStorage.setItem('student_name', loggedInUserName);
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
// 🚀 NAYA: PREMIUM GOOGLE LOGIN ENGINE
// ==========================================
const googleLoginBtn = document.getElementById('google-login-btn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        showLoader("Connecting to Google Securely...");
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            loggedInUser = user.email; 
            loggedInUserName = user.displayName || user.email.split('@')[0]; 
            
            localStorage.setItem('student_username', loggedInUser);
            localStorage.setItem('student_name', loggedInUserName);
            updateProfileUI();
            loadDashboard();
            triggerSmartPushPrompt(); 
            
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
    showCustomPopup("Secure Logout", "Are you sure you want to end your session?", "warning", () => {
        loggedInUser = "";
        localStorage.removeItem('student_username');
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
    
    // 🛑 SABSE BADI FIX: Saare naye containers ko variables mein exactly bind kiya
    const practiceList910 = document.getElementById('practice-list-910');
    const practiceList1112 = document.getElementById('practice-list-1112');
    const pastResultsContainer = document.getElementById('past-results-list');
    
    const upcoming910 = document.getElementById('upcoming-live-list-910');
    const expired910 = document.getElementById('expired-live-list-910');
    const upcoming1112 = document.getElementById('upcoming-live-list-1112');
    const expired1112 = document.getElementById('expired-live-list-1112');

    showLoader("Syncing Live Portal...");
    clearInterval(dashboardTimerInterval); 

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getDashboard", username: loggedInUser })
        });
        const result = JSON.parse(await response.text());

        if (result.success) {
            // 🧹 MAGIC CLEANER: Purane duplicate test cards ko screen se hamesha ke liye saaf karega
            [practiceList910, practiceList1112, pastResultsContainer, upcoming910, expired910, upcoming1112, expired1112].forEach(el => {
                if(el) el.innerHTML = "";
            });
            
            testHistoryData = result.history || {}; 

            let practiceCount910 = 0, practiceCount1112 = 0, completedCount = 0;
            let upCount910 = 0, expCount910 = 0, upCount1112 = 0, expCount1112 = 0;
            const nowMs = Date.now();

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

            // --- RENDER LIVE TESTS ---
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

                    // 🛡️ STRICT ROUTING: Agar test senior ka hai, toh sirf 11/12 mein jayega
                    if (isSenior) {
                        if (isExpired) { expCount1112++; if(expired1112) expired1112.insertAdjacentHTML('beforeend', cardHTML); }
                        else { upCount1112++; if(upcoming1112) upcoming1112.insertAdjacentHTML('beforeend', cardHTML); }
                    } else {
                        if (isExpired) { expCount910++; if(expired910) expired910.insertAdjacentHTML('beforeend', cardHTML); }
                        else { upCount910++; if(upcoming910) upcoming910.insertAdjacentHTML('beforeend', cardHTML); }
                    }
                }
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
        const now = Date.now();
        document.querySelectorAll('.live-test-card').forEach(card => {
            const startTime = new Date(card.getAttribute('data-start')).getTime();
            const endTime = new Date(card.getAttribute('data-end')).getTime();
            
            const badge = card.querySelector('.live-status-badge');
            const timeText = card.querySelector('.live-timing-text');
            const btn = card.querySelector('.test-action-btn');

            if (now < startTime) {
                badge.innerHTML = `<span style="color:var(--warning); font-size:11px; font-weight:bold;">⏳ UPCOMING</span>`;
                timeText.innerHTML = `Starts: <strong>${new Date(startTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</strong>`;
                btn.innerText = "🔒 Inactive";
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.style.padding = "12px 24px";
            } 
            else if (now >= startTime && now <= endTime) {
                badge.innerHTML = `<span style="color:var(--success); font-size:11px; font-weight:bold;">🛑 LIVE NOW</span>`;
                const diffMs = endTime - now;
                const hrs = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                timeText.innerHTML = `<span style="color:var(--danger); font-weight:600;">Closes in: ${hrs}h ${mins}m</span>`;
                
                btn.innerText = "Start Live Test";
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.backgroundColor = "var(--danger)"; // Striking Red for Live
                btn.style.padding = "12px 24px";
                btn.style.color = "white";
            } 
            else {
                badge.innerHTML = `<span style="color:var(--danger); font-size:11px; font-weight:bold;">🔴 CLOSED</span>`;
                timeText.innerText = `Missed: ${new Date(endTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}`;
                btn.innerText = "Expired";
                btn.disabled = true;
                btn.style.opacity = "0.3";
                btn.style.backgroundColor = "transparent";
                btn.style.padding = "12px 24px";
                btn.style.color = "var(--text-muted)";
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
                
                if (testType === 'live') {
                    const start = new Date(testCard.getAttribute('data-start')).getTime();
                    const end = new Date(testCard.getAttribute('data-end')).getTime();
                    const now = Date.now();
                    
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
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({ action: "fetchTest", testName: testId })
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
            navigate('test-screen'); 
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
    testEndTime = Date.now() + (seconds * 1000);
    
    function checkTime() {
        const now = Date.now();
        timeRemaining = Math.max(0, Math.round((testEndTime - now) / 1000));
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            showCustomPopup("Time's Up!", "Auto-submitting your test.", "warning", processSubmission, false);
        }
    }
    
    checkTime(); 
    timerInterval = setInterval(checkTime, 1000);
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
// 7. ANALYSIS & RESULTS SCREEN
// ==========================================
async function processSubmission() {
    if (!isTestActive) return; 
    isTestActive = false; 

    clearInterval(timerInterval);
    showLoader("Grading your test & Calculating Rank...");

    const timeTaken = totalTestSeconds - timeRemaining;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            // Payload mein timeTaken add kar diya
            body: JSON.stringify({ action: "submitTest", username: loggedInUser, testName: activeTestName, answers: userAnswers, timeTaken: timeTaken })
        });
        const result = JSON.parse(await response.text());

        if (result.success) {
            history.replaceState({ screen: 'analysis-screen' }, "", "#analysis-screen");
            hideLoader();
            showCustomPopup("Submitted!", "Results processed successfully.", "success", () => {
                displayDeepAnalysis(result.score, result.total, result.percentage, result.analysis, false);
            });
        } else {
            throw new Error("Grading failed");
        }
    } catch (e) {
        hideLoader();
        isTestActive = false; 
        showCustomPopup("Error", "Network issue. Returning to dashboard.", "danger", () => loadDashboard());
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

    navigate('analysis-screen', pushToHistory);
}

document.getElementById('close-analysis-btn').addEventListener('click', () => {
    loadDashboard();
});



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

// ✅ UPDATE: Close karne par wapas smoothly Analysis Screen par jayega
document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
    navigate('analysis-screen', false); 
});

async function fetchAndRenderLeaderboard(testId) {
    const listContainer = document.getElementById('leaderboard-list');
    
    // ✅ UPDATE: Puraane display:flex ki jagah proper App Navigation use kiya
    navigate('leaderboard-screen', false);
    
    document.getElementById('leaderboard-test-name').innerText = testId.replace(/_/g, ' ').toUpperCase();
    
    // Premium loading animation
    listContainer.innerHTML = `<div style="text-align:center; padding: 40px;"><span class="material-icons" style="font-size:40px; color:var(--primary); animation: waveMotion 1.5s infinite;">emoji_events</span><p style="margin-top:10px; font-weight:600;">Fetching All India Ranks...</p></div>`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getLeaderboard", testName: testId })
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
