// Toggle menu mobile
const nav = document.querySelector('nav');
const toggle = document.getElementById('menu-toggle');
toggle.addEventListener('click', () => {
  nav.classList.toggle('open');
});

// Validation simple et feedback
const form = document.getElementById('contact-form');
const feedback = document.querySelector('.feedback');

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) {
    feedback.textContent = 'Merci de remplir tous les champs.';
    feedback.style.color = 'red';
    return;
  }

  feedback.textContent = 'Message envoyé avec succès !'; 
  feedback.style.color = 'green';
  form.reset();
});
