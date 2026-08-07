// BrimstoneTech — ambient forge background and restrained interaction polish.
(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const palette = {
        ember: [232, 113, 10],
        flame: [245, 158, 11],
        gold: [251, 191, 36]
    };

    function installAmbientStyles() {
        const style = document.createElement("style");
        style.id = "brim-ambient-styles";
        style.textContent = `
            html { background: #0D0B0A; }
            body.brim-ambient-page { background-color: transparent !important; }
            #brim-ambient-canvas {
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                z-index: 0;
                pointer-events: none;
            }
            body.brim-ambient-page > main,
            body.brim-ambient-page > section,
            body.brim-ambient-page > footer,
            body.brim-ambient-page > .c,
            body.brim-ambient-page > .ticker-wrap,
            body.brim-ambient-page > .visitor-counter-section {
                position: relative;
                z-index: 2;
            }
            body.brim-ambient-page > nav,
            body.brim-ambient-page > header { z-index: 20; }

            /* Let the forge atmosphere show through without reducing card contrast. */
            body.brim-ambient-page #services,
            body.brim-ambient-page #coming-soon,
            body.brim-ambient-page #contact {
                background-color: rgba(26, 17, 16, .88) !important;
            }
            body.brim-ambient-page #work,
            body.brim-ambient-page #about {
                background-color: rgba(13, 11, 10, .86) !important;
            }
            body.brim-ambient-page .conversion {
                background-color: rgba(26, 17, 16, .9) !important;
            }
            .brim-card-active { border-color: rgba(232, 113, 10, .24) !important; }
        `;
        document.head.appendChild(style);
    }

    function createAmbientForge() {
        const canvas = document.createElement("canvas");
        canvas.id = "brim-ambient-canvas";
        canvas.setAttribute("aria-hidden", "true");
        document.body.prepend(canvas);
        document.body.classList.add("brim-ambient-page");

        const context = canvas.getContext("2d", { alpha: true });
        if (!context) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let animationFrame = 0;
        let lastTime = performance.now();
        let visible = true;
        let stars = [];
        let embers = [];
        let flames = [];

        const random = (min, max) => min + Math.random() * (max - min);

        function buildScene() {
            const mobile = width < 700;
            const starCount = mobile ? 30 : 56;
            const emberCount = mobile ? 18 : 34;
            const flameCount = mobile ? 7 : 12;

            stars = Array.from({ length: starCount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height * .93,
                radius: random(.35, 1.15),
                alpha: random(.045, .17),
                phase: random(0, Math.PI * 2),
                speed: random(.00025, .00065),
                warm: Math.random() > .72
            }));

            embers = Array.from({ length: emberCount }, () => makeEmber(true));
            flames = Array.from({ length: flameCount }, (_, index) => ({
                x: ((index + .5) / flameCount) * width + random(-24, 24),
                width: random(mobile ? 34 : 54, mobile ? 68 : 110),
                height: random(mobile ? 34 : 52, mobile ? 72 : 105),
                phase: random(0, Math.PI * 2),
                speed: random(.0007, .00125),
                lean: random(-12, 12),
                alpha: random(.065, .12)
            }));
        }

        function makeEmber(scattered = false) {
            const life = random(5800, 12000);
            return {
                x: random(0, width),
                y: scattered ? random(0, height) : height + random(4, 32),
                radius: random(.45, 1.55),
                speed: random(.018, .055),
                drift: random(-.014, .014),
                wobble: random(0, Math.PI * 2),
                wobbleSpeed: random(.00045, .0011),
                alpha: random(.1, .27),
                life,
                age: scattered ? random(0, life) : 0,
                gold: Math.random() > .7
            };
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            buildScene();
        }

        function drawStars(time) {
            for (const star of stars) {
                const twinkle = reduceMotion.matches ? 1 : .76 + Math.sin(time * star.speed + star.phase) * .24;
                const [r, g, b] = star.warm ? palette.flame : palette.ember;
                context.beginPath();
                context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.alpha * twinkle})`;
                context.fill();
            }
        }

        function drawFlameBed(time) {
            const bed = context.createLinearGradient(0, height - 95, 0, height);
            bed.addColorStop(0, "rgba(232, 113, 10, 0)");
            bed.addColorStop(.64, "rgba(232, 113, 10, .025)");
            bed.addColorStop(1, "rgba(245, 158, 11, .105)");
            context.fillStyle = bed;
            context.fillRect(0, height - 100, width, 100);

            for (const flame of flames) {
                const wave = reduceMotion.matches ? 0 : Math.sin(time * flame.speed + flame.phase);
                const flameHeight = flame.height * (1 + wave * .12);
                const lean = flame.lean + wave * 7;
                const baseY = height + 8;
                const topY = baseY - flameHeight;
                const gradient = context.createLinearGradient(0, topY, 0, baseY);
                gradient.addColorStop(0, "rgba(251, 191, 36, 0)");
                gradient.addColorStop(.34, `rgba(245, 158, 11, ${flame.alpha * .52})`);
                gradient.addColorStop(1, `rgba(232, 113, 10, ${flame.alpha})`);

                context.beginPath();
                context.moveTo(flame.x - flame.width / 2, baseY);
                context.bezierCurveTo(
                    flame.x - flame.width * .34,
                    baseY - flameHeight * .35,
                    flame.x + lean - flame.width * .1,
                    topY + flameHeight * .18,
                    flame.x + lean,
                    topY
                );
                context.bezierCurveTo(
                    flame.x + lean + flame.width * .12,
                    topY + flameHeight * .22,
                    flame.x + flame.width * .35,
                    baseY - flameHeight * .28,
                    flame.x + flame.width / 2,
                    baseY
                );
                context.closePath();
                context.fillStyle = gradient;
                context.fill();
            }

            const horizon = context.createRadialGradient(width / 2, height + 18, 0, width / 2, height + 18, width * .72);
            horizon.addColorStop(0, "rgba(245, 158, 11, .09)");
            horizon.addColorStop(.46, "rgba(232, 113, 10, .045)");
            horizon.addColorStop(1, "rgba(232, 113, 10, 0)");
            context.fillStyle = horizon;
            context.fillRect(0, height - 85, width, 100);
        }

        function drawEmbers(delta, time) {
            for (let index = 0; index < embers.length; index += 1) {
                let ember = embers[index];
                if (!reduceMotion.matches) {
                    ember.age += delta;
                    ember.y -= ember.speed * delta;
                    ember.wobble += ember.wobbleSpeed * delta;
                    ember.x += ember.drift * delta + Math.sin(ember.wobble) * .035;
                }

                if (ember.age > ember.life || ember.y < -14 || ember.x < -20 || ember.x > width + 20) {
                    ember = makeEmber(false);
                    embers[index] = ember;
                }

                const progress = ember.age / ember.life;
                const fade = Math.min(1, progress * 8) * Math.min(1, (1 - progress) * 4);
                const pulse = reduceMotion.matches ? 1 : .85 + Math.sin(time * .001 + ember.wobble) * .15;
                const [r, g, b] = ember.gold ? palette.gold : palette.ember;

                if (ember.radius > 1.05) {
                    const glow = context.createRadialGradient(ember.x, ember.y, 0, ember.x, ember.y, ember.radius * 4);
                    glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${ember.alpha * fade * pulse})`);
                    glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                    context.fillStyle = glow;
                    context.fillRect(ember.x - ember.radius * 4, ember.y - ember.radius * 4, ember.radius * 8, ember.radius * 8);
                } else {
                    context.beginPath();
                    context.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
                    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${ember.alpha * fade * pulse})`;
                    context.fill();
                }
            }
        }

        function draw(time) {
            const delta = Math.min(32, time - lastTime || 16);
            lastTime = time;
            context.clearRect(0, 0, width, height);
            drawStars(time);
            drawEmbers(delta, time);
            drawFlameBed(time);
        }

        function animate(time) {
            if (visible) draw(time);
            animationFrame = requestAnimationFrame(animate);
        }

        function handleVisibility() {
            visible = !document.hidden;
            lastTime = performance.now();
        }

        resize();
        window.addEventListener("resize", resize, { passive: true });
        document.addEventListener("visibilitychange", handleVisibility);

        if (reduceMotion.matches) {
            draw(performance.now());
        } else {
            animationFrame = requestAnimationFrame(animate);
        }

        reduceMotion.addEventListener?.("change", () => {
            cancelAnimationFrame(animationFrame);
            buildScene();
            if (reduceMotion.matches) {
                draw(performance.now());
            } else {
                lastTime = performance.now();
                animationFrame = requestAnimationFrame(animate);
            }
        });
    }

    function addCardPolish() {
        if (!finePointer.matches || reduceMotion.matches) return;
        document.querySelectorAll(".service-card, .work-card-small, .coming-card, .capability-card, .gen-node, .shop-card").forEach(card => {
            card.addEventListener("pointerenter", () => card.classList.add("brim-card-active"));
            card.addEventListener("pointerleave", () => card.classList.remove("brim-card-active"));
        });
    }

    function init() {
        installAmbientStyles();
        createAmbientForge();
        addCardPolish();
        document.documentElement.classList.add("brim-effects-ready");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
