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
        <div class="card" data-project-id="${project.id}">
            <img src="${project.image}" alt="${project.title}">
            <div class="card-content">${project.title}</div>
        </div>
    `).join("");

    const contentWidth = container.scrollWidth;

    const originalContent = container.innerHTML;
    container.innerHTML = originalContent.repeat(4);

    let xPos = 0;
    let baseSpeed = 0.5;
    window.isProjectOpen = false;


    function renderProjectDetails(project) {
        document.getElementById("project-view-title").textContent = project.title;
        document.getElementById("project-view-subtitle").textContent = project.subtitle || '';
        const descEl = document.getElementById("project-view-desc");
        const desc = project.description;
        if (Array.isArray(desc)) {
            descEl.innerHTML = desc.map(item => {
                if (typeof item === 'string') return `<p>${item}</p>`;
                if (item.img) {
                    const cap = item.caption ? `<span class="desc-img-caption">${item.caption}</span>` : '';
                    return `<figure class="desc-img-wrap"><img src="${item.img}" alt="${item.caption || ''}" class="desc-img">${cap}</figure>`;
                }
                return '';
            }).join('');
        } else {
            descEl.textContent = desc;
        }

        document.getElementById("project-view-apprentissages").innerHTML =
            project.apprentissages.map(a => `<li>${a}</li>`).join('');

        document.getElementById("project-view-resultats").innerHTML =
            project.resultats_cles.map(r => `<li>${r}</li>`).join('');

        document.getElementById("project-view-preuves").innerHTML =
            project.preuves.map(p => `
                <div class="preuve-item">
                    <span class="preuve-ref">${p.ref}</span>
                    <div class="preuve-details">
                        <div class="preuve-intitule">${p.intitule}</div>
                        <div class="preuve-meta">${p.source}, ${p.date}</div>
                    </div>
                </div>
            `).join('');

        document.getElementById("project-view-autoevaluation").innerHTML =
            Object.entries(project.auto_evaluation).map(([key, val]) => {
                const label = key.replace(/_/g, ' ');
                const cls = val === "Tout à fait d'accord" ? 'val-high' : 'val-medium';
                return `
                    <div class="autoeval-item">
                        <span class="autoeval-key">${label}</span>
                        <span class="autoeval-val ${cls}">${val}</span>
                    </div>
                `;
            }).join('');

        const scrollEl = document.querySelector('.project-info-scroll');
        if (scrollEl) scrollEl.scrollTop = 0;
    }

    container.addEventListener("click", (e) => {
        const card = e.target.closest(".card");
        if (!card) return;

        window.isProjectOpen = true;
        if (window.lenis) window.lenis.stop();
        document.body.classList.add('project-open');
        ScrollTrigger.getAll().forEach(st => st.disable(false, false));

        const projectId = parseInt(card.dataset.projectId, 10);
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const imgEl = document.getElementById("project-view-img");

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

        gsap.to(container, {
            x: targetX,
            duration: 1.2,
            ease: "power4.inOut",
            onUpdate: function() {
                xPos = gsap.getProperty(container, "x");
            }
        });

        container.dataset.isOpen = "true";

        if (container.dataset.dockActive === "true" && imgEl.src.endsWith(project.image.split('/').pop())) {
            const swapTl = gsap.timeline();
            const infoEls = ["#project-view-title", "#project-view-subtitle", "#project-view-desc",
                             "#project-view-apprentissages", "#project-view-resultats",
                             "#project-view-preuves", "#project-view-autoevaluation"];
            swapTl
                .to([imgEl, ...infoEls], { opacity: 0, duration: 0.3, y: 15 })
                .call(() => {
                    imgEl.src = project.image;
                    renderProjectDetails(project);
                })
                .to([imgEl, ...infoEls], { opacity: 1, duration: 0.3, y: 0 });
            return;
        }

        if (container.dataset.dockActive === "true") {
            const swapTl = gsap.timeline();
            const infoEls = ["#project-view-title", "#project-view-subtitle", "#project-view-desc",
                             "#project-view-apprentissages", "#project-view-resultats",
                             "#project-view-preuves", "#project-view-autoevaluation"];
            swapTl
                .to([imgEl, ...infoEls], { opacity: 0, duration: 0.3, y: 15 })
                .call(() => {
                    imgEl.src = project.image;
                    renderProjectDetails(project);
                })
                .to([imgEl, ...infoEls], { opacity: 1, duration: 0.3, y: 0 });
            return;
        }

        container.dataset.dockActive = "true";
        imgEl.src = project.image;
        renderProjectDetails(project);

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
        document.body.classList.remove('project-open');
        ScrollTrigger.getAll().forEach(st => st.enable(false, false));
        if (window.lenis) {
            window.lenis.start();
            window.lenis.scrollTo(window.innerHeight * 4.0, { immediate: true });
        }
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
