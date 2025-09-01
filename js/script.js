// Menu responsive
const nav = document.querySelector('nav');
const toggle = document.getElementById('menu-toggle');
toggle.addEventListener('click', () => {
  nav.classList.toggle('open');
});

// Animation au scroll
const boxes = document.querySelectorAll('.box, .card');
window.addEventListener('scroll', () => {
  boxes.forEach(box => {
    const rect = box.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      box.style.opacity = 1;
      box.style.transform = 'translateY(0)';
    }
  });
});

// Formulaire
const form = document.getElementById('contact-form');
const feedback = document.querySelector('.feedback');

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) {
    feedback.textContent = 'Veuillez remplir tous les champs.';
    feedback.style.color = 'red';
    return;
  }

  feedback.textContent = 'Message envoyé avec succès !';
  feedback.style.color = 'green';
