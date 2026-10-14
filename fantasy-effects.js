const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileMotionQuery = window.matchMedia("(max-width: 780px), (pointer: coarse)");
const prefersLeanExperience = () => prefersReducedMotion || mobileMotionQuery.matches;

const style = document.createElement("style");
style.textContent = `
    :root {
        --fx-gold: rgba(240, 223, 176, 0.86);
        --fx-emerald: rgba(139, 186, 153, 0.58);
    }

    .fantasy-atmosphere {
        position: fixed;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 2;
        mix-blend-mode: screen;
    }

    .fantasy-canvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        opacity: 0.72;
    }

    .site-shell,
    body > header,
    body > main,
    body > footer {
        position: relative;
        z-index: 1;
    }

    .cursor-wisp {
        position: fixed;
        left: 0;
        top: 0;
        width: 1.7rem;
        height: 1.7rem;
        border-radius: 999px;
        pointer-events: none;
        z-index: 60;
        opacity: 0;
        background:
            radial-gradient(circle, rgba(255, 246, 210, 0.82) 0 12%, rgba(220, 191, 131, 0.36) 35%, transparent 72%);
        filter: blur(0.5px);
        transform: translate3d(-50%, -50%, 0);
        transition: opacity 240ms ease, transform 120ms ease-out;
        mix-blend-mode: screen;
    }

    .realm-compass {
        position: fixed;
        right: 1rem;
        top: 50%;
        z-index: 25;
        display: grid;
        gap: 0.25rem;
        padding: 0.75rem 0.8rem;
        max-width: 12rem;
        border: 1px solid rgba(220, 191, 131, 0.24);
        border-radius: 18px;
        background: rgba(7, 14, 12, 0.7);
        color: var(--fx-gold);
        backdrop-filter: blur(14px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.34);
        transform: translateY(-50%);
    }

    .realm-compass span {
        color: rgba(217, 212, 196, 0.78);
        font: 700 0.62rem/1.2 system-ui, sans-serif;
        letter-spacing: 0.13em;
        text-transform: uppercase;
    }

    .realm-compass strong {
        font: 600 0.95rem/1.18 Georgia, serif;
    }

    .arcane-portal {
        position: absolute;
        right: clamp(1rem, 6vw, 6rem);
        top: clamp(5rem, 12vh, 8rem);
        width: clamp(8rem, 17vw, 16rem);
        aspect-ratio: 1;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
        opacity: 0.55;
        background:
            radial-gradient(circle, transparent 43%, rgba(240, 223, 176, 0.23) 44% 46%, transparent 48%),
            conic-gradient(from 20deg, transparent 0 12%, rgba(139, 186, 153, 0.32) 14% 18%, transparent 20% 34%, rgba(240, 223, 176, 0.28) 36% 40%, transparent 42% 100%);
        filter: drop-shadow(0 0 24px rgba(220, 191, 131, 0.2));
        animation: portalTurn 22s linear infinite, portalPulse 5.5s ease-in-out infinite;
    }

    .arcane-portal::before,
    .arcane-portal::after {
        content: "";
        position: absolute;
        inset: 16%;
        border-radius: 50%;
        border: 1px solid rgba(240, 223, 176, 0.36);
    }

    .arcane-portal::after {
        inset: 31%;
        border-style: dashed;
        animation: portalTurn 14s linear reverse infinite;
    }

    .floating-relics {
        position: fixed;
        inset: 0;
        z-index: 3;
        pointer-events: none;
        overflow: hidden;
    }

    .floating-relic {
        position: absolute;
        color: rgba(240, 223, 176, 0.32);
        font: 600 var(--relic-size, 2rem)/1 Georgia, serif;
        text-shadow: 0 0 20px rgba(220, 191, 131, 0.24);
        animation: relicDrift var(--relic-duration, 16s) ease-in-out var(--relic-delay, 0s) infinite;
    }

    .section-header,
    .catalog-toolbar,
    .footer-card,
    .footer-box {
        position: relative;
    }

    .section-header::after,
    .catalog-toolbar::after {
        content: "";
        position: absolute;
        right: 0;
        bottom: -0.8rem;
        width: min(15rem, 44vw);
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(220, 191, 131, 0.72), transparent);
        transform-origin: right;
        animation: lineAwaken 4s ease-in-out infinite;
    }

    .lore-card::after,
    .theme-card::after,
    .featured-card::after,
    .result-card::after,
    .topic-card::after,
    .book-card::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background:
            radial-gradient(circle at var(--card-light-x, 50%) var(--card-light-y, 0%), rgba(240, 223, 176, 0.16), transparent 34%);
        opacity: 0;
        transition: opacity 220ms ease;
    }

    .lore-card:hover::after,
    .theme-card:hover::after,
    .featured-card:hover::after,
    .result-card:hover::after,
    .topic-card:hover::after,
    .book-card:hover::after {
        opacity: 1;
    }

    .fantasy-spark {
        position: absolute;
        width: 0.38rem;
        height: 0.38rem;
        border-radius: 999px;
        background: radial-gradient(circle, var(--fx-gold), transparent 68%);
        opacity: 0;
        transform: translate3d(0, 0, 0);
        animation: fantasySparkDrift var(--spark-duration, 9s) ease-in-out var(--spark-delay, 0s) infinite;
    }

    .fx-reveal {
        opacity: 0;
        transform: translateY(24px) scale(0.985);
        filter: blur(7px);
        transition:
            opacity 760ms ease,
            transform 760ms cubic-bezier(0.2, 0.78, 0.25, 1),
            filter 760ms ease;
    }

    .fx-reveal.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }

    .fx-float {
        animation: fantasyFloat 7s ease-in-out infinite;
    }

    .fx-float:nth-child(2n) {
        animation-duration: 8.5s;
        animation-delay: -1.5s;
    }

    .fx-float:nth-child(3n) {
        animation-duration: 9.5s;
        animation-delay: -2.6s;
    }

    .fx-glimmer {
        position: relative;
        overflow: hidden;
    }

    .fx-glimmer::after {
        content: "";
        position: absolute;
        inset: -45%;
        background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.18), transparent 62%);
        transform: translateX(-62%) rotate(8deg);
        animation: fantasyGlimmer 6.2s ease-in-out infinite;
        pointer-events: none;
    }

    .fx-aura {
        animation: fantasyAura 5s ease-in-out infinite;
    }

    .fx-breathe {
        animation: fantasyBreathe 4.8s ease-in-out infinite;
    }

    .fx-parallax {
        transform: translate3d(var(--fx-x, 0), var(--fx-y, 0), 0);
        transition: transform 300ms ease-out;
    }

    .button,
    .theme-card,
    .lore-card,
    .featured-card,
    .result-card,
    .topic-card,
    .book-card {
        will-change: transform;
    }

    .button:hover,
    .theme-card:hover,
    .lore-card:hover,
    .featured-card:hover,
    .result-card:hover,
    .topic-card:hover,
    .book-card:hover {
        animation: fantasyHoverPulse 900ms ease both;
    }

    @keyframes fantasySparkDrift {
        0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.55); }
        12% { opacity: 0.95; }
        50% { opacity: 0.48; transform: translate3d(var(--spark-x, 24px), -46px, 0) scale(1); }
        88% { opacity: 0.86; }
        100% { opacity: 0; transform: translate3d(calc(var(--spark-x, 24px) * -0.45), -92px, 0) scale(0.62); }
    }

    @keyframes fantasyFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(0.35deg); }
    }

    @keyframes fantasyGlimmer {
        0%, 58% { transform: translateX(-68%) rotate(8deg); opacity: 0; }
        68% { opacity: 1; }
        86%, 100% { transform: translateX(68%) rotate(8deg); opacity: 0; }
    }

    @keyframes fantasyAura {
        0%, 100% { box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18), 0 0 0 rgba(220, 191, 131, 0); }
        50% { box-shadow: 0 22px 54px rgba(0, 0, 0, 0.28), 0 0 34px rgba(220, 191, 131, 0.16); }
    }

    @keyframes fantasyBreathe {
        0%, 100% { filter: saturate(1) brightness(1); }
        50% { filter: saturate(1.12) brightness(1.08); }
    }

    @keyframes fantasyHoverPulse {
        0% { transform: translateY(0); }
        45% { transform: translateY(-4px); }
        100% { transform: translateY(-2px); }
    }

    @keyframes portalTurn {
        to { transform: rotate(360deg); }
    }

    @keyframes portalPulse {
        0%, 100% { opacity: 0.38; filter: drop-shadow(0 0 18px rgba(220, 191, 131, 0.14)); }
        50% { opacity: 0.72; filter: drop-shadow(0 0 34px rgba(139, 186, 153, 0.22)); }
    }

    @keyframes relicDrift {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(-4deg); opacity: 0.12; }
        35% { opacity: 0.44; }
        50% { transform: translate3d(18px, -38px, 0) rotate(7deg); opacity: 0.32; }
        78% { opacity: 0.5; }
    }

    @keyframes lineAwaken {
        0%, 100% { transform: scaleX(0.24); opacity: 0.3; }
        50% { transform: scaleX(1); opacity: 0.92; }
    }

    @media (prefers-reduced-motion: reduce) {
        .fantasy-spark,
        .fantasy-canvas,
        .cursor-wisp,
        .floating-relic,
        .arcane-portal,
        .fx-float,
        .fx-glimmer::after,
        .fx-aura,
        .fx-breathe {
            animation: none !important;
        }

        .fx-reveal {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
        }

        .realm-compass {
            display: none;
        }
    }

    @media (max-width: 780px), (pointer: coarse) {
        .fantasy-atmosphere,
        .fantasy-canvas,
        .cursor-wisp,
        .floating-relics,
        .realm-compass,
        .arcane-portal {
            display: none !important;
        }

        .fx-float,
        .fx-aura,
        .fx-breathe,
        .fx-glimmer::after,
        .button:hover,
        .theme-card:hover,
        .lore-card:hover,
        .featured-card:hover,
        .result-card:hover,
        .topic-card:hover,
        .book-card:hover {
            animation: none !important;
        }

        .fx-reveal {
            opacity: 1;
            transform: none;
            filter: none;
            transition: opacity 180ms ease;
        }
    }
`;
document.head.append(style);

