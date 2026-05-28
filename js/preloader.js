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

    const finalScale = (windowWidth * 0.38) / textWidth;

    const marginPx = windowWidth * 0.01;

    const finalLeftVW = (marginPx + ((textWidth * finalScale) / 2)) / windowWidth * 100;
    const finalTopVH  = (marginPx + ((textHeight * finalScale) / 2)) / windowHeight * 100;

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

    const tl = gsap.timeline();

    gsap.set("#main-content", { visibility: "visible" });
    // Supprimé car géré par initCards() pour les nouvelles cartes dynamiques
    // gsap.set(".card", { opacity: 0, y: 500 });

    const bioTextEl = document.querySelector(".bio-text");
    if (bioTextEl) {
        const words = bioTextEl.textContent.trim().split(/\s+/);
        bioTextEl.innerHTML = words.map(word => {
            return `<span class="bio-word" style="display:inline-block; opacity:0; transform:translateY(20px); margin-right: 0.25em;">${word}</span>`;
        }).join("");

        const bioWords = bioTextEl.querySelectorAll('.bio-word');
        const containerWidth = bioTextEl.offsetWidth;
        
        bioWords.forEach(word => {
            const leftOffset = word.offsetLeft;
            word.style.backgroundSize = `${containerWidth}px auto`;
            word.style.backgroundPosition = `-${leftOffset}px 0px`;
        });
    }

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
    .to(heroName, {
        top: finalTopVH + "vh",
        left: finalLeftVW + "vw",
        scale: finalScale,
        duration: 1.2,
        ease: "power4.inOut",
        force3D: true
    }, "move")

    .to(".card", {
        opacity: 1,
        y: 0,
        duration: 2,
        stagger: 0.05,
        ease: "power3.out",
        clearProps: "transform",
        force3D: true
    }, "move+=0.2")

    .to(".bio-word", {
        opacity: 1,
        y: 0,
        duration: 2,
        stagger: 0.02,
        ease: "power3.out",
        force3D: true
    }, "move+=0.6")
    .add(() => {
        // On libère l'interaction AVANT la fin totale des animations de texte
        document.body.style.overflowY = "auto";
        gsap.set(".preloader", { pointerEvents: "none" });
        // On initialise l'état GSAP du bouton et des logos pour éviter le bug au premier clic
        gsap.set([".top-nav-container", ".logos-fixed-wrapper"], { y: "0vh", opacity: 0 });
        gsap.to([".top-nav-container", ".logos-fixed-wrapper"], { opacity: 1, duration: 0.8 });
        window.preloaderFinished = true;
    }, "move+=0.4")
    .eventCallback("onComplete", () => {
        // Le callback final reste pour la propreté mais le flag est déjà levé
    });
}