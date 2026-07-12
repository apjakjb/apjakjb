// ==========================================
// API CONFIGURATION
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbxtoIwhwq4uQhbMvf0ItJXU4WaHYFYsQFGt_J1WCTZCHRLtfo3-jRIjQYxKDHVnTJxK0g/exec";

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
let serverTimeOffset = 0; 
let isPostExamRestricted = false; 
let globalLiveTests910 = [];
let currentLeaderboardData = []; // 🛡️ NAYA: Data for Share Image 
let currentSubjectClassLvl = '9'; 
let globalLiveTests1112 = []; // 🛡️ NAYA: Storage for XI/XII Subject filtering
let currentSubjectClassLvl1112 = '11'; // 🛡️ NAYA: Default tab for XI/XII

const optionPrefixes = ['(a) ', '(b) ', '(c) ', '(d) '];



// ==========================================
// 🚀 GLOBAL UTILITY FUNCTIONS (OPTIMIZED)
// ==========================================
const formatShortDate = (isoString) => {
    if (!isoString) return 'TBA';
    return new Date(isoString).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatOnlyDate = (isoString) => {
    if(!isoString) return 'TBA';
    return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const emptyMsg = (msg) => `<div style="text-align:center; color:var(--text-muted); padding: 30px;">${msg}</div>`;

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

// 🛡️ NAYA: Theme UI Sync Engine
// 🚀 IIT EXPERT FIX: Complete Dual-Screen Theme Sync Engine (No Loophole)
function updateThemeUI(isDark) {
    // 1. Side Navigation Menu Update
    const drawerIcon = document.getElementById('drawer-theme-icon');
    const drawerText = document.getElementById('drawer-theme-text');
    if (drawerIcon && drawerText) {
        drawerIcon.innerText = isDark ? 'light_mode' : 'dark_mode';
        drawerText.innerText = isDark ? 'Light Theme' : 'Dark Theme';
    }
    
    // 2. Profile Screen Interface Row Update
    const profileIcon = document.getElementById('profile-theme-icon');
    const profileLabel = document.getElementById('profile-theme-label');
    const profileDesc = document.getElementById('profile-theme-desc');
    if (profileIcon && profileLabel && profileDesc) {
        profileIcon.innerText = isDark ? 'light_mode' : 'nights_stay';
        profileLabel.innerText = isDark ? 'Light Interface' : 'Dark Interface';
        profileDesc.innerText = isDark ? 'Toggle Day Mode look' : 'Toggle Night Mode look';
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('premium_portal_theme', 'light');
        updateThemeUI(false);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('premium_portal_theme', 'dark');
        updateThemeUI(true);
    }
}

// Ensure UI Syncs when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem('premium_portal_theme');
    updateThemeUI(savedTheme === 'dark');
});

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

document.getElementById('menu-toggle-btn').addEventListener('click', () => {
    // 🛡️ THE FIX: Test chalte waqt side menu bar kholna bhi strictly ban hai!
    if (isTestActive) {
        showCustomPopup(
            "Menu Locked 🔒", 
            "Side drawer menu is disabled during the exam. Please focus entirely on your question paper.", 
            "danger"
        );
        return;
    }
    toggleDrawer();
});
drawerOverlay.addEventListener('click', toggleDrawer);

// 🛡️ NAYA: Native Swipe-to-Close Engine (Bulletproof)
let touchStartX = 0;
let touchStartY = 0;

drawer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

drawer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = Math.abs(touchEndY - touchStartY);
    
    // EXPERT LOGIC: Agar swipe Left side (-50px) gaya hai AUR vertical scroll (Y-axis) 50px se kam hai, tabhi menu band karo!
    if (swipeDistanceX < -50 && swipeDistanceY < 50) {
        if (drawer.classList.contains('open')) {
            toggleDrawer();
        }
    }
}, { passive: true });


function switchTab(tabId, headerTitle, pushToHistory = true) {
    // 🛡️ BUG FIX: Live test ke dauran bakwaas tabs block karo, lekin 'test-tab' ko permission do
    if (isTestActive && tabId !== 'test-tab') {
        showCustomPopup(
            "Exam in Progress 🚫", 
            "Navigation is strictly locked during a live exam. You cannot leave this screen without submitting your test.", 
            "danger"
        );
        return;
    }

    // 🛡️ SMART IMMERSIVE UI: Nav bars control logic
    const appHeader = document.querySelector('.app-header');
    const appBottomNav = document.querySelector('.app-bottom-nav');
    
    let hideNav = false;
    if (tabId === 'test-tab') {
        hideNav = true; // Test ke dauran hamesha hide rahega
    } else if ((tabId === 'analysis-tab' || tabId === 'leaderboard-tab') && isPostExamRestricted) {
        // 🛡️ Agar test submit karne ke turant baad aaye hain, toh bhi hide rakho
        hideNav = true;
    } else {
        // Agar relax mode mein Home, Profile ya Results par gaye, toh strict mode band kar do
        isPostExamRestricted = false; 
        hideNav = false;
    }

    if (hideNav) {
        if (appHeader) appHeader.style.display = 'none';
        if (appBottomNav) appBottomNav.style.display = 'none';
    } else {
        if (appHeader) appHeader.style.display = 'flex';
        if (appBottomNav) appBottomNav.style.display = 'flex';
    }

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


document.getElementById('grid-action-live-910')?.addEventListener('click', () => {
    handleGridSwitch('grid-action-live-910', null); 
    switchTab('subject-selection-tab-910', 'Select Class & Subject');
});

// 🛡️ NAYA FIX: Subject Selection Routing for Class 11 & 12
document.getElementById('grid-action-live-1112')?.addEventListener('click', () => {
    handleGridSwitch('grid-action-live-1112', null); 
    switchTab('subject-selection-tab-1112', 'Select Class & Subject');
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

    // 🛡️ SMART REFRESH ENGINE: Test submit hone ke baad jab student exit karega, portal completely fresh data ke sath sync hoga
    if (isPostExamRestricted && state && state.tab !== 'analysis-tab' && state.tab !== 'leaderboard-tab') {
        isPostExamRestricted = false;
        loadDashboard(); // Yeh server se latest result pull karke, live test ko permanently 'Attempted' kar dega aur Home par le aayega
        return;
    }
    
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
// 4. AUTHENTICATION & PWA POPUP-HACK ENGINE (FINAL BULLETPROOF)
// ==========================================

let isGoogleLoginProcessing = false;
let visibilityTimeout = null;

// 🚀 MASTER ENGINE: Sync Google User to APJAKJB Server Guaranteed
async function syncGoogleUserWithBackend(user) {
    if (sessionStorage.getItem('google_sync_in_progress') === 'true') return;
    sessionStorage.setItem('google_sync_in_progress', 'true');
    
    // 🛡️ Lock the fallback timer immediately so it doesn't kill our loader
    isGoogleLoginProcessing = false;
    if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = null;
    }

    showLoader("Syncing with APJAKJB Server...");
    try {
        const email = user.email;
        const name = user.displayName || email.split('@')[0];
        const authToken = localStorage.getItem('auth_token');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "googleLogin", email: email, name: name })
        });
        
        const backendResult = JSON.parse(await response.text());

        if (backendResult.success) {
            loggedInUser = email;
            loggedInUserName = name;
            
            localStorage.setItem('student_username', loggedInUser);
            localStorage.setItem('student_name', loggedInUserName);
            localStorage.setItem('auth_token', backendResult.token); 
            localStorage.setItem('auth_time', Date.now().toString());    

            updateProfileUI();
            document.getElementById('error-message').innerText = ""; 
            loadDashboard();
            triggerSmartPushPrompt(); 
            setTimeout(showPremiumWelcomeAd, 1500);
        } else {
            showCustomPopup("Access Denied", backendResult.message, "danger");
            if(auth) auth.signOut();
            navigate('login-screen');
        }
    } catch (error) {
        console.error("Server Sync Error:", error);
        showCustomPopup("Network Drop", "Sync interrupted. Please check your connection and tap Login again.", "warning");
        navigate('login-screen');
    } finally {
        sessionStorage.removeItem('google_sync_in_progress');
        hideLoader(); 
    }
}