const addArcaneCanvas = () => {
    if (prefersLeanExperience() || document.querySelector(".fantasy-canvas")) {
        return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
        return;
    }

    canvas.className = "fantasy-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    const nodes = Array.from({ length: 42 }, (_, index) => ({
        x: (index * 137.5) % 100,
        y: 8 + ((index * 29) % 88),
        radius: 0.6 + (index % 5) * 0.22,
        phase: index * 0.43,
        speed: 0.18 + (index % 7) * 0.025
    }));

    const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * ratio);
        canvas.height = Math.floor(window.innerHeight * ratio);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time = 0) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const t = time * 0.001;

        context.clearRect(0, 0, width, height);
        context.lineWidth = 1;

        nodes.forEach((node, index) => {
            const x = (node.x / 100) * width + Math.sin(t * node.speed + node.phase) * 18;
            const y = (node.y / 100) * height + Math.cos(t * node.speed * 0.9 + node.phase) * 14;
            const glow = 0.22 + Math.sin(t + node.phase) * 0.14;

            context.beginPath();
            context.fillStyle = `rgba(240, 223, 176, ${0.18 + glow})`;
            context.arc(x, y, node.radius, 0, Math.PI * 2);
            context.fill();

            const next = nodes[(index + 7) % nodes.length];
            const nx = (next.x / 100) * width + Math.sin(t * next.speed + next.phase) * 18;
            const ny = (next.y / 100) * height + Math.cos(t * next.speed * 0.9 + next.phase) * 14;
            const distance = Math.hypot(nx - x, ny - y);

            if (distance < 210) {
                context.beginPath();
                context.strokeStyle = `rgba(139, 186, 153, ${Math.max(0, 0.18 - distance / 1400)})`;
                context.moveTo(x, y);
                context.lineTo(nx, ny);
                context.stroke();
            }
        });

        const cometX = ((t * 38) % (width + 260)) - 130;
        const cometY = height * 0.18 + Math.sin(t * 0.7) * 42;
        const gradient = context.createLinearGradient(cometX - 130, cometY - 44, cometX + 38, cometY + 12);
        gradient.addColorStop(0, "rgba(240, 223, 176, 0)");
        gradient.addColorStop(0.68, "rgba(240, 223, 176, 0.18)");
        gradient.addColorStop(1, "rgba(255, 247, 220, 0.68)");
        context.beginPath();
        context.strokeStyle = gradient;
        context.lineWidth = 2;
        context.moveTo(cometX - 130, cometY - 44);
        context.lineTo(cometX + 38, cometY + 12);
        context.stroke();

        requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(draw);
};

