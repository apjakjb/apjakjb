// ==========================================
// 10. PREMIUM LEADERBOARD ENGINE
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
// ... (iske niche ka code bilkul same rahega result parse karne wala) ...
