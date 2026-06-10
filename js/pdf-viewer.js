/**
 * pdf-viewer.js
 * Injecte le PDF correspondant à chaque projet quand #project-view devient visible.
 * Aucune modification de main.js nécessaire — fonctionne par observation du DOM.
 */

(function () {
  // ── Config ──────────────────────────────────────────────────────────────
  const PDF_BASE = 'assets/doc/';

  const PDF_FILES = {
    1: 'Carnet_CONCEVOIR_Arthur_Malan.pdf',
    2: 'Carnet_VERIFIER_Arthur_Malan.pdf',
    3: 'Carnet_MAINTENIR_Arthur_Malan.pdf',
    4: 'Carnet_IMPLANTER_Arthur_Malan.pdf',
  };

  const PDF_LABELS = {
    1: 'C1 — Concevoir',
    2: 'C2 — Vérifier & Valider',
    3: 'C3 — Maintenir',
    4: 'C4 — Implanter & Mettre en service',
  };
  // ────────────────────────────────────────────────────────────────────────

  const projectView = document.getElementById('project-view');
  const pdfFrame    = document.getElementById('pdf-frame');
  const pdfDownload = document.getElementById('pdf-download');
  const pdfFallback = document.getElementById('pdf-fallback-link');
  const pdfLabel    = document.getElementById('pdf-label');
  const pdfSection  = document.getElementById('pdf-section');

  if (!projectView || !pdfFrame) return;

  /**
   * Récupère l'id du projet courant.
   * main.js stocke l'id en data-project-id sur #project-view quand il ouvre un projet.
   * Sinon, on tente de déduire l'id depuis le titre affiché (fallback).
   */
  function getCurrentProjectId() {
    // Méthode 1 : data-attribute posé par main.js (si disponible)
    const fromAttr = projectView.dataset.projectId;
    if (fromAttr) return parseInt(fromAttr, 10);

    // Méthode 2 : lire le titre et extraire le numéro (ex: "C3, Maintenir" → 3)
    const titleEl = document.getElementById('project-view-title');
    if (titleEl) {
      const match = titleEl.textContent.match(/C(\d)/);
      if (match) return parseInt(match[1], 10);
    }

    return null;
  }

  function loadPdf(id) {
    if (!id || !PDF_FILES[id]) {
      pdfSection.style.display = 'none';
      return;
    }

    const path = `${PDF_BASE}${PDF_FILES[id]}`;

    pdfFrame.src        = path;
    pdfDownload.href    = path;
    pdfFallback.href    = path;
    pdfLabel.textContent = PDF_LABELS[id] || `Compétence C${id}`;
    pdfSection.style.display = '';
  }

  function clearPdf() {
    pdfFrame.src = '';
    pdfSection.style.display = 'none';
  }

  // ── Observer : surveille l'apparition/disparition de #project-view ──────
  const observer = new MutationObserver(() => {
    const isVisible =
      projectView.classList.contains('active') ||
      projectView.classList.contains('open')   ||
      (projectView.style.display !== 'none' && projectView.offsetParent !== null);

    if (isVisible) {
      // Petit délai pour laisser main.js finir d'injecter le titre
      setTimeout(() => loadPdf(getCurrentProjectId()), 50);
    } else {
      clearPdf();
    }
  });

  observer.observe(projectView, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-project-id'],
  });

  // ── Patch main.js : si main.js expose openProject globalement ────────────
  // On wrappe la fonction pour capturer l'id au moment de l'appel.
  const _originalOpen = window.openProject;
  if (typeof _originalOpen === 'function') {
    window.openProject = function (project, ...rest) {
      _originalOpen(project, ...rest);
      if (project && project.id) loadPdf(project.id);
    };
  }

  // Initialisation : si un projet est déjà ouvert au chargement
  clearPdf();
})();