function checkAuthSession() {
    const cachedUser = localStorage.getItem('student_username');
    const cachedName = localStorage.getItem('student_name');
    const cachedToken = localStorage.getItem('auth_token');
    const authTimestamp = localStorage.getItem('auth_time'); 

    const isTokenExpired = authTimestamp && (Date.now() - parseInt(authTimestamp) > 24 * 60 * 60 * 1000);

    if (cachedUser && cachedToken && !isTokenExpired) {
        loggedInUser = cachedUser;
        loggedInUserName = cachedName || cachedUser.split('@')[0]; 
        updateProfileUI();
        history.replaceState({ screen: 'main-app-shell' }, "", "#main-app-shell");
        loadDashboard(); 
        triggerSmartPushPrompt();
        setTimeout(showPremiumWelcomeAd, 1500); 
    } else {
        localStorage.removeItem('student_username');
        localStorage.removeItem('student_name');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_time');
        
        history.replaceState({ screen: 'login-screen' }, "", "#login-screen");
        navigate('login-screen', false);
    }
}

document.addEventListener("DOMContentLoaded", checkAuthSession);

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const hasLocalToken = localStorage.getItem('auth_token') !== null;
        const authTimestamp = localStorage.getItem('auth_time'); 
        const isTokenExpired = authTimestamp && (Date.now() - parseInt(authTimestamp) > 24 * 60 * 60 * 1000);
        
        if (!hasLocalToken || isTokenExpired || isGoogleLoginProcessing) {
            await syncGoogleUserWithBackend(user);
        }
    }
});

function updateProfileUI() {
    document.getElementById('welcome-text').innerText = `Hello Dear, ${loggedInUserName}`;
    document.getElementById('drawer-username').innerText = loggedInUserName;
    document.getElementById('profile-student-name').innerText = loggedInUserName;
    document.getElementById('profile-meta-username').innerText = loggedInUser;
    
    if (loggedInUserName) {
        const cleanName = loggedInUserName.replace(/[^a-zA-Z0-9]/g, '');
        const firstLetter = cleanName.length > 0 ? cleanName.charAt(0).toUpperCase() : 'U';
        
        const avatarLetterDrawer = document.getElementById('drawer-avatar-letter');
        if (avatarLetterDrawer) avatarLetterDrawer.innerText = firstLetter;
        
        const avatarLetterProfile = document.getElementById('profile-avatar-letter');
        if (avatarLetterProfile) avatarLetterProfile.innerText = firstLetter;
    }
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
            localStorage.setItem('auth_time', Date.now().toString()); 
            
            updateProfileUI();
            document.getElementById('login-form').reset();
            errorMsg.innerText = "";
            loadDashboard();
            triggerSmartPushPrompt(); 
            setTimeout(showPremiumWelcomeAd, 1500);
        } else {
            errorMsg.innerText = result.message;
        }
    } catch (error) {
        errorMsg.innerText = "Network connection failed. Please try again.";
    } finally {
        hideLoader();
    }
});

const googleLoginBtn = document.getElementById('google-login-btn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        if (googleLoginBtn.disabled) return;
        googleLoginBtn.disabled = true;
        
        const originalBtnHTML = googleLoginBtn.innerHTML;
        googleLoginBtn.innerHTML = `<span class="material-icons" style="font-size:16px; animation: spinGlow 1s linear infinite;">autorenew</span> Connecting Securely...`;
        googleLoginBtn.style.opacity = "0.7";
        
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        
        isGoogleLoginProcessing = true;
        showLoader("Opening Secure Gateway...");
        
        auth.signInWithPopup(provider).then((result) => {
            console.log("Popup resolved natively.");
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = originalBtnHTML;
            googleLoginBtn.style.opacity = "1";
        }).catch((error) => {
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                console.log("PWA WebView Detached. Waiting for background login...");
                
                const loaderText = document.getElementById('loader-text');
                if(loaderText) loaderText.innerText = "Finishing Login... Please wait.";

                const startSafetyTimer = () => {
                    visibilityTimeout = setTimeout(() => {
                        if (isGoogleLoginProcessing && sessionStorage.getItem('google_sync_in_progress') !== 'true') {
                            hideLoader();
                            isGoogleLoginProcessing = false;
                            googleLoginBtn.disabled = false;
                            googleLoginBtn.innerHTML = originalBtnHTML;
                            googleLoginBtn.style.opacity = "1";
                        }
                    }, 5000); 
                };

                // 🛡️ HACKER FIX: Agar screen pehle se hi visible hai, toh sidha timer chalao
                if (document.visibilityState === 'hidden') {
                    const checkAppFocus = () => {
                        if (document.visibilityState === 'visible') {
                            document.removeEventListener('visibilitychange', checkAppFocus);
                            startSafetyTimer();
                        }
                    };
                    document.addEventListener('visibilitychange', checkAppFocus);
                } else {
                    startSafetyTimer();
                }

            } else {
                hideLoader();
                isGoogleLoginProcessing = false;
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = originalBtnHTML;
                googleLoginBtn.style.opacity = "1";
                showCustomPopup("Connection Failed", "Error: " + error.message, "danger");
            }
        });
    });
}

