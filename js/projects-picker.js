(function () {
    const PROJECTS = [
        {
            path: 'assets/doc/Malan_Arthur_Breizelec_V2.pdf',
            title: 'Breizelec V2',
            subtitle: 'Rapport de projet',
        },
        {
            path: 'assets/doc/SAE-3-arthur-malan.pdf',
            title: 'SAE 3',
            subtitle: 'Rapport',
        },
        {
            path: 'assets/doc/soutenance_malan_breizelec.pdf',
            title: 'Soutenance Breizelec',
            subtitle: 'Support de présentation',
        },
        {
            path: 'assets/doc/soutenance_SAE_Arthur_Malan_A42.pdf',
            title: 'Soutenance SAE A42',
            subtitle: 'Support de présentation',
        },
    ];

    const pickerModal   = document.getElementById('projects-pdf-modal');
    const pickerContent = pickerModal && pickerModal.querySelector('.projects-pdf-content');
    const overlayBg     = pickerModal && pickerModal.querySelector('.projects-pdf-overlay-bg');
    const grid          = document.getElementById('projects-pdf-grid');
    const closeBtn      = document.getElementById('projects-pdf-close');
    const introLink     = document.getElementById('intro-projets');

    if (!pickerModal || !grid || !introLink) return;

    // ── Construit les cartes ────────────────────────────────────────────────
    PROJECTS.forEach((project) => {
        const card = document.createElement('button');
        card.className = 'pdf-proj-card';
        card.innerHTML = `
            <div class="pdf-proj-info">
                <span class="pdf-proj-name">${project.title}</span>
                <span class="pdf-proj-sub">${project.subtitle}</span>
            </div>
            <div class="pdf-proj-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
            </div>
        `;
        card.addEventListener('click', () => openPdf(project));
        grid.appendChild(card);
    });

    // ── Ouvre / ferme le sélecteur ──────────────────────────────────────────
    function openPicker() {
        gsap.set(pickerModal, { visibility: 'visible', pointerEvents: 'auto' });
        gsap.fromTo(overlayBg,
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
        gsap.fromTo(pickerContent,
            { opacity: 0, y: '6vh', pointerEvents: 'none' },
            { opacity: 1, y: '0vh', duration: 0.65, ease: 'power4.out', pointerEvents: 'auto' }
        );
    }

    function closePicker() {
        gsap.to(pickerContent, {
            opacity: 0, y: '4vh', duration: 0.4, ease: 'power3.in',
            onComplete: () => gsap.set(pickerModal, { visibility: 'hidden', pointerEvents: 'none' }),
        });
        gsap.to(overlayBg, { opacity: 0, duration: 0.4, ease: 'power2.in' });
    }

    introLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPicker();
    });

    closeBtn && closeBtn.addEventListener('click', closePicker);

    pickerModal.addEventListener('click', (e) => {
        if (!e.target.closest('.projects-pdf-content')) closePicker();
    });

    // ── Ouvre la visionneuse PDF existante avec le projet sélectionné ───────
    function openPdf(project) {
        closePicker();

        const modal        = document.getElementById('pdf-modal');
        const modalContent = modal && modal.querySelector('.pdf-modal-content');
        const pdfFrame     = document.getElementById('pdf-frame');
        const pdfDownload  = document.getElementById('pdf-download');
        const pdfFallback  = document.getElementById('pdf-fallback-link');
        const pdfLabel     = document.getElementById('pdf-modal-label');

        if (!modal || !pdfFrame) return;

        modal.dataset.pdfPath = project.path;
        if (pdfLabel)    pdfLabel.textContent = project.title;
        if (pdfDownload) pdfDownload.href     = project.path;
        if (pdfFallback) pdfFallback.href     = project.path;
        pdfFrame.data = project.path;

        setTimeout(() => {
            gsap.set(modal, { visibility: 'visible', pointerEvents: 'auto' });
            gsap.set(modalContent, { pointerEvents: 'auto' });
            gsap.fromTo(modalContent,
                { opacity: 0, y: '6vh' },
                { opacity: 1, y: '0vh', duration: 0.65, ease: 'power4.out' }
            );
        }, 380);
    }
})();
