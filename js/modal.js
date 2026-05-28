export function initModal() {
    const btn = document.getElementById("info-btn");
    const modal = document.getElementById("info-modal");
    const content = document.querySelector(".modal-content");

    const elementsToBlur = [".bg-grid", ".preloader", ".bio-section", ".portfolio-wrapper", "#info-btn"];

    btn.addEventListener("click", () => {
        const tl = gsap.timeline();

        tl.to(elementsToBlur, {
            filter: "blur(15px)",
            opacity: 0.1,
            duration: 0.8,
            ease: "power3.inOut"
        }, 0);

        gsap.set(modal, { visibility: "visible", pointerEvents: "auto" });
        tl.to(content, {
            opacity: 1,
            y: "0vh",
            duration: 1,
            ease: "power4.out"
        }, 0.2);
    });

    modal.addEventListener("click", (e) => {

        if (!e.target.closest(".info-card")) {
            closeModal();
        }
    });

    function closeModal() {
        const tl = gsap.timeline();

        tl.to(content, {
            opacity: 0,
            y: "10vh",
            duration: 0.6,
            ease: "power3.in"
        }, 0);

        tl.to(elementsToBlur, {
            filter: "blur(0px)",
            opacity: 1,
            clearProps: "filter",
            duration: 0.8,
            ease: "power3.inOut"
        }, 0.2);

        tl.set(modal, { visibility: "hidden", pointerEvents: "none" });
    }
}