const addAtmosphere = () => {
    if (prefersLeanExperience() || document.querySelector(".fantasy-atmosphere")) {
        return;
    }

    const atmosphere = document.createElement("div");
    atmosphere.className = "fantasy-atmosphere";
    atmosphere.setAttribute("aria-hidden", "true");

    Array.from({ length: 30 }).forEach((_, index) => {
        const spark = document.createElement("span");
        spark.className = "fantasy-spark";
        spark.style.left = `${(index * 29) % 100}%`;
        spark.style.top = `${18 + ((index * 17) % 76)}%`;
        spark.style.setProperty("--spark-duration", `${7 + (index % 6)}s`);
        spark.style.setProperty("--spark-delay", `${-(index % 9)}s`);
        spark.style.setProperty("--spark-x", `${index % 2 === 0 ? 34 : -28}px`);
        atmosphere.append(spark);
    });

    document.body.prepend(atmosphere);
};

const addHeroPortal = () => {
    if (prefersLeanExperience()) {
        return;
    }

    const hero = document.querySelector(".hero");

    if (!hero || hero.querySelector(".arcane-portal")) {
        return;
    }

    const portal = document.createElement("div");
    portal.className = "arcane-portal";
    portal.setAttribute("aria-hidden", "true");
    hero.prepend(portal);
};