function handleLogout() {
    showCustomPopup("Secure Logout", "Are you sure you want to end your session?", "warning", async () => {
        showLoader("Destroying Secure Session...");
        
        try {
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
        localStorage.removeItem('auth_time');
        
        if(auth) auth.signOut();
        if(drawer.classList.contains('open')) toggleDrawer();
        navigate('login-screen');
    }, true);
}

function forceSilentLogout() {
    loggedInUser = "";
    localStorage.removeItem('student_username');
    localStorage.removeItem('student_name');
    localStorage.removeItem('auth_token'); 
    localStorage.removeItem('auth_time');
    
    if(auth) auth.signOut();
    navigate('login-screen');
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

            [practiceList910, practiceList1112, pastResultsContainer, upcoming910, expired910, upcoming1112, expired1112, premiumTestList].forEach(el => {
                if(el) el.innerHTML = "";
            });
            
            // 🛡️ NAYA FIX (Anti-Memory Leak): Puraane active tests ko array se permanently delete karo
            globalLiveTests910 = []; 
            globalLiveTests1112 = [];
            
            testHistoryData = result.history || {}; 

            let practiceCount910 = 0, practiceCount1112 = 0, completedCount = 0;
            const nowMs = getSecureTime(); // 🛡️ SECURE TIME USED HERE

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
                        globalLiveTests1112.push({ rawData: test, html: cardHTML, isExpired: isExpired });
                    } else {
                        globalLiveTests910.push({ rawData: test, html: cardHTML, isExpired: isExpired });
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
                                    <small>TEST & MOCKS</small>
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
                                Explore Details
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

            if (practiceCount910 === 0 && practiceList910) practiceList910.innerHTML = emptyMsg("No practice tests for IX & X.");
            if (practiceCount1112 === 0 && practiceList1112) practiceList1112.innerHTML = emptyMsg("No practice tests for XI & XII.");
            if (completedCount === 0 && pastResultsContainer) pastResultsContainer.innerHTML = emptyMsg("You haven't attempted any tests yet.");

            attachTestCardListeners();
            startDashboardLiveEngine(); 
        } else {
            // 🛡️ ANTI-HIJACK: Agar token galat hai toh turant logout karo
            if (result.message.includes("Unauthorized") || result.message.includes("Security Alert")) {
                showCustomPopup("Session Expired 🔒", "Your secure session has expired or is invalid. Please log in again.", "warning", () => {
                    forceSilentLogout();
                });
            } else {
                showCustomPopup("Error", result.message, "danger");
            }
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
function updateLiveCards() {
    const now = getSecureTime(); 
    document.querySelectorAll('.live-test-card').forEach(card => {
        const startTime = new Date(card.getAttribute('data-start')).getTime();
        const endTime = new Date(card.getAttribute('data-end')).getTime();
        
        const badge = card.querySelector('.live-status-badge');
        const timeText = card.querySelector('.live-timing-text');
        const btn = card.querySelector('.test-action-btn');
        if(!badge || !timeText || !btn) return;

        const isPremium = card.getAttribute('data-premium') === "true";
        const isBought = card.getAttribute('data-bought') === "true";
        const offerPrice = card.getAttribute('data-newprice');

        if (now > endTime) {
            badge.innerHTML = `<span style="color:var(--danger); font-size:11px; font-weight:bold;">🔴 CLOSED</span>`;
            timeText.innerText = `Missed: ${new Date(endTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}`;
            btn.innerText = "Expired";
            btn.disabled = true;
            btn.style.opacity = "0.3";
            btn.style.backgroundColor = "transparent";
            btn.style.color = "var(--text-muted)";
        } 
        else { 
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
            
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.padding = "12px 24px";
            
            if (isPremium && !isBought) {
                btn.innerHTML = `Buy Test - ₹${offerPrice} <span class="material-icons" style="font-size:16px;">shopping_cart</span>`;
                btn.style.backgroundColor = "#F59E0B"; 
                btn.style.color = "white";
            } else {
                if (now < startTime) {
                    btn.innerText = isPremium && isBought ? "Purchased (Wait to start)" : "🔒 Inactive";
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                    btn.style.backgroundColor = "var(--primary)";
                } else {
                    btn.innerText = isPremium && isBought ? "Open Premium Test" : "Start Live Test";
                    btn.style.backgroundColor = "var(--danger)"; 
                    btn.style.color = "white";
                }
            }
        }
    });
}

function startDashboardLiveEngine() {
    updateLiveCards(); 
    dashboardTimerInterval = setInterval(updateLiveCards, 30000); 
}

// ==========================================
// 🛡️ NAYA: IX & X SUBJECT FILTER ENGINE 
// ==========================================
const tabClass9 = document.getElementById('tab-class-9');
const tabClass10 = document.getElementById('tab-class-10');

const indicatorTextClass = document.getElementById('indicator-text-class');

if(tabClass9 && tabClass10) {
    tabClass9.addEventListener('click', () => {
        currentSubjectClassLvl = '9';
        // Active Styling for Pill
        tabClass9.style.background = 'var(--card-bg)';
        tabClass9.style.color = 'var(--primary)';
        tabClass9.style.fontWeight = '700';
        tabClass9.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        tabClass9.innerHTML = '🎯 Class IX';
        
        // Inactive Styling for Pill
        tabClass10.style.background = 'transparent';
        tabClass10.style.color = 'var(--text-muted)';
        tabClass10.style.fontWeight = '600';
        tabClass10.style.boxShadow = 'none';
        tabClass10.innerHTML = 'Class X';

        // Update Smart Banner
        if(indicatorTextClass) indicatorTextClass.innerText = 'Class IX';
    });

    tabClass10.addEventListener('click', () => {
        currentSubjectClassLvl = '10';
        // Active Styling for Pill
        tabClass10.style.background = 'var(--card-bg)';
        tabClass10.style.color = 'var(--primary)';
        tabClass10.style.fontWeight = '700';
        tabClass10.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        tabClass10.innerHTML = '🎯 Class X';
        
        // Inactive Styling for Pill
        tabClass9.style.background = 'transparent';
        tabClass9.style.color = 'var(--text-muted)';
        tabClass9.style.fontWeight = '600';
        tabClass9.style.boxShadow = 'none';
        tabClass9.innerHTML = 'Class IX';

        // Update Smart Banner
        if(indicatorTextClass) indicatorTextClass.innerText = 'Class X';
    });
}

document.querySelectorAll('.subject-card').forEach(card => {
    card.addEventListener('click', () => {
        const subject = card.getAttribute('data-subject');
        openFilteredLiveTests(currentSubjectClassLvl, subject);
    });
});

function openFilteredLiveTests(classLvl, subject) {
    const upcoming910 = document.getElementById('upcoming-live-list-910');
    const expired910 = document.getElementById('expired-live-list-910');
    
    upcoming910.innerHTML = "";
    expired910.innerHTML = "";

    let upCount = 0;
    let expCount = 0;

    globalLiveTests910.forEach(item => {
        const testClass = String(item.rawData.classLvl).toUpperCase();
        let isClassMatch = false;
        
        // Accurate routing based on exact class matching
        if (classLvl === '9' && (testClass.includes('9') || testClass.includes('IX'))) isClassMatch = true;
        if (classLvl === '10' && (testClass.includes('10') || testClass.includes('X') && !testClass.includes('IX'))) isClassMatch = true;

        const testSubject = String(item.rawData.subject).toLowerCase();
        const isSubjectMatch = testSubject.includes(subject.toLowerCase());

        if (isClassMatch && isSubjectMatch) {
            if (item.isExpired) {
                expired910.insertAdjacentHTML('beforeend', item.html);
                expCount++;
            } else {
                upcoming910.insertAdjacentHTML('beforeend', item.html);
                upCount++;
            }
        }
    });

    if (upCount === 0) upcoming910.innerHTML = emptyMsg(`No upcoming ${subject} tests for Class ${classLvl}.`);
    if (expCount === 0) expired910.innerHTML = emptyMsg(`No expired ${subject} tests for Class ${classLvl}.`);

    attachTestCardListeners();
    updateLiveCards(); 

    switchTab('live-tests-tab-910', `${subject} (Class ${classLvl})`);
}

// ==========================================
// 🛡️ NAYA: XI & XII SUBJECT FILTER ENGINE 
// ==========================================
const tabClass11 = document.getElementById('tab-class-11');
const tabClass12 = document.getElementById('tab-class-12');
const indicatorTextClass1112 = document.getElementById('indicator-text-class-1112');

if(tabClass11 && tabClass12) {
    tabClass11.addEventListener('click', () => {
        currentSubjectClassLvl1112 = '11';
        tabClass11.style.background = 'var(--card-bg)'; tabClass11.style.color = 'var(--primary)'; tabClass11.style.fontWeight = '700'; tabClass11.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; tabClass11.innerHTML = '🎯 Class XI';
        tabClass12.style.background = 'transparent'; tabClass12.style.color = 'var(--text-muted)'; tabClass12.style.fontWeight = '600'; tabClass12.style.boxShadow = 'none'; tabClass12.innerHTML = 'Class XII';
        if(indicatorTextClass1112) indicatorTextClass1112.innerText = 'Class XI';
    });

    tabClass12.addEventListener('click', () => {
        currentSubjectClassLvl1112 = '12';
        tabClass12.style.background = 'var(--card-bg)'; tabClass12.style.color = 'var(--primary)'; tabClass12.style.fontWeight = '700'; tabClass12.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; tabClass12.innerHTML = '🎯 Class XII';
        tabClass11.style.background = 'transparent'; tabClass11.style.color = 'var(--text-muted)'; tabClass11.style.fontWeight = '600'; tabClass11.style.boxShadow = 'none'; tabClass11.innerHTML = 'Class XI';
        if(indicatorTextClass1112) indicatorTextClass1112.innerText = 'Class XII';
    });
}

document.querySelectorAll('[data-subject-senior]').forEach(card => {
    card.addEventListener('click', () => {
        const subject = card.getAttribute('data-subject-senior');
        openFilteredLiveTests1112(currentSubjectClassLvl1112, subject);
    });
});

function openFilteredLiveTests1112(classLvl, subject) {
    const upcoming1112 = document.getElementById('upcoming-live-list-1112');
    const expired1112 = document.getElementById('expired-live-list-1112');
    
    upcoming1112.innerHTML = "";
    expired1112.innerHTML = "";

    let upCount = 0, expCount = 0;

    globalLiveTests1112.forEach(item => {
        const testClass = String(item.rawData.classLvl).toUpperCase();
        let isClassMatch = false;
        
        // Accurate routing based on exact class matching for XI and XII
        if (classLvl === '11' && (testClass.includes('11') || (testClass.includes('XI') && !testClass.includes('XII')))) isClassMatch = true;
        if (classLvl === '12' && (testClass.includes('12') || testClass.includes('XII'))) isClassMatch = true;

        const testSubject = String(item.rawData.subject).toLowerCase();
        const isSubjectMatch = testSubject.includes(subject.toLowerCase());

        if (isClassMatch && isSubjectMatch) {
            if (item.isExpired) {
                expired1112.insertAdjacentHTML('beforeend', item.html);
                expCount++;
            } else {
                upcoming1112.insertAdjacentHTML('beforeend', item.html);
                upCount++;
            }
        }
    });


    if (upCount === 0) upcoming1112.innerHTML = emptyMsg(`No upcoming ${subject} tests for Class ${classLvl}.`);
    if (expCount === 0) expired1112.innerHTML = emptyMsg(`No expired ${subject} tests for Class ${classLvl}.`);

    attachTestCardListeners();
    updateLiveCards(); 

    switchTab('live-tests-tab-1112', `${subject} (Class ${classLvl})`);
}


function attachTestCardListeners() {
    document.querySelectorAll('.test-action-btn').forEach(btn => {
        // 🛡️ ANTI-BUG LOCK: Ek hi button par 2 baar event attach hone se rokne ke liye
        if (btn.dataset.listenerAttached) return;
        btn.dataset.listenerAttached = "true";

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
// 6. ULTIMATE ANTI-CHEAT & LIVE TEST ENGINE
// ==========================================

// 🛡️ 1. Tab Switch / Minimize / Fullscreen Detector (HACKER PROOF)
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isTestActive) {
        showCustomPopup("Test Terminated! 🚨", "You switched tabs or minimized the window. As per strict anti-cheat policies, your test has been automatically submitted.", "danger");
        processSubmission(); 
    }
});

document.addEventListener("fullscreenchange", () => {
    // Agar test active hai aur user ne fullscreen exit kar diya
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && isTestActive) {
        showCustomPopup("Security Breach Detected! 🚨", "You exited Full-Screen mode. Your session has been flagged and auto-submitted.", "danger");
        processSubmission();
    }
});

// 🛡️ 2. Aggressive Keyboard Shortcut Blocker (Black-Hat Stopper)
document.addEventListener("keydown", (e) => {
    if (!isTestActive) return; // strictness sirf Live test me rahegi

    // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    if (
        e.key === "F12" || 
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) || 
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
    ) {
        e.preventDefault();
        showCustomPopup("Warning ⚠️", "Keyboard shortcuts and Developer Tools are strictly disabled during a live exam.", "warning");
        return false;
    }
});

