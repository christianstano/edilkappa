const SUPABASE_URL = 'https://cokvbsvzjlymfifbause.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNva3Zic3Z6amx5bWZpZmJhdXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MzkwNjIsImV4cCI6MjA5NjAxNTA2Mn0.40KHTfFsnUWD8y9TRlqaVfIYECOrIxSyFeWpjHoNvY8';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById('forgot-password-form')?.addEventListener('submit', handleForgotPassword);

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    const messageDiv = document.getElementById('auth-message');
    messageDiv.textContent = '';
    
    const { error } = await _supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password.html`
    });

    if (error) {
        console.error('Errore reset password:', error);
        messageDiv.textContent = 'Si è verificato un errore. Assicurati che l\'email sia corretta.';
        messageDiv.style.color = 'red';
    } else {
        messageDiv.textContent = 'Se l\'email esiste, riceverai un link per reimpostare la password.';
        messageDiv.style.color = 'green';
    }
}
