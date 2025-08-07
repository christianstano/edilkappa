const SUPABASE_URL = 'https://rcfrdacrsnufecelbhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnJkYWNyc251ZmVjZWxiaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTIxNjEsImV4cCI6MjA2NzU2ODE2MX0.jMwrZ7SftZMpxixb3gBMo883uE8SVC1XecFvknw9da4';

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