// 🛡️ 3. The "Debugger Trap" (DevTools Auto-Kill Engine)
setInterval(() => {
    if (isTestActive) {
        const startTrap = performance.now();
        debugger; // Yeh line normally browser ignore karta hai. LEKIN agar DevTools open hai, toh browser yaha freeze ho jayega.
        const endTrap = performance.now();
        
        // Agar execution freeze hui (yani Console open tha), toh time difference 100ms se zyada aayega
        if (endTrap - startTrap > 100) {
            showCustomPopup("Security Breach Detected! 🚨", "Developer Tools opened. Your session is flagged and the exam is auto-submitted.", "danger");
            processSubmission();
        }
    }
}, 2000); // Har 2 second mein hacker check karo


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
            const testTitleEl = document.getElementById('test-title');
            if (testTitleEl) testTitleEl.innerText = testId.replace(/_/g, ' ');
            
            isTestActive = true; 
            renderQuestion();
            totalTestSeconds = durationMins * 60;
            startTimer(durationMins * 60); 
            switchTab('test-tab', 'Test Session'); // 🛡️ NATIVE UI FIX

            // 🛡️ FULL SCREEN ENGINE: Test tab open hote hi screen maximize kardo
            try {
                let elem = document.documentElement;
                if (elem.requestFullscreen) { elem.requestFullscreen(); }
                else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } // Safari & iOS Support
                else if (elem.msRequestFullscreen) { elem.msRequestFullscreen(); } // Older Edge Support
            } catch (err) { console.log("Fullscreen API Blocked"); }



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
    
    // 🛡️ HACKER-PROOF TIMER: Real end time ko local scope mein lock kar diya taaki console se access na ho
    const realEndTime = getSecureTime() + (seconds * 1000);

    function checkTime() {
        const now = getSecureTime();
        const diff = Math.floor((realEndTime - now) / 1000);

        // 🛡️ AUTO-CORRECT ENGINE: Agar hacker console se timeRemaining badhayega, toh next tick mein ye actual bache hue time par wapas aa jayega
        timeRemaining = diff > 0 ? diff : 0;

        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            showCustomPopup("Time's Up!", "Auto-submitting your test.", "warning", processSubmission, false);
        }
    }

    checkTime(); // Start hote hi UI par time dikhao
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
            
            // EXPERT LOGIC: Poora palette destroy karne ke bajaye, sirf current active bubble dhoondo aur usko 'answered' (Green) class de do. O(1) Time Complexity!
            const activeBubble = document.querySelector(`.q-bubble:nth-child(${currentQuestionIndex + 1})`);
            if (activeBubble && !activeBubble.classList.contains('answered')) {
                activeBubble.classList.add('answered');
            }
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

    renderQuestionPalette();

    // EXPERT LOGIC: Pehle question aur options ko as a string check karo. Agar usme MathJax ke special symbols ($, \(, \[) hain, TBBHI MathJax engine chalao!
    const fullTextString = qData.questionText + " " + qData.options.join(' ');
    const containsMath = fullTextString.includes('$') || fullTextString.includes('\\(') || fullTextString.includes('\\[');
    
    if (window.MathJax && containsMath) {
        MathJax.typesetPromise([
            document.getElementById('question-text'),
            document.getElementById('options-container')
        ]).catch((err) => console.log('Math rendering error: ', err.message));
    }
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

    // 🛡️ BUG FIX: Background timer ko completely kill kardo taaki Time's Up wapas na aaye
    clearInterval(timerInterval);

    // 🛡️ FULL SCREEN ENGINE: Test submit hote hi normal screen par wapas aao
    try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) { document.exitFullscreen(); }
            else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
        }
    } catch (err) { console.log("Exit Fullscreen Blocked"); }

    isPostExamRestricted = true;
    // 🛡️ ANTI-CHEAT FIX: Screen ko turant freeze kar do taaki offline mode mein answers change na kar sakein
    const optionsContainer = document.getElementById('options-container');
    if(optionsContainer) optionsContainer.style.pointerEvents = 'none';
    const questionPalette = document.getElementById('question-palette');
    if(questionPalette) questionPalette.style.pointerEvents = 'none';
    document.getElementById('prev-btn').disabled = true;
    document.getElementById('next-btn').disabled = true;
    Object.freeze(userAnswers);
    if (!navigator.onLine) {
        isTestActive = true;
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

    // 🚀 NAYA: MATHJAX FOR ANALYSIS SCREEN
    if (window.MathJax) {
        MathJax.typesetPromise([document.getElementById('breakdown-list')])
            .catch((err) => console.log('Math rendering error in analysis: ', err.message));
    }

    switchTab('analysis-tab', 'Performance Insights', pushToHistory);
}



