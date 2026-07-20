<script>
// BrimstoneTech - Strong Punchy Visual Effects
(function() {
    'use strict';

    function initStrongEffects() {

        // === STRONG EMBER CANVAS (like your original) ===
        const canvas = document.createElement('canvas');
        canvas.id = 'brim-strong-embers';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '2';
        canvas.style.mixBlendMode = 'screen';
        canvas.style.opacity = '0.85';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        class StrongEmber {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + Math.random() * 100;
                this.size = Math.random() * 6 + 3;
                this.speedY = -(Math.random() * 4 + 2.5);
                this.speedX = (Math.random() - 0.5) * 2.5;
                this.opacity = Math.random() * 0.9 + 0.5;
                this.hueShift = Math.random() * 30 - 15;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.opacity -= 0.012;
                this.size *= 0.975;
                if (this.opacity <= 0 || this.y < -50) this.reset();
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.8);
                grad.addColorStop(0, `hsl(36, 100%, 85%)`);
                grad.addColorStop(0.5, `hsl(24, 100%, 65%)`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // More aggressive particle spawn
        setInterval(() => {
            for (let i = 0; i < 3; i++) {
                if (particles.length < 120) particles.push(new StrongEmber());
            }
        }, 16);

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }
        animate();

        // === PUNCHY CARD DISSOLVE / IGNITION ===
        document.querySelectorAll('div, section > div, .card, article').forEach((el, index) => {
            if (el.children.length > 0 || el.textContent.length > 30) {
                el.style.transition = 'all 0.5s cubic-bezier(0.23,1,0.32,1)';
                el.addEventListener('mouseenter', () => {
                    el.style.transform = 'scale(1.04) translateY(-12px)';
                    el.style.boxShadow = '0 0 55px rgba(248, 113, 10, 0.75)';
                    el.style.borderColor = '#FB923C';
                });
                el.addEventListener('mouseleave', () => {
                    el.style.transform = 'scale(1) translateY(0)';
                    el.style.boxShadow = '';
                    el.style.borderColor = '';
                });
            }
        });

        // === STRONG MAGNETIC + FLAME PULSE on CTAs ===
        document.querySelectorAll('a, button').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('contact') || btn.textContent.toLowerCase().includes('talk') || btn.style.background) {
                btn.style.transition = 'transform 0.2s';
                btn.addEventListener('mousemove', e => {
                    const rect = btn.getBoundingClientRect();
                    const x = (e.clientX - rect.left - rect.width / 2) * 0.35;
                    const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
                    btn.style.transform = `translate(${x}px, ${y}px) scale(1.08)`;
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'translate(0,0) scale(1)';
                });
            }
        });

        // === SCROLL IGNITION BURST ===
        let burstDone = false;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 450 && !burstDone) {
                burstDone = true;
                for (let i = 0; i < 45; i++) {
                    setTimeout(() => {
                        const burst = document.createElement('div');
                        burst.style.position = 'fixed';
                        burst.style.left = Math.random() * 100 + 'vw';
                        burst.style.top = Math.random() * 60 + 'vh';
                        burst.style.width = '8px';
                        burst.style.height = '8px';
                        burst.style.background = '#FBBF24';
                        burst.style.borderRadius = '50%';
                        burst.style.boxShadow = '0 0 20px #F59E0B';
                        burst.style.zIndex = '9999';
                        document.body.appendChild(burst);
                        setTimeout(() => burst.remove(), 1800);
                    }, i * 12);
                }
            }
        });

        console.log('%cStrong Brimstone Effects Loaded 🔥', 'color:#FF6B00; font-weight:bold; font-size:14px;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStrongEffects);
    } else {
        initStrongEffects();
    }
})();
</script>
