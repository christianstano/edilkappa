// ======== CONFIGURAZIONE SUPABASE ========
// INSERISCI QUI GLI STESSI DATI DI script.js
const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co'; // Sostituisci con il tuo URL del progetto Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4'; // Sostituisci con la tua chiave anon pubblica

// ======== IMPOSTAZIONE ADMIN ========
// INSERISCI L'EMAIL DELL'UTENTE CHE SARÀ L'AMMINISTRATORE
const ADMIN_EMAIL = "christianstano450@gmail.com";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session || session.user.email !== ADMIN_EMAIL) {
        alert("Accesso non autorizzato. Verrai reindirizzato alla pagina principale.");
        window.location.href = 'index.html';
        return;
    }

    loadAllRequests();
    loadAllFeedback();

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await _supabase.auth.signOut();
        window.location.href = 'index.html';
    });
});

async function loadAllRequests() {
    const container = document.getElementById('requests-container');
    const { data, error } = await _supabase.rpc('get_all_requests');

    if (error) {
        console.error("Errore nel caricare le richieste:", error);
        container.innerHTML = `<p class="error">Errore nel caricamento delle richieste. Assicurati che la funzione RPC 'get_all_requests' sia stata creata in Supabase.</p>`;
        return;
    }
    if (data.length === 0) {
        container.innerHTML = `<p>Nessuna richiesta di assistenza trovata.</p>`;
        return;
    }
    container.innerHTML = data.map(req => `
        <div class="item-card ${req.is_completed ? 'completed' : ''}" id="req-${req.id}">
            <h3>Richiesta di: ${req.name}</h3>
            <p><strong>Data:</strong> ${new Date(req.created_at).toLocaleString('it-IT')}</p>
            <p><strong>Telefono:</strong> <a href="tel:${req.phone}">${req.phone}</a></p>
            <p><strong>Problema:</strong> ${req.issue}</p>
            ${req.photo_url ? `<p><strong>Foto:</strong> <a href="${req.photo_url}" target="_blank">Visualizza immagine</a></p>` : ''}
            <div class="actions">
                <button class="complete-btn" onclick="markAsCompleted(${req.id})" ${req.is_completed ? 'disabled' : ''}>
                    ${req.is_completed ? 'Completato' : 'Contrassegna come completato'}
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAllFeedback() {
    const container = document.getElementById('feedback-container');
    const { data, error } = await _supabase.rpc('get_all_feedback');

    if (error) {
        console.error("Errore nel caricare i feedback:", error);
        container.innerHTML = `<p class="error">Errore nel caricamento dei feedback. Assicurati che la funzione RPC 'get_all_feedback' sia stata creata in Supabase.</p>`;
        return;
    }
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
// == FUNZIONE DI AGGIORNAMENTO - CORRETTA
// ==========================================================
async function markAsCompleted(requestId) {
    // Chiama la nuova funzione RPC sicura per eseguire l'aggiornamento
    const { error } = await _supabase.rpc('mark_request_completed', {
        request_id: requestId
    });

    if (error) {
        alert("Errore nell'aggiornamento della richiesta. Controlla la console per i dettagli.");
        console.error("Errore RPC 'mark_request_completed':", error);
    } else {
        // Se l'aggiornamento nel database va a buon fine,
        // aggiorna l'interfaccia utente.
        const card = document.getElementById(`req-${requestId}`);
        const button = card.querySelector('.complete-btn');
        card.classList.add('completed');
        button.textContent = 'Completato';
        button.disabled = true;
    }
}