// ==========================================
// 8. ADVANCED FIREBASE SERVICE WORKER (PWA)
// ==========================================

let newWorker;
let swRegistration = null; // ✅ NAYA: SW ko global banaya taaki button click par check kar sakein

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 🚀 IIT EXPERT FIX: Explicit scope added to lock the Service Worker strictly to the /tests/ folder
        navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './', updateViaCache: 'none' })
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

// 🚀 NAYA: OTA PREMIUM UPDATE ENGINE
function showUpdatePopup() {
    const updatePopup = document.getElementById('premium-update-popup');
    const updateBtn = document.getElementById('btn-update-now');
    
    if (updatePopup && updateBtn) {
        // Overlay show karo (kisi aur popup par nirbhar nahi)
        updatePopup.style.display = 'flex';
        
        updateBtn.addEventListener('click', () => {
            // Button loading animation
            updateBtn.disabled = true;
            updateBtn.innerHTML = `<span class="material-icons" style="font-size: 18px; animation: spinGlow 1s linear infinite;">autorenew</span> Installing...`;
            updateBtn.style.opacity = '0.8';
            
            // Service worker ko naya version activate karne ka command bhejo
            if (newWorker) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
        });
    }
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
            currentLeaderboardData = result.leaderboard;
            document.getElementById('share-rank-btn').style.display = 'flex';
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
            document.getElementById('share-rank-btn').style.display = 'none';
            listContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:30px;">No ranks generated yet. Be the first!</p>`;
        }
    } catch (err) {
        document.getElementById('share-rank-btn').style.display = 'none';
        listContainer.innerHTML = `<p class="error" style="text-align:center; padding:30px;">Failed to connect to ranking server.</p>`;
    }
}


