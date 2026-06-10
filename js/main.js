import { initPreloader } from './preloader.js';
import { initCards } from './cards.js';
import { initModal } from './modal.js';
import { initWatercolorReveal } from './watercolor-reveal.js';

document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);

    // Enregistré AVANT Lenis : bloque tous les wheel events hors du projet quand un projet est ouvert.
    // Capture phase + window = priorité maximale, stopImmediatePropagation empêche Lenis de recevoir l'event.
    window.addEventListener('wheel', (e) => {
        if (window.isProjectOpen && !e.target.closest('#project-view')) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });

    window.addEventListener('touchmove', (e) => {
        if (window.isProjectOpen && !e.target.closest('#project-view')) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false, // scroll fini : nécessaire pour piloter la séquence storytelling
    })

    window.lenis = lenis;

    // Intégration Lenis <-> ScrollTrigger : un seul ticker, ScrollTrigger suit le scroll de Lenis
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        if (!window.isProjectOpen) lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // On bloque le scroll tant que l'intro (preloader) n'est pas terminée
    lenis.stop();

    // Liens en texte brut de l'intro
    const introInfos = document.getElementById("intro-infos");
    const introCompetences = document.getElementById("intro-competences");
    if (introInfos) {
        introInfos.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("info-btn").click();
        });
    }
    if (introCompetences) {
        introCompetences.addEventListener("click", (e) => {
            e.preventDefault();
            lenis.scrollTo(window.innerHeight * 4.0, { duration: 2 });
        });
    }

    initModal();
    initWatercolorReveal();
    initCards().then(() => {
        initPreloader();
    });
});
