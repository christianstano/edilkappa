// ======== CONFIGURAZIONE SUPABASE ========
const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Variabili Globali ---
let currentStep = 1;
const formData = { name: "", issue: "", photo: null, phone: "" };
let currentCarouselIndex = 0;
let currentUser = null;

// --- Gestione Stato Autenticazione ---
document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    updateUserStatus(session);

    _supabase.auth.onAuthStateChange((_event, session) => {
        updateUserStatus(session);
    });

    document.getElementById('feedbackForm')?.addEventListener('submit', handleFeedbackSubmit);
    document.getElementById('logout-link')?.addEventListener('click', logout);
    document.getElementById('login-link')?.addEventListener('click', openAuthModal);

    showHome();

    // Aggiunto listener per il resize della finestra per il carosello
    window.addEventListener('resize', updateCarousel);
});

function updateUserStatus(session) {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const myRequestsLink = document.getElementById('my-requests-link');
    const feedbackNameInput = document.getElementById('feedbackName');

    if (session) {
        currentUser = session.user;
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';
        if (myRequestsLink) myRequestsLink.style.display = 'block';
        if (feedbackNameInput) feedbackNameInput.value = currentUser.user_metadata?.full_name || currentUser.email;
    } else {
        currentUser = null;
        if (loginLink) loginLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
        if (myRequestsLink) myRequestsLink.style.display = 'none';
    }
}

async function logout() {
    await _supabase.auth.signOut();
    closeAuthModal();
    showHome();
    window.location.reload();
}

// --- Gestione Navigazione Sezioni ---
function toggleMenu() { document.getElementById("nav-menu").classList.toggle("active"); }
function closeMenu() { document.getElementById("nav-menu").classList.remove("active"); }

function showSection(sectionId) {
    const sections = ['overlay', 'assistenza', 'pastJobs', 'feedback', 'myRequests'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === sectionId) ? 'flex' : 'none';
    });
    closeMenu();
}

function showHome() { showSection('overlay'); }

function showPastJobs() {
    showSection('pastJobs');
    updateCarousel();
}

function showFeedbackForm() {
    if (!currentUser) {
        alert("Devi effettuare il login per lasciare un feedback.");
        openAuthModal();
        return;
    }
    showSection('feedback');
}

// --- Logica Modulo Assistenza ---
function openForm() {
    if (!currentUser) {
        alert("Devi effettuare il login per richiedere assistenza.");
        openAuthModal();
        return;
    }
    document.getElementById('myForm').style.display = 'block';
    document.getElementById('spinner-container').style.display = 'none';
    showSection('assistenza');
    currentStep = 1;
    formData.name = currentUser.user_metadata?.full_name || currentUser.email;
    renderFormStep();
}