// ==========================================
// 10. ADVANCED LIVE TESTS TABS ENGINE (Supports up to 3 Tabs)
// ==========================================
function setupLiveTabs(target) {
    const tabUp = document.getElementById(`tab-upcoming-${target}`);
    const tabExp = document.getElementById(`tab-expired-${target}`);
    const tabAtt = document.getElementById(`tab-attempted-${target}`); // Optional 3rd tab
    
    const listUp = document.getElementById(`upcoming-live-list-${target}`);
    const listExp = document.getElementById(`expired-live-list-${target}`);
    const listAtt = document.getElementById(`attempted-list-${target}`); // Optional 3rd list

    function resetTabs() {
        [tabUp, tabExp, tabAtt].forEach(t => {
            if (t) { t.classList.remove('active'); t.style.color = 'var(--text-muted)'; t.style.borderBottom = '3px solid transparent'; }
        });
        [listUp, listExp, listAtt].forEach(l => { if (l) l.style.display = 'none'; });
    }

    if (tabUp) tabUp.addEventListener('click', () => {
        resetTabs();
        tabUp.classList.add('active'); tabUp.style.color = 'var(--primary)'; tabUp.style.borderBottom = '3px solid var(--primary)';
        listUp.style.display = 'block';
    });

    if (tabExp) tabExp.addEventListener('click', () => {
        resetTabs();
        tabExp.classList.add('active'); tabExp.style.color = 'var(--primary)'; tabExp.style.borderBottom = '3px solid var(--primary)';
        listExp.style.display = 'block';
    });

    if (tabAtt) tabAtt.addEventListener('click', () => {
        resetTabs();
        tabAtt.classList.add('active'); tabAtt.style.color = 'var(--primary)'; tabAtt.style.borderBottom = '3px solid var(--primary)';
        listAtt.style.display = 'block';
    });
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
// 💳 PREMIUM RAZORPAY PAYMENT ENGINE (PLAY STORE COMPLIANT 🚀)
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
        const isPlayStoreApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        if (isPlayStoreApp) {
            showCustomPopup(
                "Purchase Restricted 🔒", 
                "Due to Google Play policies, in-app purchases are disabled. To buy this Premium Test, please open <strong>apjakjb.in/tests/</strong> in your phone's Chrome browser.<br><br>Once purchased there, it will automatically unlock here in the app.", 
                "info"
            );
            return;
        }
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
        const attList = document.getElementById('attempted-list-series'); // 🛡️ NAYA: Attempted list
        
        upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--primary);"><span class="material-icons" style="font-size: 30px; animation: spinGlow 1s linear infinite;">autorenew</span><br><b style="display:block; margin-top:10px;">Fetching Mock Tests...</b></div>`;
        expList.innerHTML = "";
        attList.innerHTML = "";

        switchTab('premium-series-tab', seriesTitle);

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

                let upCount = 0, expCount = 0, attCount = 0; // 🛡️ NAYA: Attempted count

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
                        actionBtn = `<button class="btn-secondary test-action-btn" data-test="${test.testId}" style="width:100%;">View Analysis</button>`;
                        // 🛡️ THE FIX: Ab app breakdown render karne ke liye 'details' bhi local memory mein save karega
                        testHistoryData[test.testId] = { 
                            score: test.score, 
                            total: test.total,
                            percentage: test.percentage,
                            details: test.details 
                        }; 
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

                    // 🛡️ THE MASTER FIX: data-completed="${isCompleted}" card wrapper par lagaya gaya hai!
                    const cardHTML = `
                        <div class="premium-test-card live-test-card" 
                             data-test="${test.testId}" 
                             data-duration="${testDuration}" 
                             data-start="${test.startTime}" 
                             data-end="${test.endTime}" 
                             data-type="live"
                             data-completed="${isCompleted}"
                             style="border: 1.5px solid #FCD34D; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);">
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

                    // 🛡️ NAYA LOGIC: Sort tests strictly into their proper tabs
                    if (isCompleted) {
                        attList.insertAdjacentHTML('beforeend', cardHTML);
                        attCount++;
                    } else if (isExpired) {
                        expList.insertAdjacentHTML('beforeend', cardHTML);
                        expCount++;
                    } else {
                        upList.insertAdjacentHTML('beforeend', cardHTML);
                        upCount++;
                    }
                });

                if (upCount === 0) upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">No upcoming or active tests here.</div>`;
                if (expCount === 0) expList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">No expired tests in this series.</div>`;
                if (attCount === 0) attList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">You haven't attempted any tests yet.</div>`;

                attachTestCardListeners();

            } else {
                upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">No mock tests have been uploaded in this series yet.</div>`;
            }
        } catch (err) {
            upList.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--danger);">Failed to connect to server.</div>`;
        }
    }
});

