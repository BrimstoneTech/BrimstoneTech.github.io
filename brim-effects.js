<script>
// BrimstoneTech Smart Visual Effects - Auto-detects your existing page
(function() {
    'use strict';

    // Auto-detect common elements
    function initEffects() {

        // 1. Ember Particle Background (Hero)
        const hero = document.querySelector('section:first-child, .hero, header, .hero-section') || document.body;
        const canvas = document.createElement('canvas');
        canvas.id = 'brim-ember-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        canvas.style.opacity = '0.55';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        class Ember {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = canvas.height * (0.6 + Math.random() * 0.4);
                this.size = Math.random() * 4 + 1.8;
                this.speedY = -(Math.random() * 2.8 + 1);
                this.speedX = (Math.random() - 0.5) * 1.5;
                this.opacity = Math.random() * 0.75 + 0.35;
                this.life = 1;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.opacity -= 0.009;
                this.size *= 0.982;
                if (this.opacity <= 0 || this.y < -20) this.reset();
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size*2.2);
                grad.addColorStop(0, '#FFDD66');
                grad.addColorStop(0.5, '#E8710A');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        setInterval(() => {
            if (particles.length < 70) particles.push(new Ember());
        }, 28);

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();

        // 2. Auto Card / Box Ignition
        document.querySelectorAll('div, section > *').forEach(el => {
            const style = getComputedStyle(el);
            if (style.backgroundColor.includes('rgb') || style.border || el.children.length > 1) {
                el.style.transition = 'all 0.45s cubic-bezier(0.23, 1, 0.32, 1)';
                el.addEventListener('mouseenter', () => {
                    el.style.boxShadow = '0 0 40px rgba(232, 113, 10, 0.55)';
                    el.style.borderColor = '#F59E0B';
                });
                el.addEventListener('mouseleave', () => {
                    el.style.boxShadow = '';
                    el.style.borderColor = '';
                });
            }
        });

        // 3. Magnetic CTAs
        document.querySelectorAll('a, button').forEach(el => {
            if (el.textContent.toLowerCase().includes('contact') || 
                el.textContent.toLowerCase().includes('talk') || 
                el.classList.contains('cta') || 
                el.style.backgroundColor) {
                
                el.addEventListener('mousemove', e => {
                    const rect = el.getBoundingClientRect();
                    const x = (e.clientX - rect.left - rect.width/2) * 0.18;
                    const y = (e.clientY - rect.top - rect.height/2) * 0.18;
                    el.style.transform = `translate(${x}px, ${y}px)`;
                });
                el.addEventListener('mouseleave', () => el.style.transform = '');
            }
        });

        // 4. Scroll Spark Bursts
        let sparkTriggered = false;
        window.addEventListener('scroll', () => {
            if (window.scrollY > window.innerHeight * 0.5 && !sparkTriggered) {
                sparkTriggered = true;
                for (let i = 0; i < 30; i++) {
                    setTimeout(() => {
                        const s = document.createElement('div');
                        s.style.position = 'fixed';
                        s.style.left = Math.random() * 100 + 'vw';
                        s.style.top = (50 + Math.random() * 30) + 'vh';
                        s.style.width = '5px';
                        s.style.height = '5px';
                        s.style.background = '#FBBF24';
                        s.style.borderRadius = '50%';
                        s.style.zIndex = '9999';
                        s.style.opacity = '0.85';
                        document.body.appendChild(s);
                        setTimeout(() => s.remove(), 1400);
                    }, i * 16);
                }
            }
        });

        console.log('%cBrimstone Visual Effects Activated 🔥', 'color:#E8710A; font-size:13px;');
    }

    // Run when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEffects);
    } else {
        initEffects();
    }
})();
</script>