function renderFormStep() {
    const form = document.getElementById("myForm");
    let content = '';
    switch (currentStep) {
        case 1:
            content = `<label for="name">Nome e Cognome</label><input id="name" name="name" type="text" required placeholder="Il tuo nome" value="${formData.name}" oninput="formData.name = this.value" /><div class="form-navigation"><div></div><button type="button" onclick="nextStep()">Avanti</button></div>`;
            break;
        case 2:
            content = `<label for="issue">Descrivi il problema</label><textarea id="issue" name="issue" required placeholder="Di cosa hai bisogno?" oninput="formData.issue = this.value">${formData.issue}</textarea><div class="form-navigation"><button type="button" onclick="prevStep()">Indietro</button><button type="button" onclick="nextStep()">Avanti</button></div>`;
            break;
        case 3:
            content = `<label for="photo">Allega una foto (opzionale)</label><input id="photo" type="file" name="attachment" accept="image/*" onchange="handlePhotoChange(event)" /><div id="imagePreview" class="image-preview-container"></div><div class="form-navigation"><button type="button" onclick="prevStep()">Indietro</button><button type="button" onclick="nextStep()">Avanti</button></div>`;
            break;
        case 4:
            content = `<label for="phone">Numero di Telefono</label><input id="phone" name="phone" type="tel" required placeholder="Il tuo numero di telefono" value="${formData.phone}" oninput="formData.phone = this.value" /><div class="form-navigation"><button type="button" onclick="prevStep()">Indietro</button><button type="button" onclick="nextStep()">Avanti</button></div>`;
            break;
        case 5:
            content = `<h3>Riepilogo Dati</h3><div id="finalImagePreview" class="image-preview-container"></div><p style="text-align:left;"><strong>Nome:</strong> ${formData.name}</p><p style="text-align:left;"><strong>Problema:</strong> ${formData.issue}</p><p style="text-align:left;"><strong>Telefono:</strong> ${formData.phone}</p><p style="text-align:left;"><strong>Foto:</strong> ${formData.photo ? formData.photo.name : 'Nessuna'}</p><div class="form-navigation"><button type="button" onclick="prevStep()">Indietro</button><button type="submit">Conferma e Invia</button></div>`;
            break;
    }
    if (form) {
        form.innerHTML = content;
        if (currentStep === 3 && formData.photo) renderImagePreview(formData.photo, 'imagePreview');
        if (currentStep === 5 && formData.photo) renderImagePreview(formData.photo, 'finalImagePreview');
        if (currentStep === 5) {
            form.addEventListener('submit', handleAssistanceSubmit, { once: true });
        }
    }
}