// 🚀 THE ULTIMATE FIX: Native Google Drive HTML5 Player (Zero YouTube Dependency)
async function openExploreDemoScreen(bundleId, title, aboutText, price) {
    // 1. Basic UI Update
    document.getElementById('explore-title').innerText = title;
    
    // 🛡️ Setup Smart Back Button
    const backBtn = document.getElementById('explore-back-btn');
    if (backBtn) {
        backBtn.onclick = () => {
            switchTab('premium-tests-tab', 'Premium Test Series');
        };
    }

    // 🛡️ Setup Dynamic Buy Button
    const buyBtn = document.getElementById('explore-buy-now-btn');
    if (buyBtn) {
        buyBtn.setAttribute('data-testid', bundleId);
        buyBtn.setAttribute('data-amount', price);
        buyBtn.innerHTML = `<span class="material-icons" style="font-size:16px;">shopping_cart_checkout</span> Unlock Full Access - ₹${price}`;
    }

    // 2. Tab open karo aur Loader dikhao
    switchTab('premium-explore-tab', 'Why Premium?');
    const tbody = document.getElementById('explore-syllabus-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px 5px; text-align: center; color: var(--text-muted); font-size: 10px;"><span class="material-icons" style="font-size: 18px; animation: spinGlow 1s linear infinite; color: var(--primary); vertical-align: middle;">autorenew</span><br>Fetching Detailed Schedule...</td></tr>`;
    }

    // 🚀 PRO ENGINEER FIX: API aane se pehle Skeleton Frame Loader dikhao
    const videoWrapper = document.getElementById('premium-video-wrapper');
    const playerContainer = document.getElementById('youtube-player-container');
    
    if (videoWrapper && playerContainer) {
        videoWrapper.style.display = 'block'; // Frame ko turant show karo
        playerContainer.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #0f0f0f;">
                <span class="material-icons" style="font-size: 36px; color: var(--primary); animation: spinGlow 1.2s linear infinite;">satellite_alt</span>
                <p style="color: var(--text-muted); font-size: 11px; margin-top: 15px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Connecting to Secure Server...</p>
            </div>
        `;
    }

    // 3. Backend se Syllabus Table Data Fetch Karo
    try {
        const authToken = localStorage.getItem('auth_token');
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getBundleDetails", username: loggedInUser, token: authToken, bundleId: bundleId })
        });
        
        const data = JSON.parse(await res.text());

        // 🛡️ DATA AANE KE BAAD YOUTUBE PLAYER INJECT HOGA

        if (data.videoLink && videoWrapper && playerContainer) {
            
            // Smart Regex to extract YouTube Video ID
            let ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            let ytMatch = data.videoLink.match(ytRegex);
            let ytVideoId = ytMatch ? ytMatch[1] : null;

            if (ytVideoId) {
                videoWrapper.style.display = 'block';
                
                // 🚀 PRO ENGINEER FIX: Injecting Player + Black Overlay Wave Loader
                playerContainer.innerHTML = `
                    <div id="video-wave-loader" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #000; z-index: 10; transition: opacity 0.4s ease;">
                        <div class="wave-container">
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                        </div>
                        <p style="color: #FCD34D; font-size: 11px; margin-top: 15px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Loading video...</p>
                    </div>
                    <div id="premium-native-player" data-plyr-provider="youtube" data-plyr-embed-id="${ytVideoId}"></div>
                `;
                
                // Initialize the native player UI with strict API parameters
                setTimeout(() => {
                    const player = new Plyr('#premium-native-player', {
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
                        hideControls: true,
                        youtube: { 
                            noCookie: true, 
                            rel: 0,
                            showinfo: 0,
                            iv_load_policy: 3,
                            modestbranding: 1,
                            disablekb: 1
                        }
                    });

                    document.documentElement.style.setProperty('--plyr-color-main', '#EF4444');

                    // 🛡️ THE MAGIC: Listen for Plyr's 'ready' event
                    // Jab YouTube iframe ka data puri tarah render ho jayega, yeh function chalega
                    player.on('ready', () => {
                        const loader = document.getElementById('video-wave-loader');
                        if (loader) {
                            loader.style.opacity = '0'; // Pehle makkhan ki tarah fade out karo
                            setTimeout(() => {
                                loader.style.display = 'none'; // 400ms baad DOM flow se gayab kar do
                            }, 400); 
                        }
                    });

                }, 100);
            } else {
                videoWrapper.style.display = 'none';
                playerContainer.innerHTML = '';
            }
        } else if (videoWrapper) {
            videoWrapper.style.display = 'none';
            if (playerContainer) playerContainer.innerHTML = '';
        }

        // 4. Syllabus Table Render Logic
        if (data.success && data.syllabus.length > 0 && tbody) {
            tbody.innerHTML = ""; 

            data.syllabus.forEach((item, index) => {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 10px 4px; font-size: 10px; border-right: 1px solid var(--border); text-align: center;">${index + 1}</td>
                        <td style="padding: 10px 4px; font-size: 10px; border-right: 1px solid var(--border);">${item.chapter}</td>
                        <td style="padding: 10px 4px; font-size: 10px; border-right: 1px solid var(--border);">${formatShortDate(item.startTime)}</td>
                        <td style="padding: 10px 4px; font-size: 10px;">${formatShortDate(item.endTime)}</td>
                    </tr>
                `);
            });
        } else if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 10px;">Schedule is being updated by educators. Stay tuned!</td></tr>`;
        }
    } catch(e) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--danger); font-size: 10px;">Network Error: Failed to load schedule.</td></tr>`;
    }
}










// Click Listener jo is master function ko trigger karega
document.addEventListener('click', (e) => {
    // Agar dashboard ke "Explore Demo" pe click kiya
    const exploreBtn = e.target.closest('.bpc-about-btn');
    if (exploreBtn) {
        const bundleId = exploreBtn.getAttribute('data-about');
        const card = exploreBtn.closest('.bundle-premium-card');
        const title = card.querySelector('.bpc-title').innerText;
        // API call start
        openExploreDemoScreen(bundleId, title, "Demo will start soon.");
    }
});


// ==========================================
// 🚀 PREMIUM SHARE ENGINE (Upgraded)
// ==========================================
document.getElementById('home-share-btn').addEventListener('click', shareAppLogic);
document.getElementById('drawer-share-btn').addEventListener('click', shareAppLogic);

async function shareAppLogic() {
    // 🛡️ Always use the canonical URL for proper Meta Scraping
    const appLink = "https://apjakjb.in/tests/"; 
    
    // 💎 PREMIUM FIX: Removed the raw GIF link from text!
    // Jab platform ko ek clean URL milta hai, tabhi wo HTML Meta Tags (OG:Image) ko properly fetch karke animated preview banata hai.
    const shareMessage = `🔥 *Premium Test Series Portal* 🚀\n\n` +
                         `Boost your preparation with Free & Premium Live Tests, All-India Rankings, and Deep Analytics for Classes IX to XII.\n\n` +
                         `👇 *Click below to Install & Start Mock Tests:*`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Test Portal by SA Khan',
                text: shareMessage,
                url: appLink // 🛑 URL MUST be passed here, not concatenated in text for Native APIs
            });
        } catch (err) {
            console.log("Native share failed or cancelled, falling back to copy", err);
            // Fallback for desktop browsers
            copyToClipboard(`${shareMessage}\n\n🔗 ${appLink}`);
        }
    } else {
        copyToClipboard(`${shareMessage}\n\n🔗 ${appLink}`);
    }
}

function copyToClipboard(text) {
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    
    showCustomPopup("Link Copied!", "You can manually share to you friends", "success");
}


// ==========================================
// 🚀 PREMIUM WELCOME AD ENGINE (PURE IMAGE)
// ==========================================
function showPremiumWelcomeAd() {
    if (sessionStorage.getItem('welcomeAdShown')) return; 
    
    const adPopup = document.getElementById('welcome-ad-popup');
    if (!adPopup) return;
    
    adPopup.style.display = 'flex';
    sessionStorage.setItem('welcomeAdShown', 'true');
    
    document.getElementById('close-ad-btn').addEventListener('click', () => {
        adPopup.style.display = 'none';
    });
}


// ==========================================
// 🛡️ NAYA: PREMIUM PROFILE EDIT ENGINE
// ==========================================
const editNameBtn = document.getElementById('edit-name-btn');

