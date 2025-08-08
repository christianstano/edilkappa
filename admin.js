// ======== CONFIGURAZIONE SUPABASE ========
const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funzione di inizializzazione per la pagina admin
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html'; // Reindirizza se non autenticato
        return;
    }

    const { data: profile, error: profileError } = await _supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (profileError || !profile.is_admin) {
        alert("Accesso negato. Non sei un amministratore.");
        window.location.href = 'index.html';
        return;
    }

    // Carica i dati una volta verificato l'accesso
    loadAllRequests();
    loadAllFeedback();

    // Gestione eventi
    document.getElementById('logout-admin-btn')?.addEventListener('click', logoutAdmin);
    document.getElementById('export-requests-btn')?.addEventListener('click', exportRequestsToCSV);
    document.getElementById('export-feedback-btn')?.addEventListener('click', exportFeedbackToCSV);
});

// Funzione corretta per il logout dell'admin
async function logoutAdmin() {
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error('Errore durante il logout:', error);
        alert('Si è verificato un errore durante il logout.');
    } else {
        window.location.href = 'index.html';
    }
}

// Funzione per caricare tutte le richieste con barra laterale colorata
async function loadAllRequests() {
    const listContainer = document.getElementById('requests-list');
    if (!listContainer) return;

    listContainer.innerHTML = "<p>Caricamento richieste in corso...</p>";

    const { data, error } = await _supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Errore recupero richieste admin:", error);
        listContainer.innerHTML = "<p>Impossibile caricare le richieste.</p>";
        return;
    }

    if (data.length === 0) {
        listContainer.innerHTML = "<p>Nessuna richiesta di assistenza presente.</p>";
        return;
    }

    listContainer.innerHTML = data.map(req => {
        const statusClass = req.status.toLowerCase().replace(/ /g, '-');
        return `
            <div class="item-card status-${statusClass}">
                <h3>Richiesta del ${new Date(req.created_at).toLocaleDateString('it-IT')}</h3>
                <p><strong>Utente:</strong> ${req.name}</p>
                <p><strong>Problema:</strong> ${req.issue}</p>
                <p><strong>Telefono:</strong> ${req.phone || 'N.D.'}</p>
                ${req.photo_url ? `<p><strong>Foto:</strong> <a href="#" onclick="openImagePopup('${req.photo_url}'); return false;">Visualizza</a></p>` : ''}
                <div class="status-container">
                    <label for="status-select-${req.id}">Stato:</label>
                    <select id="status-select-${req.id}" class="status-select" onchange="updateRequestStatus('${req.id}', this.value)">
                        <option value="In attesa" ${req.status === 'In attesa' ? 'selected' : ''}>In attesa</option>
                        <option value="Presa in carico" ${req.status === 'Presa in carico' ? 'selected' : ''}>Presa in carico</option>
                        <option value="Completato" ${req.status === 'Completato' ? 'selected' : ''}>Completato</option>
                    </select>
                </div>
            </div>
        `}).join('');
}

// Funzione per caricare tutti i feedback
async function loadAllFeedback() {
    const listContainer = document.getElementById('feedback-list');
    if (!listContainer) return;

    listContainer.innerHTML = "<p>Caricamento feedback in corso...</p>";

    const { data, error } = await _supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Errore recupero feedback admin:", error);
        listContainer.innerHTML = "<p>Impossibile caricare i feedback.</p>";
        return;
    }

    if (data.length === 0) {
        listContainer.innerHTML = "<p>Nessun feedback presente.</p>";
        return;
    }

    listContainer.innerHTML = data.map(fb => `
        <div class="item-card">
            <h3>Feedback da ${fb.name}</h3>
            <p><strong>Data:</strong> ${new Date(fb.created_at).toLocaleDateString('it-IT')}</p>
            <p><strong>Valutazione:</strong>
                <span class="rating-display">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
            </p>
            <p><strong>Commento:</strong> ${fb.comment || 'Nessun commento.'}</p>
        </div>
    `).join('');
}

// Funzione per aggiornare lo stato di una richiesta (CORRETTA)
async function updateRequestStatus(requestId, newStatus) {
    // Esegui la richiesta di aggiornamento in modo asincrono
    const { error } = await _supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', requestId);

    if (error) {
        console.error("Errore aggiornamento stato:", error);
        alert("Errore durante l'aggiornamento dello stato.");
    } else {
        console.log("Stato aggiornato con successo.");
        // Una volta che l'aggiornamento è completato, ricarica la lista per mostrare la modifica
        await loadAllRequests();
    }
}

// Funzione corretta per l'esportazione CSV delle richieste
async function exportRequestsToCSV() {
    const { data, error } = await _supabase
        .from('requests')
        .select('*');

    if (error) {
        console.error("Errore esportazione richieste:", error);
        alert("Errore durante l'esportazione delle richieste.");
        return;
    }

    if (data.length === 0) {
        alert("Non ci sono richieste da esportare.");
        return;
    }

    const headers = ["ID", "Nome Utente", "Problema", "Telefono", "Stato", "Data Creazione", "URL Foto"];
    const rows = data.map(req => [
        req.id,
        req.name,
        req.issue,
        req.phone,
        req.status,
        new Date(req.created_at).toLocaleString(),
        req.photo_url || ''
    ]);

    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `richieste_assistenza_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funzione per l'esportazione CSV dei feedback
async function exportFeedbackToCSV() {
    const { data, error } = await _supabase
        .from('feedback')
        .select('*');

    if (error) {
        console.error("Errore esportazione feedback:", error);
        alert("Errore durante l'esportazione dei feedback.");
        return;
    }

    if (data.length === 0) {
        alert("Non ci sono feedback da esportare.");
        return;
    }

    const headers = ["ID", "Nome Utente", "Valutazione", "Commento", "Data Creazione"];
    const rows = data.map(fb => [
        fb.id,
        fb.name,
        fb.rating,
        fb.comment || '',
        new Date(fb.created_at).toLocaleString()
    ]);

    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funzioni per il popup delle immagini
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