async function handleAssistanceSubmit(event) {
    event.preventDefault();
    showSpinner();
    let photoUrl = null;
    if (formData.photo) {
        const file = formData.photo;
        const filePath = `public/${currentUser.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await _supabase.storage.from('photos').upload(filePath, file);
        if (uploadError) {
            console.error("Errore foto:", uploadError);
            alert("Errore durante il caricamento della foto.");
            showForm();
            return;
        }
        const { data: { publicUrl } } = _supabase.storage.from('photos').getPublicUrl(filePath);
        photoUrl = publicUrl;
    }
    const { error: insertError } = await _supabase.from('requests').insert({
        user_id: currentUser.id,
        name: formData.name,
        issue: formData.issue,
        phone: formData.phone,
        photo_url: photoUrl
    });
    if (insertError) {
        console.error("Errore richiesta:", insertError);
        alert("Errore durante l'invio della richiesta.");
        showForm();
    } else {
        window.location.href = 'thankyou.html';
    }
}

function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (file) {
        formData.photo = file;
        renderImagePreview(file, 'imagePreview');
    }
}

function renderImagePreview(file, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function nextStep() { if (validateStep()) { currentStep++; renderFormStep(); } }
function prevStep() { currentStep--; renderFormStep(); }
function validateStep() {
    if (currentStep === 1 && !formData.name.trim()) { alert("Inserisci il tuo nome."); return false; }
    if (currentStep === 2 && !formData.issue.trim()) { alert("Descrivi il problema."); return false; }
    if (currentStep === 4 && !formData.phone.trim()) { alert("Inserisci il numero di telefono."); return false; }
    return true;
}
function showSpinner() { document.getElementById('myForm').style.display = 'none'; document.getElementById('spinner-container').style.display = 'block'; }
function showForm() { document.getElementById('myForm').style.display = 'block'; document.getElementById('spinner-container').style.display = 'none'; }

async function handleFeedbackSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('#feedbackName').value;
    const rating = form.querySelector('#ratingInput').value;
    const comment = form.querySelector('#feedbackMessage').value;
    if (rating === '0') {
        alert('Per favore, seleziona una valutazione da 1 a 5 stelle.');
        return;
    }
    const { error } = await _supabase.from('feedback').insert({
        user_id: currentUser.id,
        name: name,
        rating: parseInt(rating),
        comment: comment
    });
    if (error) {
        console.error('Errore feedback:', error);
        alert('Si è verificato un errore. Riprova.');
        console.log();
    } else {
        window.location.href = 'thankyou2.html';
        console.log();
    }
}

// --- Funzioni Carosello ---
function moveCarousel(direction) {
    const cards = document.querySelectorAll('.carousel-card');
    if (cards.length === 0) return;
    const totalCards = cards.length;
    currentCarouselIndex = (currentCarouselIndex + direction + totalCards) % totalCards;
    updateCarousel();
}

function updateCarousel() {
    const track = document.querySelector('.carousel-track');
    const container = document.querySelector('.carousel-track-container');
    if (track && container) {
        const cardWidth = container.clientWidth;
        track.style.transform = `translateX(-${currentCarouselIndex * cardWidth}px)`;
    }
}

// --- Funzione Feedback Stelle ---
function setRating(rating) {
    const stars = document.querySelectorAll('.star-rating i');
    document.getElementById('ratingInput').value = rating;
    stars.forEach((star, index) => {
        star.classList.remove('fas', 'fa-regular');
        if (index < rating) {
            star.classList.add('fas');
        } else {
            star.classList.add('fa-regular');
        }
    });
}

// --- Logica Autenticazione ---
function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; renderLoginForm(); }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

function renderLoginForm() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.innerHTML = `
            <h3>Login</h3>
            <form id="login-form" class="auth-form">
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <div id="auth-error"></div>
                <button type="submit">Accedi</button>
            </form>
            <p style="text-align:center;" id="auth-toggle" onclick="renderSignupForm()">Non hai un account? Registrati</p>
            <p style="text-align:center;"><a href="forgot-password.html">Password dimenticata?</a></p>
        `;
        document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    }
}

function renderSignupForm() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.innerHTML = `<h3>Crea un Account</h3><form id="signup-form" class="auth-form"><input type="text" id="signup-name" placeholder="Nome e Cognome" required><input type="email" id="signup-email" placeholder="Email" required><input type="password" id="signup-password" placeholder="Password (min. 6 caratteri)" required><div id="auth-error"></div><button type="submit">Registrati</button></form><p id="auth-toggle" onclick="renderLoginForm()">Hai già un account? Accedi</p>`;
        document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = '';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
        errorDiv.textContent = "Credenziali non valide. Riprova.";
    } else {
        closeAuthModal();
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = '';
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const { error } = await _supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
    });
    if (error) {
        errorDiv.textContent = "Errore: l'utente potrebbe già esistere o la password è debole.";
    } else {
        alert("Registrazione quasi completata! Controlla la tua email per confermare l'account.");
        renderLoginForm();
    }
}

// Funzione AGGIORNATA per mostrare le richieste all'utente
async function showMyRequests() {
    if (!currentUser) return;
    showSection('myRequests');
    const listContainer = document.getElementById('my-requests-list');
    if (!listContainer) return;

    listContainer.innerHTML = "<p>Caricamento richieste in corso...</p>";

    const { data, error } = await _supabase
        .from('requests')
        .select('created_at, issue, status')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Errore recupero richieste:", error);
        listContainer.innerHTML = "<p>Impossibile caricare le richieste.</p>";
        return;
    }

    if (data.length === 0) {
        listContainer.innerHTML = "<p>Non hai ancora effettuato richieste di assistenza.</p>";
        return;
    }

    listContainer.innerHTML = data.map(req => {
        const statusClass = req.status.toLowerCase().replace(/ /g, '-');

        return `
        <div class="request-card">
            <h4>Richiesta del ${new Date(req.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</h4>
            <p><strong>Problema:</strong> ${req.issue}</p>
            <p><strong>Stato:</strong> 
                <span class="status ${statusClass}">
                    ${req.status}
                </span>
            </p>
        </div>
    `}).join('');
}

// ==========================================================
// == FUNZIONI AGGIUNTE PER IL POPUP DELLE IMMAGINI        ==
// ==========================================================
function openImagePopup(src) {
    const popup = document.getElementById('image-popup');
    const popupImg = document.getElementById('popup-img');

    if (popup && popupImg) {
        popupImg.src = src;
        popup.style.display = 'flex';
    }
}

function closeImagePopup() {
    const popup = document.getElementById('image-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

