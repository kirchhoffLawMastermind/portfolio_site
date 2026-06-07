import { initStory } from './story.js';

// Découpe le texte d'un élément en mots stylisés (dégradé continu) prêts à être
// animés mot par mot. Chaque mot démarre invisible et légèrement décalé vers le bas.
function prepareWords(selector, wordClass) {
    const el = document.querySelector(selector);
    if (!el) return;

    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(word =>
        `<span class="${wordClass}" style="display:inline-block; opacity:0; transform:translateY(20px); margin-right:0.25em;">${word}</span>`
    ).join("");

    const wordEls = el.querySelectorAll(`.${wordClass}`);
    const containerWidth = el.offsetWidth;

    // Aligne le dégradé pour qu'il soit continu sur toute la ligne de texte
    wordEls.forEach(word => {
        const leftOffset = word.offsetLeft;
        word.style.backgroundSize = `${containerWidth}px auto`;
        word.style.backgroundPosition = `-${leftOffset}px 0px`;
    });
}

export async function initPreloader() {

    if (document.fonts) {
        await document.fonts.ready;
    }

    const heroName = document.getElementById("hero-name");

    const textWidth = heroName.offsetWidth || 1;
    const textHeight = heroName.offsetHeight || 1;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const initialScale = (windowWidth * 0.20) / textWidth;

    const marginPx = windowWidth * 0.01;

    // PHASE 0 : le nom se pose en BAS À GAUCHE, sur la largeur des 3 premières bandes (~58vw)
    const scale0 = (windowWidth * 0.58) / textWidth;
    const scaledW0 = textWidth * scale0;
    const scaledH0 = textHeight * scale0;
    const left0VW = (marginPx + (scaledW0 / 2)) / windowWidth * 100;
    const bottom0VH = (windowHeight - marginPx - (scaledH0 / 2)) / windowHeight * 100;

    // Dégradé lettre par lettre pour le nom
    const text = heroName.textContent;
    const totalChars = text.length;

    heroName.innerHTML = text.split("").map((char, index) => {
        const percent = totalChars > 1 ? (index / (totalChars - 1)) * 100 : 0;
        const bgSize = `${totalChars * 100}% 100%`;
        const bgPos = `${percent}% 0%`;
        return `<span style="display:inline-block; background-size: ${bgSize}; background-position: ${bgPos};">${char === " " ? "&nbsp;" : char}</span>`;
    }).join("");

    const letters = heroName.querySelectorAll("span");

    gsap.set(heroName, { xPercent: -50, yPercent: -50, top: "50%", left: "50%", scale: initialScale });
    // Le nom est positionné/échelonné et ses lettres sont à opacity 0 : on peut révéler
    // le conteneur sans flash (masqué via CSS jusqu'ici).
    gsap.set(".preloader", { visibility: "visible" });

    gsap.set("#main-content", { visibility: "visible" });

    // Préparation des deux blocs de texte (révélés plus tard, au scroll)
    prepareWords(".bio-text", "bio-word");
    prepareWords(".intro-paragraph", "intro-word");
    // Les mots d'intro sont prêts (opacity 0) : on peut rendre le conteneur visible sans flash.
    gsap.set("#intro-text", { visibility: "visible" });

    // États initiaux des éléments qui n'apparaissent qu'en phase 2 du scroll
    gsap.set(["#intro-img", "#intro-links"], { opacity: 0 });
    gsap.set(".portfolio-wrapper", { opacity: 0, y: "45vh" });
    gsap.set([".top-nav-container", ".logos-fixed-wrapper"], { opacity: 0, y: 0, pointerEvents: "none" });

    const tl = gsap.timeline();

    tl.to(".bg-grid .line .border", {
        scaleY: 1,
        duration: 1.5,
        ease: "power3.inOut"
    }, 0)
    .fromTo(letters,
        { opacity: 0, filter: "blur(20px)", scale: 1.2 },
        { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.04 },
        0
    )
    .addLabel("move")
    // Le nom glisse vers son emplacement de phase 0 (bas-gauche, 3 bandes)
    .to(heroName, {
        top: bottom0VH + "vh",
        left: left0VW + "vw",
        scale: scale0,
        duration: 1.2,
        ease: "power4.inOut",
        force3D: true
    }, "move")
    // L'image d'intro et les liens se révèlent en haut-droite
    .to(["#intro-img", "#intro-links"], {
        opacity: 1,
        duration: 1.0,
        ease: "power2.out"
    }, "move+=0.2")
    .eventCallback("onComplete", () => {
        // Une fois la phase 0 atteinte, on libère le scroll et on monte la séquence storytelling
        document.body.style.overflowY = "auto";
        gsap.set(".preloader", { pointerEvents: "none" });
        window.preloaderFinished = true;
        initStory();
        if (window.lenis) window.lenis.start();
    });
}
