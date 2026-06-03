// ======== CONFIGURAZIONE SUPABASE ========
const SUPABASE_URL = 'https://cokvbsvzjlymfifbause.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNva3Zic3Z6amx5bWZpZmJhdXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MzkwNjIsImV4cCI6MjA5NjAxNTA2Mn0.40KHTfFsnUWD8y9TRlqaVfIYECOrIxSyFeWpjHoNvY8';


const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
    // Leggi il token dall'URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');

    if (type === 'recovery' && access_token) {
        // Imposta la sessione con il token di recovery
        const { error } = await _supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || access_token
        });

        if (error) {
            document.getElementById('reset-error').textContent = 'Link non valido o scaduto.';
            return;
        }
    } else {
        document.getElementById('reset-error').textContent = 'Link non valido o scaduto.';
        return;
    }

    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorDiv = document.getElementById('reset-error');
            errorDiv.textContent = '';

            if (newPassword !== confirmPassword) {
                errorDiv.textContent = 'Le password non corrispondono.';
                return;
            }

            if (newPassword.length < 6) {
                errorDiv.textContent = 'La password deve avere almeno 6 caratteri.';
                return;
            }

            const { error } = await _supabase.auth.updateUser({ password: newPassword });

            if (error) {
                errorDiv.textContent = `Errore: ${error.message}`;
            } else {
                alert('Password aggiornata con successo! Ora puoi accedere con la nuova password.');
                window.location.href = '/';
            }
        });
    }
});
