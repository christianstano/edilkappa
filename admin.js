const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allRequests = [];
let allFeedback = [];

document.addEventListener("DOMContentLoaded", async () => {
    // --- CONTROLLO DI AUTORIZZAZIONE ---
    const { data: { user } } = await _supabase.auth.getUser();

    // 1. Reindirizza se l'utente non è loggato
    if (!user) {
        alert("Accesso non autorizzato. Effettua il login.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Controlla il ruolo dell'utente dalla tabella 'profiles'
    const { data: profile, error: profileError } = await _supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || !profile.is_admin) {
        alert("Accesso negato. Non disponi dei permessi di amministratore.");
        window.location.href = 'index.html';
        return;
    }

    // Se i controlli passano, esegui il resto del codice per caricare la pagina
    console.log("Accesso amministratore consentito.");

    // --- INIZIALIZZAZIONE DELLA PAGINA ADMIN ---
    loadAllRequests();
    loadAllFeedback();

    document.getElementById('exportRequestsBtn')?.addEventListener('click', exportRequestsToCSV);
    document.getElementById('exportFeedbackBtn')?.addEventListener('click', exportFeedbackToCSV);

    document.getElementById('requests-container')?.addEventListener('change', async (event) => {
        if (event.target.classList.contains('status-select')) {
            const requestId = event.target.dataset.id;
            const newStatus = event.target.value;
            await updateStatus(requestId, newStatus);
        }
    });

    // Listener per il logout (aggiunto per completezza)
    document.getElementById('logout-admin-btn')?.addEventListener('click', async () => {
        await _supabase.auth.signOut();
        window.location.href = 'index.html';
    });
});

// ==========================================================
// == FUNZIONI PER LE RICHIESTE                              ==
// ==========================================================
async function loadAllRequests() {
    const container = document.getElementById('requests-container');
    if (!container) return;

    container.innerHTML = `<p class="loading">Caricamento richieste in corso...</p>`;

    const { data, error } = await _supabase.rpc('get_all_requests');

    if (error) {
        console.error("Errore nel caricare le richieste:", error);
        container.innerHTML = `<p class="error">Errore nel caricamento delle richieste. Assicurati che l'utente sia autorizzato.</p>`;
        return;
    }

    allRequests = data;

    if (data.length === 0) {
        container.innerHTML = `<p>Nessuna richiesta di assistenza trovata.</p>`;
        return;
    }

    container.innerHTML = data.map(req => `
        <div class="item-card">
            <h3>Richiesta di: ${req.name}</h3>
            <p><strong>Data:</strong> ${new Date(req.created_at).toLocaleString('it-IT')}</p>
            <p><strong>Telefono:</strong> ${req.phone}</p>
            <p><strong>Problema:</strong> ${req.issue}</p>
            ${req.photo_url ? `<p><strong>Foto:</strong> <a href="#" onclick="openImagePopup('${req.photo_url}'); return false;">Visualizza</a></p>` : ''}
            <div>
                <label for="status-${req.id}">Stato:</label>
                <select id="status-${req.id}" class="status-select" data-id="${req.id}">
                    <option value="In attesa" ${req.status === 'In attesa' ? 'selected' : ''}>In attesa</option>
                    <option value="Presa in Carico" ${req.status === 'Presa in Carico' ? 'selected' : ''}>Presa in Carico</option>
                    <option value="Completato" ${req.status === 'Completato' ? 'selected' : ''}>Completato</option>
                </select>
            </div>
        </div>
    `).join('');
}

async function updateStatus(requestId, newStatus) {
    const { error } = await _supabase.rpc('update_request_status', {
        request_id: requestId,
        new_status: newStatus
    });

    if (error) {
        alert("Errore nell'aggiornamento della richiesta.");
        console.error("Errore RPC 'update_request_status':", error);
    } else {
        loadAllRequests();
    }
}

// ==========================================================
// == FUNZIONI PER I FEEDBACK                                ==
// ==========================================================
async function loadAllFeedback() {
    const container = document.getElementById('feedback-container');
    if (!container) return;

    container.innerHTML = `<p class="loading">Caricamento feedback in corso...</p>`;

    const { data, error } = await _supabase.rpc('get_all_feedback');

    if (error) {
        console.error("Errore nel caricare i feedback:", error);
        container.innerHTML = `<p class="error">Errore nel caricamento dei feedback. Assicurati che l'utente sia autorizzato.</p>`;
        return;
    }

    allFeedback = data;

    if (data.length === 0) {
        container.innerHTML = `<p>Nessun feedback trovato.</p>`;
        return;
    }
    container.innerHTML = data.map(fb => `
        <div class="item-card">
            <h3>Feedback di: ${fb.name}</h3>
            <p><strong>Data:</strong> ${new Date(fb.created_at).toLocaleString('it-IT')}</p>
            <p><strong>Valutazione:</strong> <span class="rating-display">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span></p>
            <p><strong>Commento:</strong> ${fb.comment}</p>
        </div>
    `).join('');
}

// ==========================================================
// == FUNZIONI PER L'ESPORTAZIONE IN CSV                   ==
// ==========================================================
function escapeCSV(str) {
    if (str === null || str === undefined) return '';
    let result = String(str);
    if (result.includes(',') || result.includes('"') || result.includes('\n')) {
        result = result.replace(/"/g, '""');
        result = `"${result}"`;
    }
    return result;
}

function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function exportRequestsToCSV() {
    if (allRequests.length === 0) {
        alert("Nessuna richiesta da esportare.");
        return;
    }

    const headers = ["ID", "Data", "Nome", "Telefono", "Problema", "Stato"];
    const rows = allRequests.map(req => [
        req.id,
        new Date(req.created_at).toLocaleString('it-IT'),
        req.name,
        req.phone,
        req.issue,
        req.status
    ].map(escapeCSV).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, 'richieste_edilkappa.csv');
}

function exportFeedbackToCSV() {
    if (allFeedback.length === 0) {
        alert("Nessun feedback da esportare.");
        return;
    }

    const headers = ["ID", "Data", "Nome", "Valutazione", "Commento"];
    const rows = allFeedback.map(fb => [
        fb.id,
        new Date(fb.created_at).toLocaleString('it-IT'),
        fb.name,
        fb.rating,
        fb.comment
    ].map(escapeCSV).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, 'feedback_edilkappa.csv');
}

// ==========================================================
// == FUNZIONI POPUP IMMAGINI                                ==
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
