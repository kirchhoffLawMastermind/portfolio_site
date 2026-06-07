export async function initCards() {
    const container = document.querySelector('.cards-container');
    if (!container) return;

    let projects = [];
    try {
        const response = await fetch('projects.json');
        projects = await response.json();
    } catch (error) {
        console.error("Erreur lors du chargement des projets:", error);
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="card" data-description="${project.description}">
            <img src="${project.image}" alt="${project.title}">
            <div class="card-content">${project.title}</div>
        </div>
    `).join("");

    // Les cartes restent visibles ; c'est tout le .portfolio-wrapper qui est
    // masqué puis révélé par la séquence storytelling (voir story.js / preloader.js).
    const contentWidth = container.scrollWidth;

    const originalContent = container.innerHTML;
    container.innerHTML = originalContent.repeat(4);

    let xPos = 0;
    let baseSpeed = 0.5;
    window.isProjectOpen = false;

    container.addEventListener("click", (e) => {
        const card = e.target.closest(".card");
        if (!card) return;

        window.isProjectOpen = true;

        const imgPath = card.querySelector("img").src;
        const titleText = card.querySelector(".card-content").textContent;
        const descriptionText = card.dataset.description;

        const imgEl = document.getElementById("project-view-img");
        const titleEl = document.getElementById("project-view-title");
        const descEl = document.getElementById("project-view-desc");

        const allCards = Array.from(container.querySelectorAll(".card"));
        const clickedIndex = allCards.indexOf(card);
        const groupStart = Math.floor(clickedIndex / projects.length) * projects.length;
        const groupCards = allCards.slice(groupStart, groupStart + projects.length);

        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const targetX = (window.innerWidth / 2) - cardCenter;

        const tl = gsap.timeline();

        allCards.forEach(c => {
            if (!groupCards.includes(c)) {

                gsap.to(c, { opacity: 0, scale: 0.8, duration: 0.5, pointerEvents: "none" });
            } else {

                c.style.pointerEvents = "auto";
                if (c === card) {
                    c.classList.add("is-selected");
                    gsap.to(c, { opacity: 1, scale: 1.2, duration: 1.2, ease: "power4.inOut" });
                } else {
                    c.classList.remove("is-selected");
                    gsap.to(c, { opacity: 0.5, scale: 0.9, duration: 1.2, ease: "power4.inOut" });
                }
            }
        });

        if (card.classList.contains("was-open-flag")) {

        }

        gsap.to(container, {
            x: targetX,
            duration: 1.2,
            ease: "power4.inOut",
            onUpdate: function() {

                xPos = gsap.getProperty(container, "x");
            }
        });

        container.dataset.isOpen = "true";

        if (container.dataset.dockActive === "true" && imgEl.src && imgEl.src.includes(imgPath.split('/').pop())) {

             return;
        }

        if (container.dataset.dockActive === "true") {

            const swapTl = gsap.timeline();
            swapTl.to([imgEl, titleEl, descEl], { opacity: 0, duration: 0.3, y: 15 })
              .call(() => {
                  imgEl.src = imgPath;
                  titleEl.textContent = titleText;
                  if (descEl) descEl.textContent = descriptionText;
              })
              .to([imgEl, titleEl, descEl], { opacity: 1, duration: 0.3, y: 0 });
            return;
        }

        container.dataset.dockActive = "true";
        imgEl.src = imgPath;
        titleEl.textContent = titleText;
        if (descEl) descEl.textContent = descriptionText;

        tl.to(["#hero-name", ".bio-section"], {
            y: "-15vh",
            opacity: 0,
            duration: 1.2,
            ease: "power4.inOut"
        }, 0);

        tl.to(".portfolio-wrapper", {
            y: "-45vh",
            scale: 0.4,
            transformOrigin: "center top",
            duration: 1.2,
            ease: "power4.inOut"
        }, 0);

        tl.to("#project-view", {
            y: "0vh",
            duration: 1.2,
            ease: "power4.inOut"
        }, 0);

        tl.to([".top-nav-container", ".logos-fixed-wrapper"], {
            y: "-15vh",
            opacity: 0,
            pointerEvents: "none",
            duration: 1.2,
            ease: "power4.inOut"
        }, 0);
    });

    document.getElementById("close-project").addEventListener("click", () => {
        window.isProjectOpen = false;
        container.dataset.dockActive = "false";
        const allCards = Array.from(container.querySelectorAll(".card"));

        const tl = gsap.timeline();

        allCards.forEach(c => {
            c.classList.remove("is-selected");
            c.style.pointerEvents = "auto";
            gsap.to(c, { opacity: 1, scale: 1, duration: 1, ease: "power4.inOut" });
        });

        tl.to("#project-view", {
            y: "100vh",
            duration: 1,
            ease: "power4.inOut"
        }, 0);

        tl.to(".portfolio-wrapper", {
            y: "0vh",
            scale: 1,
            duration: 1,
            ease: "power4.inOut"
        }, 0);

        tl.to(["#hero-name", ".bio-section"], {
            y: "0vh",
            opacity: 1,
            duration: 1,
            ease: "power4.inOut"
        }, 0);

        tl.to([".top-nav-container", ".logos-fixed-wrapper"], {
            y: "0vh",
            opacity: 1,
            pointerEvents: "auto",
            duration: 1,
            ease: "power4.inOut"
        }, 0);
    });

    function render() {

        if (window.preloaderFinished) {

            if (!window.isProjectOpen) {
                let currentSpeed = baseSpeed;

                if (window.lenis && window.lenis.velocity) {
                    currentSpeed += window.lenis.velocity * 0.4;
                }

                xPos -= currentSpeed;

                if (xPos <= -contentWidth) {
                    xPos += contentWidth;
                }
                if (xPos > 0) {
                    xPos -= contentWidth;
                }

                gsap.set(container, { x: xPos });
            }
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}