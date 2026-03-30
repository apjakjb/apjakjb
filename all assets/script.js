// PUT YOUR NEW DEPLOYMENT URL HERE
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzx60TpnIDtt4GyhXANEMlcDNI59JfUouuDF3vaQ03ciiI1N2qdcgyakxIidlYXy5XN/exec'; 

const galleryGrid = document.getElementById('gallery-grid');
const loader = document.getElementById('loader');
const uploadForm = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const statusMsg = document.getElementById('upload-status');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.querySelector('.lightbox-close');

// --- UPLOAD LOGIC ---
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('photo-file').files[0];
    if (!file) return;

    submitBtn.disabled = true;
    submitBtn.innerText = 'Uploading Securely...';
    statusMsg.innerText = '';
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        const payload = {
            base64: event.target.result.split(',')[1],
            filename: file.name,
            mimeType: file.type,
            title: document.getElementById('photo-title').value,
            category: document.getElementById('photo-category').value
        };

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                statusMsg.innerText = '✓ Photo published successfully!';
                statusMsg.style.color = '#15803d';
                uploadForm.reset();
                fetchGalleryData(); 
            } else throw new Error(result.message);
        } catch (error) {
            statusMsg.innerText = 'X Upload failed. Please check connection.';
            statusMsg.style.color = '#b91c1c';
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Publish to Gallery';
        }
    };
    reader.readAsDataURL(file);
});

// --- GALLERY LOGIC & SEO ---
async function fetchGalleryData() {
    loader.style.display = 'block';
    galleryGrid.innerHTML = '';
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        loader.style.display = 'none';
        
        if(data.length === 0) {
            galleryGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No images in gallery yet.</p>';
            return;
        }
        
        renderGallery(data);
    } catch (error) {
        console.error("Fetch Error:", error);
        loader.innerHTML = '<p style="color:red;">Unable to load gallery data.</p>';
    }
}

function renderGallery(images) {
    images.reverse().forEach(item => {
        // THE FIX: Using Google's thumbnail API to bypass cookie-blocking restrictions
        const imageUrl = `https://drive.google.com/thumbnail?id=${item.ImageID}&sz=w1000`;

        const figure = document.createElement('figure');
        figure.className = 'gallery-item';
        
        figure.innerHTML = `
            <img src="${imageUrl}" alt="School ${item.Category} - ${item.Title}" class="gallery-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Unavailable'">
            <figcaption class="gallery-overlay">
                <h3>${item.Title}</h3>
                <span>${item.Category}</span>
            </figcaption>
        `;

        figure.addEventListener('click', () => openLightbox(imageUrl, item.Title, item.Category));
        galleryGrid.appendChild(figure);
    });
}

// --- LIGHTBOX LOGIC ---
function openLightbox(src, title, category) {
    lightbox.style.display = "block";
    lightboxImg.src = src;
    lightboxCaption.innerHTML = `<strong>${title}</strong> <br> <small>${category}</small>`;
}

closeBtn.onclick = () => lightbox.style.display = "none";
lightbox.onclick = (e) => { if (e.target !== lightboxImg) lightbox.style.display = "none"; }

fetchGalleryData();