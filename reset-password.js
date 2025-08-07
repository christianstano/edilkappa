// ======== CONFIGURAZIONE SUPABASE ========
const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    // Seleziona il modulo di reset della password
    const resetForm = document.getElementById('reset-password-form');

    // Assicurati che il modulo esista prima di aggiungere il listener
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorDiv = document.getElementById('reset-error');
            errorDiv.textContent = ''; // Pulisci eventuali errori precedenti

            // 1. Controlla che le password corrispondano
            if (newPassword !== confirmPassword) {
                errorDiv.textContent = "Le password non corrispondono.";
                return;
            }

            // 2. Controlla la lunghezza minima della password
            if (newPassword.length < 6) {
                errorDiv.textContent = "La password deve avere almeno 6 caratteri.";
                return;
            }

            // 3. Aggiorna la password in Supabase
            // Questa chiamata sfrutta la sessione temporanea creata dal token di reset
            const { error } = await _supabase.auth.updateUser({ password: newPassword });

            if (error) {
                console.error("Errore durante l'aggiornamento della password:", error);
                errorDiv.textContent = `Si è verificato un errore: ${error.message}`;
            } else {
                alert("Password aggiornata con successo! Ora puoi accedere con la nuova password.");
                window.location.href = '/'; // Reindirizza l'utente alla homepage dopo il successo
            }
        });
    }
});