const addFloatingRelics = () => {
    if (prefersLeanExperience() || document.querySelector(".floating-relics")) {
        return;
    }

    const layer = document.createElement("div");
    layer.className = "floating-relics";
    layer.setAttribute("aria-hidden", "true");

    ["✦", "ᚠ", "✧", "☾", "ᚱ", "✶", "ᛉ", "✺"].forEach((symbol, index) => {
        const relic = document.createElement("span");
        relic.className = "floating-relic";
        relic.textContent = symbol;
        relic.style.left = `${8 + ((index * 17) % 82)}%`;
        relic.style.top = `${12 + ((index * 23) % 76)}%`;
        relic.style.setProperty("--relic-size", `${1.25 + (index % 4) * 0.42}rem`);
        relic.style.setProperty("--relic-duration", `${13 + (index % 5) * 2}s`);
        relic.style.setProperty("--relic-delay", `${-index * 1.4}s`);
        layer.append(relic);
    });

    document.body.prepend(layer);
};

const addCursorWisp = () => {
    if (prefersLeanExperience() || document.querySelector(".cursor-wisp")) {
        return;
    }

    const wisp = document.createElement("div");
    wisp.className = "cursor-wisp";
    wisp.setAttribute("aria-hidden", "true");
    document.body.append(wisp);

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    window.addEventListener("pointermove", (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        wisp.style.opacity = "1";
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
        wisp.style.opacity = "0";
    }, { passive: true });

    const tick = () => {
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        wisp.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
};

const addRealmCompass = () => {
    if (prefersLeanExperience()) {
        return;
    }

    const sections = [...document.querySelectorAll("main section[id]")];

    if (sections.length === 0 || document.querySelector(".realm-compass")) {
        return;
    }

    const labels = new Map([
        ["inicio", "Portal do Bosque"],
        ["panorama", "Três Portas"],
        ["afinidade", "Oráculo"],
        ["autores", "Arquivo dos Magos"],
        ["glossario", "Glossário Arcano"],
        ["estante", "Estante Encantada"],
        ["relicario", "Relicário"],
        ["oraculo", "Busca do Oráculo"],
        ["compra", "Ficha da Obra"]
    ]);

    const compass = document.createElement("aside");
    compass.className = "realm-compass";
    compass.setAttribute("aria-live", "polite");
    compass.innerHTML = "<span>Reino atual</span><strong>Portal do Bosque</strong>";
    document.body.append(compass);

    if (!("IntersectionObserver" in window)) {
        return;
    }

    const target = compass.querySelector("strong");
    const observer = new IntersectionObserver((entries) => {
        const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry && target) {
            target.textContent = labels.get(visibleEntry.target.id) || visibleEntry.target.id;
        }
    }, {
        threshold: [0.28, 0.48, 0.68]
    });

    sections.forEach((section) => observer.observe(section));
};

