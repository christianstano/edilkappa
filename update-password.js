const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById('update-password-form')?.addEventListener('submit', handleUpdatePassword);

async function handleUpdatePassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('new-password-input').value;
    const messageDiv = document.getElementById('auth-message');
    messageDiv.textContent = '';

    const { error } = await _supabase.auth.updateUser({ password: newPassword });

    if (error) {
        console.error('Errore aggiornamento password:', error);
        messageDiv.textContent = 'Si è verificato un errore. Riprova.';
        messageDiv.style.color = 'red';
    } else {
        messageDiv.textContent = 'Password aggiornata con successo! Verrai reindirizzato alla pagina principale.';
        messageDiv.style.color = 'green';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}
