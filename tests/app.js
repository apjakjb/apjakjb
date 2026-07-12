// ==========================================
// 4. AUTHENTICATION & THE PWA POPUP-HACK ENGINE (BULLETPROOF V3)
// ==========================================

let isGoogleLoginProcessing = false;
let visibilityTimeout = null; 

// 🚀 MASTER ENGINE: Sync Google User to APJAKJB Server Guaranteed
async function syncGoogleUserWithBackend(user) {
    if (sessionStorage.getItem('google_sync_in_progress') === 'true') return;
    sessionStorage.setItem('google_sync_in_progress', 'true');
    
    // 🛡️ HACKER FIX 1: Lock the fallback timer immediately so it doesn't kill our loader
    isGoogleLoginProcessing = false;
    if (visibilityTimeout) clearTimeout(visibilityTimeout);

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
        // 🛡️ HACKER FIX 2: Do NOT aggressively sign out on simple network drops. Let them retry.
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
                console.log("PWA WebView Detached. Waiting for background login to complete...");
                
                const loaderText = document.getElementById('loader-text');
                if(loaderText) loaderText.innerText = "Finishing Login... Please wait.";

                const checkAppFocus = () => {
                    if (document.visibilityState === 'visible') {
                        document.removeEventListener('visibilitychange', checkAppFocus);
                        
                        // 🛡️ HACKER FIX 3: Safety verification check with extended time
                        visibilityTimeout = setTimeout(() => {
                            if (isGoogleLoginProcessing && sessionStorage.getItem('google_sync_in_progress') !== 'true') {
                                hideLoader();
                                isGoogleLoginProcessing = false;
                                googleLoginBtn.disabled = false;
                                googleLoginBtn.innerHTML = originalBtnHTML;
                                googleLoginBtn.style.opacity = "1";
                            }
                        }, 5000); // 5 seconds margin
                    }
                };
                document.addEventListener('visibilitychange', checkAppFocus);

            } else {
                hideLoader();
                isGoogleLoginProcessing = false;
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = originalBtnHTML;
                googleLoginBtn.style.opacity = "1";
                showCustomPopup("Connection Failed", "Could not connect to Google Server. Error: " + error.message, "danger");
            }
        });
    });
}