const revealSelectors = [
    ".section",
    ".catalog-panel",
    ".lore-card",
    ".affinity-panel",
    ".affinity-result-card",
    ".author-card",
    ".featured-card",
    ".result-card",
    ".theme-card",
    ".topic-card",
    ".book-card",
    ".footer-card",
    ".footer-box"
].join(",");

let revealObserver = null;

const prepareRevealElement = (element, index = 0) => {
    if (element.classList.contains("fx-reveal")) {
        return;
    }

    element.classList.add("fx-reveal");
    element.style.transitionDelay = `${Math.min(index % 8, 6) * 45}ms`;

    if (prefersLeanExperience() || !revealObserver) {
        element.classList.add("is-visible");
        return;
    }

    revealObserver.observe(element);
};

const addReveal = () => {
    const revealElements = [...document.querySelectorAll(revealSelectors)];

    if (!prefersLeanExperience() && "IntersectionObserver" in window) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.16,
            rootMargin: "0px 0px -8% 0px"
        });
    }

    revealElements.forEach(prepareRevealElement);
};

const motionSelectors = {
    floating: ".hero-stage, .hero-visual, .brand-mark, .knot",
    aura: ".hero-stage, .purchase-panel, .search-parchment",
    glimmer: ".hero-visual, .book-cover-shell, .cover-shell",
    parallax: ".hero-stage, .knot"
};

const addMotionClasses = (root = document) => {
    if (prefersLeanExperience()) {
        return;
    }

    root.querySelectorAll(motionSelectors.floating).forEach((element) => {
        element.classList.add("fx-float");
    });

    root.querySelectorAll(motionSelectors.aura).forEach((element) => {
        element.classList.add("fx-aura");
    });

    root.querySelectorAll(motionSelectors.glimmer).forEach((element) => {
        element.classList.add("fx-glimmer", "fx-breathe");
    });

    root.querySelectorAll(motionSelectors.parallax).forEach((element) => {
        element.classList.add("fx-parallax");
    });
};

const watchDynamicContent = () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }

                if (node.matches(revealSelectors)) {
                    prepareRevealElement(node);
                }

                node.querySelectorAll(revealSelectors).forEach(prepareRevealElement);

                if (!prefersLeanExperience()) {
                    addMotionClasses(node);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

const addPointerParallax = () => {
    if (prefersLeanExperience()) {
        return;
    }

    window.addEventListener("pointermove", (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 10;
        const y = (event.clientY / window.innerHeight - 0.5) * 10;

        document.querySelectorAll(".fx-parallax").forEach((element, index) => {
            const depth = 0.28 + (index % 4) * 0.14;
            element.style.setProperty("--fx-x", `${x * depth}px`);
            element.style.setProperty("--fx-y", `${y * depth}px`);
        });
    }, { passive: true });
};

const addCardLightTracking = () => {
    if (prefersLeanExperience()) {
        return;
    }

    document.addEventListener("pointermove", (event) => {
        const card = event.target.closest?.(".lore-card, .theme-card, .featured-card, .result-card, .topic-card, .book-card");

        if (!card) {
            return;
        }

        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--card-light-x", `${x}%`);
        card.style.setProperty("--card-light-y", `${y}%`);
    }, { passive: true });
};

const initFantasyEffects = () => {
    if (!document.body.classList.contains("page-home")) return;
    addArcaneCanvas();
    addAtmosphere();
    addHeroPortal();
    addFloatingRelics();


    addMotionClasses();
    addReveal();
    watchDynamicContent();
    addPointerParallax();
    addCardLightTracking();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFantasyEffects, { once: true });
} else {
    initFantasyEffects();
}
