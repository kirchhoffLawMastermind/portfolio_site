// Séquence de storytelling pilotée par le scroll (ScrollTrigger + Lenis).
// Appelée une fois la phase 0 atteinte (fin du preloader) : à ce moment le nom est
// déjà en bas-gauche et l'image en haut-droite, ce qui sert d'état de départ (scroll = 0).
export function initStory() {
    if (window.__storyReady) return;
    window.__storyReady = true;

    gsap.registerPlugin(ScrollTrigger);

    const heroName = document.getElementById("hero-name");
    const introImg = document.getElementById("intro-img");

    const W = window.innerWidth;
    const H = window.innerHeight;
    const marginPx = W * 0.01;

    const textWidth = heroName.offsetWidth || 1;
    const textHeight = heroName.offsetHeight || 1;

    // ÉTAT FINAL du nom : haut-gauche, largeur = 2 bandes (~38vw) — identique à l'ancien rendu final
    const scaleF = (W * 0.38) / textWidth;
    const scaledWF = textWidth * scaleF;
    const scaledHF = textHeight * scaleF;
    const leftFVW = (marginPx + (scaledWF / 2)) / W * 100;
    const topFVH = (marginPx + (scaledHF / 2)) / H * 100;

    // ÉTAT FINAL de l'image : bas-droite, largeur = 2 bandes (40vw), hauteur selon le ratio
    const ar = (introImg.naturalWidth || 2000) / (introImg.naturalHeight || 1500);
    const finalImgH = (W * 0.40) / ar;     // hauteur rendue à 40vw de large (px)
    const finalImgTop = H - finalImgH;      // collée au bas de l'écran (px)

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: () => "+=" + (window.innerHeight * 4.0),
            scrub: 1
        }
    });

    // ───────────────────── PHASE 1 (0 → 1) ─────────────────────
    // Les liens d'intro disparaissent dès qu'on commence à scroller
    tl.to("#intro-links", {
        opacity: 0,
        pointerEvents: "none",
        ease: "power1.in",
        duration: 0.15
    }, 0)
    // Le nom monte en haut-gauche et rétrécit à 2 bandes
    .to(heroName, {
        top: topFVH + "vh",
        left: leftFVW + "vw",
        scale: scaleF,
        ease: "none",
        duration: 1
    }, 0)
    // Simultanément l'image descend en bas-droite et grandit à 2 bandes (hauteur incluse)
    .to(introImg, {
        top: finalImgTop,
        width: "40vw",
        ease: "none",
        duration: 1
    }, 0)

    // ─────────────── PHASE 1b (1 → ~1.9) : image arrivée en bas ───────────────
    // Une fois l'image posée en bas, le texte d'intro se révèle mot par mot
    .to(".intro-word", {
        opacity: 1,
        y: 0,
        ease: "power1.out",
        stagger: { each: 0.025, from: "start" },
        duration: 0.6
    }, 1.05)

    // ───────────────────── PHASE 2 (2 → ~3.7) ─────────────────────
    // L'image disparaît d'abord
    .to(introImg, {
        opacity: 0,
        y: "12vh",
        duration: 0.45,
        ease: "power1.in"
    }, 2.0)
    // Puis le texte d'intro disparaît entièrement (même animation, inversée)
    .to(".intro-word", {
        opacity: 0,
        y: 20,
        stagger: { each: 0.01, from: "start" },
        duration: 0.4,
        ease: "power1.in"
    }, 2.45)

    // ─────────── Une fois le texte d'intro totalement effacé (~3.2) ───────────
    // Les logos et le bouton Infos apparaissent (à leur emplacement actuel)
    .to([".top-nav-container", ".logos-fixed-wrapper"], {
        opacity: 1,
        pointerEvents: "auto",
        duration: 0.5,
        ease: "power1.out"
    }, 3.2)
    // En même temps : la bande des projets apparaît (identique à l'actuelle)
    .to(".portfolio-wrapper", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
    }, 3.25)
    // L'autre texte (bio) réapparaît directement à son emplacement final
    .to(".bio-word", {
        opacity: 1,
        y: 0,
        stagger: { each: 0.02, from: "start" },
        duration: 0.5,
        ease: "power1.out"
    }, 3.3);

    ScrollTrigger.refresh();
}
