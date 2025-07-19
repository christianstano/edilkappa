// ======== CONFIGURAZIONE SUPABASE ========
const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4';

// ======== IMPOSTAZIONE ADMIN ========
const ADMIN_EMAIL = "christianstano450@gmail.com";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabili per memorizzare i dati caricati per l'esportazione
let allRequests = [];
let allFeedback = [];

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session || session.user.email !== ADMIN_EMAIL) {
        alert("Accesso non autorizzato.");
        window.location.href = 'index.html';
        return;
    }

    loadAllRequests();
    loadAllFeedback();

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await _supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    // Listener per i bottoni di esportazione
    document.getElementById('export-requests-btn').addEventListener('click', exportRequestsToCSV);
    document.getElementById('export-feedback-btn').addEventListener('click', exportFeedbackToCSV);
});

async function loadAllRequests() {
    const container = document.getElementById('requests-container');
    const { data, error } = await _supabase.rpc('get_all_requests');

    if (error) {
        console.error("Errore nel caricare le richieste:", error);
        container.innerHTML = `<p class="error">Errore nel caricamento.</p>`;
        return;
    }
    
    allRequests = data; // Salva i dati nella variabile globale

    if (data.length === 0) {
        container.innerHTML = `<p>Nessuna richiesta di assistenza trovata.</p>`;
        return;
    }
    container.innerHTML = data.map(req => `
        <div class="item-card status-${req.status.toLowerCase().replace(/ /g, '-')}">
            <h3>Richiesta di: ${req.name}</h3>
            <p><strong>Data:</strong> ${new Date(req.created_at).toLocaleString('it-IT')}</p>
            <p><strong>Telefono:</strong> <a href="tel:${req.phone}">${req.phone}</a></p>
            <p><strong>Problema:</strong> ${req.issue}</p>
            ${req.photo_url ? `<p><strong>Foto:</strong> <a href="${req.photo_url}" target="_blank">Visualizza immagine</a></p>` : ''}
            <div class="actions">
                <label for="status-select-${req.id}">Stato:</label>
                <select id="status-select-${req.id}" class="status-select" onchange="updateStatus(${req.id}, this.value)" ${req.status === 'Completato' ? 'disabled' : ''}>
                    <option value="In Attesa" ${req.status === 'In Attesa' ? 'selected' : ''}>In Attesa</option>
                    <option value="Richiesta Presa in Carico" ${req.status === 'Richiesta Presa in Carico' ? 'selected' : ''}>Presa in Carico</option>
                    <option value="Completato" ${req.status === 'Completato' ? 'selected' : ''}>Completato</option>
                </select>
            </div>
        </div>
    `).join('');
}

async function loadAllFeedback() {
    const container = document.getElementById('feedback-container');
    const { data, error } = await _supabase.rpc('get_all_feedback');

    if (error) {
        console.error("Errore nel caricare i feedback:", error);
        container.innerHTML = `<p class="error">Errore nel caricamento dei feedback.</p>`;
        return;
    }

    allFeedback = data; // Salva i dati nella variabile globale

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
// == FUNZIONI PER L'ESPORTAZIONE IN CSV
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
