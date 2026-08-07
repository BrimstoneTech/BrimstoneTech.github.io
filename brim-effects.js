// BrimstoneTech — restrained, section-aware interaction polish.
(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    function addSectionEmbers() {
        const host = document.querySelector(".hero, .brio-hero");
        if (!host || reduceMotion.matches) return;

        const layer = document.createElement("div");
        layer.className = "brim-section-embers";
        layer.setAttribute("aria-hidden", "true");

        const count = window.innerWidth < 700 ? 7 : 12;
        for (let i = 0; i < count; i += 1) {
            const ember = document.createElement("i");
            ember.style.setProperty("--x", `${8 + Math.random() * 84}%`);
            ember.style.setProperty("--y", `${30 + Math.random() * 62}%`);
            ember.style.setProperty("--drift", `${-10 + Math.random() * 20}px`);
            ember.style.setProperty("--delay", `${Math.random() * -10}s`);
            ember.style.setProperty("--duration", `${8 + Math.random() * 8}s`);
            layer.appendChild(ember);
        }
        host.appendChild(layer);
    }

    function addCardPolish() {
        if (!finePointer.matches || reduceMotion.matches) return;
        document.querySelectorAll(".service-card, .work-card-small, .coming-card, .capability-card, .gen-node").forEach(card => {
            card.addEventListener("pointerenter", () => card.classList.add("brim-card-active"));
            card.addEventListener("pointerleave", () => card.classList.remove("brim-card-active"));
        });
    }

    function init() {
        addSectionEmbers();
        addCardPolish();
        document.documentElement.classList.add("brim-effects-ready");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
