import { initPreloader } from './preloader.js';
import { initCards } from './cards.js';
import { initModal } from './modal.js';

document.addEventListener("DOMContentLoaded", () => {

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: true,
    })

    window.lenis = lenis;

    function raf(time) {
        lenis.raf(time)
        requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    initModal();
    initCards().then(() => {
        initPreloader();
    });
});