if (editNameBtn) {
    editNameBtn.addEventListener('click', () => {
        const nameEl = document.getElementById('profile-student-name');
        const currentName = localStorage.getItem('student_name') || loggedInUserName;
        
        // Inline Editor UI
        nameEl.innerHTML = `
            <input type="text" id="inline-name-input" value="${currentName}" maxlength="30" 
                style="padding: 4px 8px; border-radius: 6px; border: 1.5px solid var(--primary); 
                background: var(--card-bg); color: var(--text-main); font-size: 14px; 
                font-weight: 700; text-align: center; width: 140px; outline: none;">
            <button id="inline-save-btn" class="btn-primary" 
                style="padding: 4px 8px; border-radius: 6px; font-size: 12px; width: auto; 
                margin-left: 6px; background: var(--success); box-shadow: none;">Save</button>
        `;
        
        editNameBtn.style.display = 'none';

        document.getElementById('inline-save-btn').addEventListener('click', async () => {
            const newName = document.getElementById('inline-name-input').value.trim();
            
            if (!newName || newName === currentName) {
                updateProfileUI(); // Revert back without API call
                editNameBtn.style.display = 'flex';
                return;
            }
            
            showLoader("Updating Profile...");
            try {
                const authToken = localStorage.getItem('auth_token');
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "updateProfileName", username: loggedInUser, token: authToken, newName: newName })
                });

                const result = JSON.parse(await response.text());
                hideLoader();

                if (result.success) {
                    loggedInUserName = newName;
                    localStorage.setItem('student_name', newName); // Local storage update
                    updateProfileUI(); // UI Refresh
                    showCustomPopup("Profile Updated 🎉", "Your new name is successfully linked to the Leaderboard.", "success");
                } else {
                    showCustomPopup("Update Failed", result.message, "danger");
                    updateProfileUI(); // Revert
                }
            } catch (error) {
                hideLoader();
                showCustomPopup("Network Error", "Could not save your new name. Please check your connection.", "danger");
                updateProfileUI(); // Revert
            } finally {
                editNameBtn.style.display = 'flex';
            }
        });
    });
}


// ==========================================
// 🚀 PREMIUM SHARE LEADERBOARD ENGINE (NAVI STYLE + ASYNC LOADER)
// ==========================================
document.getElementById('share-rank-btn')?.addEventListener('click', () => {
    if (!currentLeaderboardData || currentLeaderboardData.length === 0) return;

    // 🛡️ 1. Sabse pehle instantly Wave Loader ON karo
    showLoader("Generating Premium Rank Card...");

    // 🛡️ 2. MAGIC TRICK: Browser ko loader render karne ke liye 150ms ka time do
    setTimeout(async () => {
        try {
            const shareTestName = document.getElementById('leaderboard-test-name').innerText;
            document.getElementById('share-test-name').innerText = shareTestName;

            const container = document.getElementById('share-list-container');
            container.innerHTML = "";

            // Determine Top 9 + Current User
            let displayList = [];
            let userRankObj = currentLeaderboardData.find(u => u.username === loggedInUserName);
            let userRank = userRankObj ? userRankObj.rank : -1;

            // Add Top 9
            for (let i = 0; i < Math.min(9, currentLeaderboardData.length); i++) {
                displayList.push(currentLeaderboardData[i]);
            }

            // Agar user top 9 mein nahi hai, toh usko list ke end mein add karo with a separator
            if (userRank > 9) {
                displayList.push({ isSeparator: true });
                displayList.push(userRankObj);
            }

            // Build HTML for Image
            displayList.forEach(student => {
                if (student.isSeparator) {
                    container.insertAdjacentHTML('beforeend', `<div style="text-align:center; color:#94A3B8; margin: 5px 0;">•••</div>`);
                    return;
                }

                let isMe = student.username === loggedInUserName;
                let bgColor = isMe ? 'background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981;' : 'background: transparent; border-bottom: 1px solid rgba(255,255,255,0.1);';
                let rankColor = student.rank === 1 ? '#FCD34D' : (student.rank === 2 ? '#E2E8F0' : (student.rank === 3 ? '#FDBA74' : '#94A3B8'));
                let trophy = student.rank === 1 ? '🥇' : (student.rank === 2 ? '🥈' : (student.rank === 3 ? '🥉' : `#${student.rank}`));

                container.insertAdjacentHTML('beforeend', `
                    <div style="${bgColor} padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-radius: ${isMe ? '8px' : '0'}; margin-bottom: 2px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 24px; text-align: center; font-size: 16px; font-weight: 800; color: ${rankColor};">${trophy}</div>
                            <div style="font-size: 14px; font-weight: ${isMe ? '800' : '600'}; color: ${isMe ? '#10B981' : 'white'};">${student.username} ${isMe ? '(You)' : ''}</div>
                        </div>
                        <div style="font-size: 13px; font-weight: 700; color: #FCD34D;">${student.score} <span style="font-size: 10px; color: #94A3B8;">Marks</span></div>
                    </div>
                `);
            });

            // HTML to Canvas to Image Blob
            const templateNode = document.getElementById('share-card-template');
            
            const canvas = await html2canvas(templateNode, {
                scale: 2, // High resolution
                useCORS: true, // Allow GitHub Logo
                backgroundColor: "#0F172A",
                logging: false
            });

            canvas.toBlob(async (blob) => {
                const file = new File([blob], `Rank_${shareTestName.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
                
                const shareTitle = `🏆 My All India Rank: #${userRank !== -1 ? userRank : '-'}`;
                const shareText = `🔥 I just secured Rank #${userRank !== -1 ? userRank : '-'} in ${shareTestName} on the Test Portal!\n\nCan you beat my score? Attempt Free & Premium Mock Tests now.\n\n👇 Download/Access the App here:`;
                const shareUrl = "https://apjakjb.in/tests/";

                // 🛡️ 3. Share menu khulne se pehle Loader smoothly Hide karo
                hideLoader();

                // Native Share Trigger (Mobile Browsers / Modern PWA)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: shareTitle,
                            text: shareText,
                            url: shareUrl
                        });
                    } catch (e) { console.log("Share cancelled by user."); }
                } else {
                    // Fallback for PC or Unsupported Browsers (Auto Download + Copy Text)
                    const link = document.createElement('a');
                    link.download = file.name;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    copyToClipboard(`${shareTitle}\n${shareText}\n🔗 ${shareUrl}`);
                    showCustomPopup("Image Downloaded!", "Your Rank Card has been saved. The message is copied to your clipboard so you can paste and share it easily.", "success");
                }
            }, 'image/jpeg', 0.9);

        } catch (err) {
            hideLoader();
            console.error("Screenshot error: ", err);
            showCustomPopup("Error", "Could not generate rank card. Please try again.", "danger");
        }
    }, 150); // ⏳ Yeh 150ms ka delay browser ko freeze hone se bachayega
});
