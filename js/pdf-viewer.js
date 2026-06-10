(function () {
  // Chemins réels des carnets, indexés sur l'id projet de projects.json
  const PDF_PATHS = {
    1: 'assets/doc/Carnet_CONCEVOIR_Arthur_Malan.pdf',
    2: 'assets/doc/Carnet_VERIFIER_Arthur_Malan.pdf',
    3: 'assets/doc/Carnet_MAINTENIR_Arthur_Malan.pdf',
    4: 'assets/doc/Carnet_IMPLANTER_Arthur_Malan.pdf',
  };
  const PDF_LABELS = {
    1: 'C1 — Concevoir',
    2: 'C2 — Vérifier & Valider',
    3: 'C3 — Maintenir',
    4: 'C4 — Implanter & Mettre en service',
  };

  const trigger       = document.getElementById('pdf-trigger');
  const modal         = document.getElementById('pdf-modal');
  const modalContent  = modal && modal.querySelector('.pdf-modal-content');
  const pdfFrame      = document.getElementById('pdf-frame');
  const pdfDownload   = document.getElementById('pdf-download');
  const pdfFallback   = document.getElementById('pdf-fallback-link');
  const pdfLabel      = document.getElementById('pdf-label');
  const pdfModalLabel = document.getElementById('pdf-modal-label');
  const closeBtn      = document.getElementById('pdf-modal-close');
  const pdfSection    = document.getElementById('pdf-section');
  const titleEl       = document.getElementById('project-view-title');
  const closeProject  = document.getElementById('close-project');

  if (!trigger || !modal || !titleEl) return;

  pdfSection.style.display = 'none';

  // ── Lit l'id projet depuis le titre affiché ─────────────────────────────
  function getIdFromTitle() {
    const match = titleEl.textContent.match(/C(\d)/);
    return match ? parseInt(match[1], 10) : null;
  }

  // ── Met à jour labels/liens quand un projet s'ouvre ────────────────────
  function setPdf(id) {
    const path  = PDF_PATHS[id];
    const label = PDF_LABELS[id];
    if (!path) { pdfSection.style.display = 'none'; return; }

    if (pdfLabel)      pdfLabel.textContent     = label;
    if (pdfModalLabel) pdfModalLabel.textContent = label;
    if (pdfDownload)   pdfDownload.href          = path;
    if (pdfFallback)   pdfFallback.href          = path;
    modal.dataset.pdfPath = path;
    pdfSection.style.display = '';
  }

  // ── Ouvre la modale ─────────────────────────────────────────────────────
  function openModal() {
    const path = modal.dataset.pdfPath;
    if (!path) return;
    if (pdfFrame.data !== path) pdfFrame.data = path;

    gsap.set(modal, { visibility: 'visible', pointerEvents: 'auto' });
    gsap.set(modalContent, { pointerEvents: 'auto' });
    gsap.fromTo(modalContent,
      { opacity: 0, y: '6vh' },
      { opacity: 1, y: '0vh', duration: 0.65, ease: 'power4.out' }
    );
    gsap.to('#project-view', { filter: 'blur(12px)', opacity: 0.25, duration: 0.5, ease: 'power2.out' });
  }

  // ── Ferme la modale ─────────────────────────────────────────────────────
  function closeModal() {
    gsap.to(modalContent, {
      opacity: 0, y: '4vh', duration: 0.4, ease: 'power3.in',
      onComplete: () => {
        gsap.set(modal, { visibility: 'hidden', pointerEvents: 'none' });
        gsap.set(modalContent, { pointerEvents: 'none' });
      }
    });
    gsap.to('#project-view', {
      filter: 'blur(0px)', opacity: 1, duration: 0.5, ease: 'power2.out',
      onComplete: () => gsap.set('#project-view', { clearProps: 'filter,opacity' })
    });
  }

  // ── Listeners ───────────────────────────────────────────────────────────
  trigger.addEventListener('click', openModal);
  closeBtn   && closeBtn.addEventListener('click', closeModal);
  closeProject && closeProject.addEventListener('click', () => {
    if (modal.style.visibility === 'visible') closeModal();
    pdfFrame.data = '';
    pdfSection.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (!e.target.closest('.pdf-modal-content')) closeModal();
  });

  // ── Observer sur le TITRE : signal fiable qu'un projet a été ouvert ─────
  // renderProjectDetails() dans cards.js écrit le titre de façon synchrone
  // avant que GSAP n'anime le panel — le titre est donc déjà là quand on lit.
  new MutationObserver(() => {
    const id = getIdFromTitle();
    if (id) setPdf(id);
    else { pdfSection.style.display = 'none'; pdfFrame.data = ''; }
  }).observe(titleEl, { childList: true, characterData: true, subtree: true });
})();
